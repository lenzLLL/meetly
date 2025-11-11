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
            where: { clerkId: userId },include:{subaccounts:true}
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const now = new Date()
        const upcomingMeetings = await prisma.meeting.findMany({
            where: {
                userId: user.id,
                startTime: { gte: now },
                isFromCalendar: true,
            },
            orderBy: { startTime: 'asc' },
            include:{
               permissions:true
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