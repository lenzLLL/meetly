import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          clerkUser: null
        },
        { status: 401 }
      )
    }

    console.log('\n=== DEBUG TEST ===')
    console.log('Clerk User ID:', clerkUser.id)

    // Get user from database using clerkId
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkUser.id,
      },
    })

    console.log('User found:', user?.id, 'Email:', user?.email)

    if (!user) {
      // Try to find any user to see if we have any data
      const anyUser = await prisma.user.findFirst()
      console.log('No user found with this clerkId')
      console.log('First user in database:', anyUser?.id, anyUser?.clerkId)
      
      return NextResponse.json(
        {
          error: 'User not found',
          clerkId: clerkUser.id,
          anyUserInDb: anyUser ? { id: anyUser.id, clerkId: anyUser.clerkId } : null
        },
        { status: 404 }
      )
    }

    // Get all meetings for this user
    const userMeetings = await prisma.meeting.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        type: true,
        recordingUrl: true,
      }
    })

    console.log('Meetings for user:', userMeetings.length)

    // Also check total meetings in database
    const totalMeetings = await prisma.meeting.count()
    console.log('Total meetings in database:', totalMeetings)

    // Check first meeting to see structure
    const firstMeeting = await prisma.meeting.findFirst()
    console.log('First meeting userId:', firstMeeting?.userId)
    console.log('Current user id:', user.id)

    return NextResponse.json({
      success: true,
      currentUser: {
        clerkId: clerkUser.id,
        databaseId: user.id,
      },
      statistics: {
        userMeetingsCount: userMeetings.length,
        totalMeetingsCount: totalMeetings,
        firstMeetingUserId: firstMeeting?.userId,
      },
      userMeetings: userMeetings,
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      {
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
