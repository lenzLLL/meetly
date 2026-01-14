import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { sendRecordingSummaryEmail, sendRecordingSummaryEmailToMany } from '@/lib/email-service'
import { processTranscript } from '@/lib/rag'

interface SaveRecordingRequest {
  title: string
  transcript: string
  summary: string
  keyPoints: string[]
  actionItems: Array<{ id: number; text: string }>
  emailRecipients: string[] // email addresses
  startTime?: string | null
  endTime?: string | null
  language: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'
}

// In-memory idempotency cache (request key -> response)
// In production, use Redis instead
const idempotencyCache = new Map<string, { recordingId: string; timestamp: number }>()

// Cleanup cache entries older than 5 minutes
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000
  for (const [key, value] of idempotencyCache.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      idempotencyCache.delete(key)
    }
  }
}, 60 * 1000) // Cleanup every minute

export async function POST(request: NextRequest) {
  try {
    // Get idempotency key from header
    const idempotencyKey = request.headers.get('X-Idempotency-Key')
    
    // Check if this request was already processed
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const cached = idempotencyCache.get(idempotencyKey)!
      console.log(`Idempotent request detected for key: ${idempotencyKey}, returning cached recording: ${cached.recordingId}`)
      return NextResponse.json({
        success: true,
        recordingId: cached.recordingId,
        message: 'Recording already saved (idempotent)',
        isDuplicate: true
      })
    }

    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: SaveRecordingRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.transcript) {
      return NextResponse.json(
        { error: 'Title and transcript are required' },
        { status: 400 }
      )
    }

    // Derive start/end times from payload if present
    const startTime = body.startTime ? new Date(body.startTime) : new Date()
    const endTime = body.endTime ? new Date(body.endTime) : new Date()

    // Create recording (meeting) in database
    const recording = await prisma.meeting.create({
      data: {
        userId: user.id,
        title: body.title,
        description: `Recording - ${startTime.toLocaleDateString()}`,
        startTime,
        endTime,
        transcript: body.transcript,
        summary: body.summary,
        actionItems: body.actionItems,
        keypoints: body.keyPoints || [],
        processed: true,
        processedAt: new Date(),
        type: 'recording'
      }
    })

    // Process transcript with Pinecone for semantic search and RAG capabilities
    try {
      await processTranscript(recording.id, user.id, body.transcript, body.title)
      console.log(`Processed transcript for recording ${recording.id} with Pinecone`)
    } catch (err) {
      console.error(`Error processing transcript with Pinecone for recording ${recording.id}:`, err)
      // Don't fail the request if Pinecone processing fails
    }

    // Cache the response for idempotency
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        recordingId: recording.id,
        timestamp: Date.now()
      })
      console.log(`Cached recording for idempotency key: ${idempotencyKey}`)
    }

    // Send emails to recipients
    const emailsToSend = new Set<string>()

    // Add current user's email
    if (user.email) {
      emailsToSend.add(user.email)
    }

    // Add custom email recipients
    if (body.emailRecipients && Array.isArray(body.emailRecipients)) {
      body.emailRecipients.forEach(email => {
        if (email && email.includes('@')) {
          emailsToSend.add(email)
        }
      })
    }

    // Send emails to recipients (log recipients and send in parallel)
    const recipients = Array.from(emailsToSend)
    console.log('Recording save: sending emails to recipients:', recipients)

    try {
      // send a single email call to Resend with multiple recipients to ensure delivery
      const bulkResult = await sendRecordingSummaryEmailToMany({
        emails: recipients,
        userName: user.name || 'User',
        meetingTitle: body.title,
        summary: body.summary,
        keyPoints: body.keyPoints,
        actionItems: body.actionItems,
        recordingId: recording.id,
        recordingDate: startTime.toLocaleDateString(),
        language: body.language,
      })

      console.log('Bulk send result:', bulkResult)
    } catch (err) {
      console.error('Error sending bulk recording emails, falling back to per-recipient sends:', err)

      // Fallback: send individually with retry and small delay to avoid rate issues
      for (const email of recipients) {
        let attempts = 0
        const maxAttempts = 2
        let sent = false
        while (attempts < maxAttempts && !sent) {
          try {
            attempts += 1
            const res = await sendRecordingSummaryEmail({
              email,
              userName: user.name || 'User',
              meetingTitle: body.title,
              summary: body.summary,
              keyPoints: body.keyPoints,
              actionItems: body.actionItems,
              recordingId: recording.id,
              recordingDate: startTime.toLocaleDateString(),
              language: body.language,
            })
            console.log(`Sent recording email to ${email} (attempt ${attempts}):`, res)
            sent = true
          } catch (e) {
            console.error(`Failed to send to ${email} (attempt ${attempts}):`, e)
            if (attempts < maxAttempts) {
              // wait before retry
              await new Promise((r) => setTimeout(r, 300))
            }
          }
        }
        if (!sent) {
          console.error(`Giving up sending recording email to ${email} after ${maxAttempts} attempts`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      message: 'Recording saved successfully'
    })
  } catch (error) {
    console.error('Error saving recording:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
