// app/api/meeting/permissions/route.ts
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { meetingId, subaccountId, allowed } = await request.json();

    if (!meetingId || !subaccountId || typeof allowed !== "boolean") {
      return NextResponse.json({ error: "invalid parameters" }, { status: 400 });
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        permissions: allowed
          ? { connect: { id: subaccountId } }
          : { disconnect: { id: subaccountId } }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
