import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { permission } from "process"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subaccounts: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        const now = new Date()
                const emailNorm = (user.email || '').trim().toLowerCase()

                const upcomingMeetings = await prisma.meeting.findMany({
                        where: {
                                AND: [
                                    { startTime: { gte: now } },
                                    { isFromCalendar: true }
                                ],
                                OR: [
                                    { userId: userId },
                                    emailNorm ? { sharing: { has: emailNorm } } : undefined,
                                ].filter(Boolean) as any[],
                        },
                        orderBy: { startTime: 'asc' },
                        include:{
                             permissions:true,
                             user: true
                        },
                        take: 10
                })

        const events = upcomingMeetings.map(meeting => ({
            id: meeting.calendarEventId || meeting.id,
            ID:meeting.id,
            summary: meeting.title,
            start: { dateTime: meeting.startTime.toISOString() },
            end: { dateTime: meeting.endTime.toISOString() },
            attendees: meeting.attendees ? JSON.parse(meeting.attendees as string) : [],
            hangoutLink: meeting.meetingUrl,
            conferenceData: meeting.meetingUrl ? { entryPoints: [{ uri: meeting.meetingUrl }] } : null,
            botScheduled: meeting.botScheduled,
            meetingId: meeting.id,
            type:meeting.type,
            permissions:meeting.permissions,
            shared: (meeting.sharing || []).map((s: string) => (s||'').toLowerCase()).includes((user.email||'').toLowerCase()),
            sharedBy: ((meeting.sharing || []).map((s: string) => (s||'').toLowerCase()).includes((user.email||'').toLowerCase())) ? (meeting.user?.name || meeting.user?.email || null) : null,
        }))
        
        return NextResponse.json({
            events,
            subaccounts:user.subaccounts,
            source: 'database'
        })

    } catch (error) {
        console.error('Error fetching meetings:', error)
        return NextResponse.json({
            error: "Failed to fetch meetings",
            events: [],
        }, { status: 500 })
    }
}