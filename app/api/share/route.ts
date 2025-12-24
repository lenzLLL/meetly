import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { sendMeetingSummaryEmail, sendRecordingSummaryEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { meetingId, email, language } = await request.json()

    if (!meetingId || !email) {
      return NextResponse.json({ error: 'meetingId and email required' }, { status: 400 })
    }

    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { user: true } })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    // Only owner can share for now
    if (meeting.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // update sharing array if not present
    const existing = meeting.sharing || []
    if (!existing.includes(email)) {
      await prisma.meeting.update({ where: { id: meetingId }, data: { sharing: { push: email } } })
    }

    // send email with summary (if recording use recording template)
    try {
      const lang = (language as any) || 'en'
      if (meeting.type === 'recording') {
        await sendRecordingSummaryEmail({
          email,
          userName: meeting.user.name || 'User',
          meetingTitle: meeting.title,
          summary: meeting.summary || '',
          keyPoints: Array.isArray(meeting.actionItems) ? [] : [],
          actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems : [],
          recordingId: meeting.id,
          recordingDate: meeting.startTime ? meeting.startTime.toLocaleDateString() : new Date().toLocaleDateString(),
          language: lang,
        })
      } else {
        await sendMeetingSummaryEmail({
          userEmail: email,
          userName: meeting.user.name || 'User',
          meetingTitle: meeting.title,
          summary: meeting.summary || '',
          actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems : [],
          meetingId: meeting.id,
          meetingDate: meeting.startTime ? meeting.startTime.toLocaleDateString() : new Date().toLocaleDateString(),
          language: lang,
        })
      }
    } catch (emailErr) {
      console.error('Failed to send share email:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('share route error', err)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
