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
        const user = await prisma.user.findUnique({ where: { id: userId } })
        const emailNorm = (user?.email || '').trim().toLowerCase()

        const pastMeetings = await prisma.meeting.findMany({
            where: {
                meetingEnded: true,
                OR: [
                    { userId: userId },
                    emailNorm ? { sharing: { has: emailNorm } } : undefined,
                ].filter(Boolean) as any[],
            },
            orderBy: {
                endTime: 'desc',
            },
            include: { user: true },
            take: 10,
        })

        const meetings = pastMeetings.map(m => ({
            ...m,
            shared: (m.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm),
            sharedBy: ((m.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm)) ? (m.user?.name || m.user?.email || null) : null,
        }))

        return NextResponse.json({ meetings })

    } catch (error) {
        return NextResponse.json({ error: 'failed to fetch past meetings', meetings: [] }, { status: 500 })
    }
}