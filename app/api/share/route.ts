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

    const normalize = (s?: string) => (s || '').trim().toLowerCase()
    const recipient = normalize(email)

    // basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(recipient)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
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

    // Avoid adding owner's email
    const ownerEmail = (meeting.user?.email || '').trim().toLowerCase()
    if (ownerEmail && ownerEmail === recipient) {
      return NextResponse.json({ error: 'Cannot share to owner email' }, { status: 400 })
    }

    // update sharing array if not present (normalize existing entries)
    const existing = (meeting.sharing || []).map((e: string) => (e || '').trim().toLowerCase())
    if (existing.includes(recipient)) {
      return NextResponse.json({ error: 'Already shared' }, { status: 409 })
    }

    await prisma.meeting.update({ where: { id: meetingId }, data: { sharing: { push: recipient } } })

    // send email with summary (if recording use recording template)
    try {
      const lang = (language as any) || 'en'

      // normalize actionItems (stored as Json in prisma) and coerce to expected shape
      const rawActionItems = (meeting.actionItems || []) as any
      const actionItems: { id: number; text: string }[] = Array.isArray(rawActionItems)
        ? rawActionItems.map((it: any) => ({ id: Number(it?.id || 0), text: String(it?.text || '') }))
        : []

      // derive a safe date string
      const meetingDate = meeting.startTime ? new Date(meeting.startTime).toLocaleString() : new Date().toLocaleString()

      if (meeting.type === 'recording') {
        // keyPoints may not exist in schema; try to read if present
        // @ts-ignore
        const keyPoints = Array.isArray((meeting as any).keyPoints) ? (meeting as any).keyPoints : []

        await sendRecordingSummaryEmail({
          email,
          userName: meeting.user?.name || 'User',
          meetingTitle: meeting.title,
          summary: meeting.summary || '',
          keyPoints,
          actionItems,
          recordingId: meeting.id,
          recordingDate: meetingDate,
          language: lang,
        })
      } else {
        await sendMeetingSummaryEmail({
          userEmail: email,
          userName: meeting.user?.name || 'User',
          meetingTitle: meeting.title,
          summary: meeting.summary || '',
          actionItems,
          meetingId: meeting.id,
          meetingDate,
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
