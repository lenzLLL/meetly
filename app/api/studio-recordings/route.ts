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

    const userRecord = await prisma.user.findUnique({ where: { id: userId } })
    const emailNorm = (userRecord?.email || '').trim().toLowerCase()

    const studioRecordings = await prisma.meeting.findMany({
      where: {
        OR: [
          { userId: userId },
          emailNorm ? { sharing: { has: emailNorm } } : undefined,
        ].filter(Boolean) as any[],
      },
      orderBy: {
        startTime: 'desc'
      },
      include: { user: true },
      take: 50,
    })

    const out = studioRecordings.map((r:any) => ({
      ...r,
      shared: (r.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm),
      sharedBy: ((r.sharing || []).map((s: string) => (s||'').toLowerCase()).includes(emailNorm)) ? (r.user?.name || r.user?.email || null) : null,
    }))

    return NextResponse.json(out)
  } catch (error) {
    console.error('Error fetching studio recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch studio recordings' },
      { status: 500 }
    )
  }
}
