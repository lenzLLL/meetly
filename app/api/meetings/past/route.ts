import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { error } from "console";
import { NextResponse } from "next/server";
import { connected } from "process";

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }

        // `auth()` returns the database user id in this app's configuration.
        // Use it directly to query meetings instead of mapping via clerkId.
        const pastMeetings = await prisma.meeting.findMany({
            where: {
                userId: userId,
                meetingEnded: true,
            },
            orderBy: {
                endTime: 'desc',
            },
            take: 10,
        })

        return NextResponse.json({ meetings: pastMeetings })

    } catch (error) {
        return NextResponse.json({ error: 'failed to fetch past meetings', meetings: [] }, { status: 500 })
    }
}