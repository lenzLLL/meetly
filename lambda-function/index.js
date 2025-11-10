import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const handler = async (event) => {
    try {
        await syncAllUserCalendars()
        await scheduleBotsForUpcomingMeetings()
        await syncAllUserCalendarsZoom()
        await getNewAudioUrl()

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'success' })
        }
    } catch (error) {
        console.error('error:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'internal server error', details: error.message })
        }
    } finally {
        await prisma.$disconnect()
    }
}

/* ---------------------------------------------------------
    ✅ GOOGLE CALENDAR (inchangé)
--------------------------------------------------------- */

async function syncAllUserCalendars() {
    const users = await prisma.user.findMany({
        where: {
            calendarConnected: true,
            googleAccessToken: {
                not: null
            }
        }
    })

    for (const user of users) {
        try {
            await syncUserCalendar(user)
        } catch (error) {
            console.error(`sync failed for ${user.id}:`, error.message)
        }
    }
}

async function syncUserCalendar(user) {
    try {
        let accessToken = user.googleAccessToken

        const now = new Date()
        const tokenExpiry = new Date(user.googleTokenExpiry)
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)

        if (tokenExpiry <= tenMinutesFromNow) {
            accessToken = await refreshGoogleToken(user)
            if (!accessToken) {
                return
            }
        }

        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${sevenDays.toISOString()}&` +
            `singleEvents=true&orderBy=startTime&showDeleted=true`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) {
            if (response.status === 401) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { calendarConnected: false }
                })
                return
            }
            throw new Error(`Calendar API failed: ${response.status}`)
        }

        const data = await response.json()
        const events = data.items || []

        const existingEvents = await prisma.meeting.findMany({
            where: {
                userId: user.id,
                isFromCalendar: true,
                type: "g",
                startTime: { gte: now }
            }
        })

        const googleEventIds = new Set()

        for (const event of events) {
            if (event.status === 'cancelled') {
                await handleDeletedEvent(event)
                continue
            }

            googleEventIds.add(event.id)
            await processEvent(user, event)
        }

        const deletedEvents = existingEvents.filter(
            dbEvent => !googleEventIds.has(dbEvent.calendarEventId)
        )

        for (const deletedEvent of deletedEvents) {
            await handleDeletedEventFromDB(deletedEvent)
        }

    } catch (error) {
        console.error(`calendar error for ${user.id}:`, error.message)
        if (error.message.includes('401') || error.message.includes('403')) {
            await prisma.user.update({
                where: { id: user.id },
                data: { calendarConnected: false }
            })
        }
    }
}

async function refreshGoogleToken(user) {
    try {
        if (!user.googleRefreshToken) {
            await prisma.user.update({
                where: { id: user.id },
                data: { calendarConnected: false, googleAccessToken: null }
            })
            return null
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: user.googleRefreshToken,
                grant_type: 'refresh_token'
            })
        })

        const tokens = await response.json()

        if (!tokens.access_token) {
            await prisma.user.update({
                where: { id: user.id },
                data: { calendarConnected: false }
            })
            return null
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000)
            }
        })

        return tokens.access_token
    } catch (error) {
        await prisma.user.update({
            where: { id: user.id },
            data: { calendarConnected: false }
        })
        return null
    }
}

async function handleDeletedEvent(event) {
    try {
        const exsistingMeeting = await prisma.meeting.findUnique({
            where: { calendarEventId: event.id }
        })
        if (exsistingMeeting) {
            await prisma.meeting.delete({
                where: { calendarEventId: event.id }
            })
        }
    } catch (error) {
        console.error('error deleting event:', error.message)
    }
}

async function handleDeletedEventFromDB(dbEvent) {
    await prisma.meeting.delete({
        where: { id: dbEvent.id }
    })
}

async function processEvent(user, event) {
    const meetingUrl =
        event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri

    if (!meetingUrl || !event.start?.dateTime) return

    const eventData = {
        calendarEventId: event.id,
        userId: user.id,
        title: event.summary || 'Untitled Meeting',
        description: event.description || null,
        meetingUrl,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        attendees: event.attendees
            ? JSON.stringify(event.attendees.map(a => a.email))
            : null,
        isFromCalendar: true,
        botScheduled: true,
        type: "g"
    }

    try {
        const existing = await prisma.meeting.findUnique({
            where: { calendarEventId: event.id }
        })

        if (existing) {
            const updateData = {
                title: eventData.title,
                description: eventData.description,
                meetingUrl: eventData.meetingUrl,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                attendees: eventData.attendees
            }

            if (!existing.botSent) {
                updateData.botScheduled = eventData.botScheduled
            }

            await prisma.meeting.update({
                where: { calendarEventId: event.id },
                data: updateData
            })
        } else {
            await prisma.meeting.create({ data: eventData })
        }

    } catch (error) {
        console.error(`error for ${event.id}:`, error.message)
    }
}

/* ---------------------------------------------------------
    ✅ BOTS (inchangé)
--------------------------------------------------------- */

async function scheduleBotsForUpcomingMeetings() {
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    const upcomingMeetings = await prisma.meeting.findMany({
        where: {
            startTime: { gte: now, lte: fiveMinutesFromNow },
            botScheduled: true,
            botSent: false,
            meetingUrl: { not: null },
        },
        include: { user: true }
    })

    for (const meeting of upcomingMeetings) {
        try {
            const canSchedule = await canUserScheduleMeeting(meeting.user)

            if (!canSchedule.allowed) {
                await prisma.meeting.update({
                    where: { id: meeting.id },
                    data: { botSent: true, botJoinedAt: new Date() }
                })
                continue
            }

            const requestBody = {
                meeting_url: meeting.meetingUrl,
                bot_name: meeting.user.botName || "AI Noteetaker",
                reserved: false,
                recording_mode: "speaker_view",
                speech_to_text: { provider: "Default" },
                webhook_url: process.env.WEBHOOK_URL,
                extra: {
                    meeting_id: meeting.id,
                    user_id: meeting.userId
                }
            }

            if (meeting.user.botImageUrl) {
                requestBody.bot_image = meeting.user.botImageUrl
            }

            const response = await fetch("https://api.meetingbaas.com/bots", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                throw new Error(`meeting baas api req failed: ${response.status}`)
            }

            const data = await response.json()

            await prisma.meeting.update({
                where: { id: meeting.id },
                data: {
                    botSent: true,
                    botId: data.bot_id,
                    botJoinedAt: new Date()
                }
            })

            await incrementMeetingUsage(meeting.userId)

        } catch (error) {
            console.error(`bot failed for ${meeting.title}: `, error.message)
        }
    }
}

async function canUserScheduleMeeting(user) {
    try {
        const PLAN_LIMITS = {
            free: { meetings: 0 },
            starter: { meetings: 10 },
            pro: { meetings: 30 },
            premium: { meetings: -1 }
        }

        const limits = PLAN_LIMITS[user.currentPlan] || PLAN_LIMITS.free

        if (user.currentPlan === "free" || user.subscriptionStatus !== "active") {
            return {
                allowed: false,
                reason:
                    user.currentPlan === "free"
                        ? "Free plan - upgrade required"
                        : "Inactive subscription - upgrade required"
            }
        }

        if (limits.meetings !== -1 && user.meetingsThisMonth >= limits.meetings) {
            return {
                allowed: false,
                reason: `Monthly limit reached`
            }
        }

        return { allowed: true }

    } catch (error) {
        return { allowed: false, reason: "Error checking limits" }
    }
}

async function incrementMeetingUsage(userId) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                meetingsThisMonth: { increment: 1 }
            }
        })
    } catch (error) {
        console.error("error incrementing meeting usage:", error)
    }
}

/* ---------------------------------------------------------
    ✅ ZOOM — MODIFIÉ UNIQUEMENT ICI ✅
--------------------------------------------------------- */

export const syncAllUserCalendarsZoom = async () => {
    try {
        const integrations = await prisma.userIntegration.findMany({
            where: {
                platform: "zoom",
            },
        })

        for (const integration of integrations) {

            // ✅ récupérer le user depuis userId
            const user = await prisma.user.findUnique({
                where: { id: integration.userId }
            })

            if (!user) {
                console.log("User not found:", integration.userId)
                continue
            }

            let accessToken = integration.accessToken

            // ✅ vérifier expiration du token
            if (!integration.expiresAt || new Date() > integration.expiresAt) {
                accessToken = await refreshZoomToken(integration)
                if (!accessToken) continue
            }

            // ✅ sync meetings Zoom
            await syncUserZoomCalendar(user, accessToken)
        }

    } catch (err) {
        console.error("Error fetching Zoom integrations:", err.message)
    }
}

async function refreshZoomToken(integration) {
    try {
        if (!integration.refreshToken) return null

        const response = await fetch("https://zoom.us/oauth/token", {
            method: "POST",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
                    ).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: integration.refreshToken,
            }),
        })

        if (!response.ok) {
            console.error("Zoom refresh error:", await response.text())
            return null
        }

        const data = await response.json()

        // ✅ Ajout expiresAt
        await prisma.userIntegration.update({
            where: { id: integration.id },
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || integration.refreshToken,
                expiresAt: new Date(Date.now() + data.expires_in * 1000)
            }
        })

        return data.access_token
    } catch (err) {
        console.error("Zoom token refresh error:", err.message)
        return null
    }
}

async function syncUserZoomCalendar(user, accessToken) {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=300`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) throw new Error(`Zoom API failed: ${response.status}`);
    const data = await response.json();
    const meetings = data.meetings || [];
    for (const meeting of meetings) {
  
        // Créer ou mettre à jour la réunion
    let id = meeting.id.toString()||""
    const start = new Date(meeting.start_time);

    const duration = Number(meeting.duration) || 0; // évite undefined

    const end = new Date(start.getTime() + duration * 60 * 1000);      
    const meetingData = {
        calendarEventId: id,
        userId: user.id,
        title: meeting.topic,
        startTime: new Date(meeting.start_time),
        endTime: end, // Zoom ne fournit pas endTime exact
        type: "z",
        meetingUrl:meeting.join_url,
        isFromCalendar: true,
        botScheduled: true
      };

      // Récupérer les participants si registration activée
      let participants = [];
      if (meeting.registration_required) {
        try {
          const regResp = await fetch(
            `https://api.zoom.us/v2/meetings/${meeting.id}/registrants`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (regResp.ok) {
            const regData = await regResp.json();
            participants = regData.registrants?.map(r => r.email) || [];
          }
        } catch (err) {
          console.warn(`Cannot fetch registrants for meeting ${meeting.id}: ${err.message}`);
        }
      }

      meetingData.attendees = participants.length > 0 ? JSON.stringify(participants) : null;

      // Créer ou mettre à jour en base
      const existing = await prisma.meeting.findUnique({ where: { calendarEventId: id } });
      if (existing) {
        await prisma.meeting.update({ where: { calendarEventId: id }, data: meetingData });
      } else {
        await prisma.meeting.create({ data: meetingData });
      }
    }
  } catch (err) {
    console.error(`Error syncing Zoom meetings for user ${user.id}:`, err.message);
  }
}


async function getNewAudioUrl(){
    const meetings = await prisma.meeting.findMany({
        where: { expireAt: { not: null },botId:{not:null} }
    });

    if(!meetings || meetings.length === 0 ) return;

    for(const meeting of meetings){
        if (new Date() >= meeting.expireAt && meeting.botId){
            const newUrl = await getNewUrl(meeting.botId);
            await prisma.meeting.update({
                where:{ id: meeting.id },
                data:{
                    recordingUrl: newUrl,
                    expireAt: new Date(Date.now() + 1000 * 60 * 60)
                }
            });
        }
    }
}

async function getNewUrl(botId) {
  const response = await fetch(`https://api.meetingbaas.com/bots/meeting_data?bot_id=${botId}`, {
    method: "GET",
    headers: {
      "x-meeting-baas-api-key": `${process.env.MEETING_BAAS_API_KEY}`,
      "Content-Type": "application/json"
    },
    
  });

  if (!response.ok) throw new Error("Erreur lors de la récupération du lien vidéo");

  const data = await response.json();
  return data.mp4;
}

// Exemple d’utilisation









