import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
        }

        const { meetingId } = await params

        // Verify user owns this meeting
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { userId: true }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        if (meeting.userId !== userId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 403 })
        }

        // Get chunks for this meeting
        const chunks = await prisma.transcriptChunk.findMany({
            where: { meetingId },
            orderBy: { chunkIndex: 'asc' }
        })

        return NextResponse.json({ chunks })
    } catch (error) {
        console.error('error fetching transcript chunks:', error)
        return NextResponse.json({ error: 'failed to fetch chunks' }, { status: 500 })
    }
}
