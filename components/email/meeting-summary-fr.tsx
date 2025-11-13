import {
  Body, Container, Head, Html, Preview, Section, Text, Button, Hr
} from '@react-email/components'

interface MeetingSummaryEmailProps {
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

export function MeetingSummaryEmailNewFr({
  userName,
  meetingTitle,
  summary,
  actionItems,
  meetingId,
  meetingDate
}: MeetingSummaryEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  return (
    <Html>
      <Head />
      <Preview>Le résumé de votre réunion est prêt</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          <Section style={headerStyle}>
            <Text style={headerTitleStyle}>
              📝 Résumé de la réunion prêt
            </Text>
            <Text style={headerSubtitleStyle}>
              {meetingTitle}
            </Text>
          </Section>

          <Section style={contentStyle}>

            <Text style={greetingStyle}>
              Bonjour {userName},
            </Text>

            <Text style={dateStyle}>
              Votre réunion du {meetingDate} a été traitée et le résumé est maintenant disponible.
            </Text>

            <Section style={summaryContainerStyle}>
              <Text style={sectionTitleStyle}>
                📋 Résumé
              </Text>
              <Text style={summaryTextStyle}>
                {summary}
              </Text>
            </Section>

            <Section style={actionItemsContainerStyle}>
              <Text style={sectionTitleStyle}>
                ✅ Points d’action
              </Text>
              {actionItems.length > 0 ? (
                actionItems.map((item) => (
                  <Text key={item.id} style={actionItemStyle}>
                    • {item.text}
                  </Text>
                ))
              ) : (
                <Text style={noActionItemsStyle}>
                  Aucun point d’action enregistré
                </Text>
              )}
            </Section>

            <Section style={buttonContainerStyle}>
              <Button
                href={`${baseUrl}/meeting/${meetingId}`}
                style={buttonStyle}
              >
                Voir les détails complets de la réunion
              </Button>
            </Section>

          </Section>

          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Envoyé par Meeting Bot • Service automatique de résumé de réunions
            </Text>
            <Text style={footerTextStyle}>
              Besoin d’aide ? Contactez le support
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  margin: '0',
  padding: '0',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#ffffff'
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#000000',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #333333'
}

const headerStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  padding: '30px',
  textAlign: 'center' as const
}

const headerTitleStyle = {
  color: 'white',
  margin: '0',
  fontSize: '24px',
  fontWeight: 'bold'
}

const headerSubtitleStyle = {
  color: '#e8e8e8',
  margin: '10px 0 0 0',
  fontSize: '16px'
}

const contentStyle = {
  padding: '30px',
  backgroundColor: '#000000'
}

const greetingStyle = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '1.5',
  marginTop: '0'
}

const dateStyle = {
  color: '#cccccc',
  fontSize: '14px',
  lineHeight: '1.5'
}

const summaryContainerStyle = {
  backgroundColor: '#1a1a1a',
  borderLeft: '4px solid #3b82f6',
  padding: '20px',
  margin: '25px 0',
  borderRadius: '4px'
}

const actionItemsContainerStyle = {
  backgroundColor: '#1a1a1a',
  borderLeft: '4px solid #10b981',
  padding: '20px',
  margin: '25px 0',
  borderRadius: '4px'
}

const sectionTitleStyle = {
  color: '#ffffff',
  margin: '0 0 15px 0',
  fontSize: '18px',
  fontWeight: 'bold'
}

const summaryTextStyle = {
  color: '#cccccc',
  lineHeight: '1.6',
  margin: '0',
  fontSize: '14px'
}

const actionItemStyle = {
  color: '#cccccc',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
  fontSize: '14px'
}

const noActionItemsStyle = {
  color: '#888888',
  fontStyle: 'italic',
  lineHeight: '1.5',
  margin: '0',
  fontSize: '14px'
}

const buttonContainerStyle = {
  textAlign: 'center' as const,
  margin: '30px 0'
}

const buttonStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: 'white',
  padding: '14px 28px',
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
  fontWeight: 'bold',
  fontSize: '16px',
  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)'
}

const hrStyle = {
  borderColor: '#333333',
  margin: '0'
}

const footerStyle = {
  backgroundColor: '#000000',
  padding: '20px',
  textAlign: 'center' as const
}

const footerTextStyle = {
  color: '#888888',
  fontSize: '12px',
  margin: '5px 0'
}

export default MeetingSummaryEmailNewFr
