import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
     {params}: {params: Promise<{ meetingId: string }>}
) {
    try {
       
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }

        const { meetingId } = await params
        const { botScheduled } = await request.json()

        // Verify meeting belongs to this user
        const meetingOwner = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { userId: true }
        })

        if (!meetingOwner) {
            return NextResponse.json({ error: "meeting not found" }, { status: 404 })
        }

        if (meetingOwner.userId !== userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 403 })
        }

        const meeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { botScheduled: botScheduled }
        })

        return NextResponse.json({
            success: true,
            botScheduled: meeting.botScheduled,
            message: `Bot ${botScheduled ? 'enable' : 'disabled'} for meeting`
        })
    } catch (error) {
        console.error('Bot toogle error:', error)
        return NextResponse.json({
            error: "Failed to update bot status"
        }, { status: 500 })
    }
}