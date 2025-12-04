import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMeetingSummaryEmail } from '@/lib/email-service'
import { sendMeetingSummaryEmailFr } from '@/lib/email-service-french'
import { processTranscript } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { summary, tasks, keyPoints, transcript, userId, userEmail, meetingTitle, language } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // create a meeting record
    const meeting = await prisma.meeting.create({
      data: {
        userId: userId,
        title: meetingTitle || `Meeting ${new Date().toISOString()}`,
        startTime: new Date(),
        endTime: new Date(),
        transcript: transcript ? transcript : null,
        summary: summary || null,
        actionItems: tasks || [],
        processed: true,
        processedAt: new Date(),
        transcriptReady: !!transcript,
      },
    })

    // Optionally process RAG/indexing for search
    try {
      if (transcript) {
        await processTranscript(meeting.id, userId, transcript, meeting.title)
      }
    } catch (err) {
      console.error('processTranscript error:', err)
    }

    // send email using Resend templates
    try {
      if (userEmail) {
        if (language === 'en' || !language) {
          await sendMeetingSummaryEmail({
            userEmail,
            userName: '',
            meetingTitle: meeting.title,
            summary: summary || '',
            actionItems: tasks || [],
            meetingId: meeting.id,
            meetingDate: meeting.startTime.toISOString(),
          })
        } else {
          await sendMeetingSummaryEmailFr({
            userEmail,
            userName: '',
            meetingTitle: meeting.title,
            summary: summary || '',
            actionItems: tasks || [],
            meetingId: meeting.id,
            meetingDate: meeting.startTime.toISOString(),
          })
        }
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { emailSent: true, emailSentAt: new Date() },
        })
      }
    } catch (emailErr) {
      console.error('Failed to send summary email:', emailErr)
    }

    return NextResponse.json({ success: true, meetingId: meeting.id })
  } catch (error) {
    console.error('save-summary error:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
