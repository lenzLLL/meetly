import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const studioRecordings = await prisma.meeting.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 50,
    })

    return NextResponse.json(studioRecordings)
  } catch (error) {
    console.error('Error fetching studio recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch studio recordings' },
      { status: 500 }
    )
  }
}
