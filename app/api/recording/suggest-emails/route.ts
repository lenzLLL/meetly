import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        subaccounts: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return subaccounts with email for suggestions
    const subaccounts = user.subaccounts.map(sub => ({
      id: sub.id,
      name: sub.name,
      email: sub.email
    }))

    return NextResponse.json({ subaccounts })
  } catch (error) {
    console.error('Error fetching subaccounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
