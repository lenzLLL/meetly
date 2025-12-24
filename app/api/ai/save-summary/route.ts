import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMeetingSummaryEmail } from '@/lib/email-service'
import { processTranscript } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { summary, tasks, keyPoints, transcript, userId, userEmail, meetingTitle, language } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // For analysis flow we do NOT create a Meeting record here.
    // Meeting persistence will be performed only when the user explicitly saves (exports) the recording.
    // Here we only optionally send the summary to the user email (useful for immediate feedback),
    // but do not persist data or run RAG indexing to avoid duplicate meetings.
    try {
      if (userEmail) {
        const titleToUse = meetingTitle || `Meeting ${new Date().toISOString()}`
        await sendMeetingSummaryEmail({
          userEmail,
          userName: '',
          meetingTitle: titleToUse,
          summary: summary || '',
          actionItems: tasks || [],
          meetingId: '',
          meetingDate: new Date().toISOString(),
          language: language || 'en'
        })
      }
    } catch (emailErr) {
      console.error('Failed to send summary email during analysis (no persistence):', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('save-summary error:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
