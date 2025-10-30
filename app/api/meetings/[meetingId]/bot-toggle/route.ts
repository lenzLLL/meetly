import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: {
    meetingId: string;
  };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { meetingId } = context.params; // ✅ pas de await ici
    const { botScheduled } = await request.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const meeting = await prisma.meeting.update({
      where: {
        id: meetingId,
        userId: user.id,
      },
      data: {
        botScheduled,
      },
    });

    return NextResponse.json({
      success: true,
      botScheduled: meeting.botScheduled,
      message: `Bot ${botScheduled ? "enabled" : "disabled"} for meeting`,
    });
  } catch (error) {
    console.error("Bot toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update bot status" },
      { status: 500 }
    );
  }
}
