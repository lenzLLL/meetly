import MeetingSummaryEmailNew from '@/components/email/meeting-summary'
import RecordingSummaryEmail from '@/components/email/recording-summary'
import { render } from '@react-email/render'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface EmailData {
    userEmail: string
    userName: string
    meetingTitle: string
    summary: string
    actionItems: Array<{
        id: number
        text: string
    }>
    meetingId: string
    meetingDate: string
}

export async function sendMeetingSummaryEmail(data: EmailData) {
    try {
        const emailHtml = await render(
            <MeetingSummaryEmailNew
                userName={data.userName}
                meetingTitle={data.meetingTitle}
                summary={data.summary}
                actionItems={data.actionItems}
                meetingId={data.meetingId}
                meetingDate={data.meetingDate}
            />
        )

        const result = await resend.emails.send({
            from: 'Meetly <onboarding@resend.dev>',
            to: [data.userEmail],
            replyTo: 'lenzyounda@gmail.com',
            subject: `Meeting Summary Ready - ${data.meetingTitle}`,
            html: emailHtml,
            tags: [
                {
                    name: 'category',
                    value: 'meeting-summary'
                },
                {
                    name: 'meeting-id',
                    value: data.meetingId
                }
            ]
        })

        return result
    } catch (error) {
        console.error('error saendign email:', error)
        throw error
    }
}

interface RecordingEmailData {
    email: string
    userName: string
    meetingTitle: string
    summary: string
    keyPoints: string[]
    actionItems: Array<{
        id: number
        text: string
    }>
    recordingId: string
    recordingDate: string
    language: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'
}

export async function sendRecordingSummaryEmail(data: RecordingEmailData) {
    try {
        const emailHtml = await render(
            <RecordingSummaryEmail
                userName={data.userName}
                meetingTitle={data.meetingTitle}
                summary={data.summary}
                keyPoints={data.keyPoints}
                actionItems={data.actionItems}
                recordingId={data.recordingId}
                recordingDate={data.recordingDate}
                language={data.language}
            />
        )

        const result = await resend.emails.send({
            from: 'Conia <onboarding@resend.dev>',
            to: [data.email],
            replyTo: 'lenzyounda@gmail.com',
            subject: `Recording Summary Ready - ${data.meetingTitle}`,
            html: emailHtml,
            tags: [
                {
                    name: 'category',
                    value: 'recording-summary'
                },
                {
                    name: 'recording-id',
                    value: data.recordingId
                }
            ]
        })

        console.log(`sendRecordingSummaryEmail: sent to ${data.email}`, result)

        return result
    } catch (error) {
        console.error('error sending recording email:', error)
        throw error
    }
}

// Send recording summary to multiple recipients in one call
export async function sendRecordingSummaryEmailToMany(params: {
    emails: string[]
    userName: string
    meetingTitle: string
    summary: string
    keyPoints: string[]
    actionItems: Array<{ id: number; text: string }>
    recordingId: string
    recordingDate: string
    language: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'
}) {
    try {
        const emailHtml = await render(
            <RecordingSummaryEmail
                userName={params.userName}
                meetingTitle={params.meetingTitle}
                summary={params.summary}
                keyPoints={params.keyPoints}
                actionItems={params.actionItems}
                recordingId={params.recordingId}
                recordingDate={params.recordingDate}
                language={params.language}
            />
        )

        const result = await resend.emails.send({
            from: 'Conia <onboarding@resend.dev>',
            to: params.emails,
            replyTo: 'lenzyounda@gmail.com',
            subject: `Recording Summary Ready - ${params.meetingTitle}`,
            html: emailHtml,
            tags: [
                { name: 'category', value: 'recording-summary' },
                { name: 'recording-id', value: params.recordingId },
            ],
        })

        console.log('sendRecordingSummaryEmailToMany: sent to', params.emails, result)

        return result
    } catch (error) {
        console.error('error sending recording emails to many:', error)
        throw error
    }
}