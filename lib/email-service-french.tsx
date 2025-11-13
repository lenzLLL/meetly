import MeetingSummaryEmailNewFr from '@/components/email/meeting-summary-fr'
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

export async function sendMeetingSummaryEmailFr(data: EmailData) {
    try {
        const emailHtml = await render(
            <MeetingSummaryEmailNewFr
                userName={data.userName}
                meetingTitle={data.meetingTitle}
                summary={data.summary}
                actionItems={data.actionItems}
                meetingId={data.meetingId}
                meetingDate={data.meetingDate}
            />
        )

        const result = await resend.emails.send({
            from: 'Synopsia <onboarding@resend.dev>',
            to: [data.userEmail],
            replyTo: 'lenzyounda@gmail.com',
            subject: `Résumé de la réunion prêt - ${data.meetingTitle}`,
            html: emailHtml,
            tags: [
                {
                    name: 'categorie',
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