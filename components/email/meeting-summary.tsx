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
    language?: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'
}

const translations: Record<string, any> = {
    en: {
        preview: 'Your meeting summary is ready',
        title: '📝 Meeting Summary Ready',
        greeting: 'Hi',
        dateText: 'Your meeting from',
        hasBeenProcessed: 'has been processed and is ready for review.',
        summary: '📋 Summary',
        actionItems: '✅ Action Items',
        noActionItems: 'No action items recorded',
        viewDetails: 'View Full Meeting Details',
        sentBy: 'Sent by Meeting Bot • Automated meeting summary service',
        needHelp: 'Need help? Contact support'
    },
    fr: {
        preview: 'Le résumé de votre réunion est prêt',
        title: '📝 Résumé de la réunion prêt',
        greeting: 'Bonjour',
        dateText: 'Votre réunion du',
        hasBeenProcessed: 'a été traitée et le résumé est maintenant disponible.',
        summary: '📋 Résumé',
        actionItems: '✅ Points d’action',
        noActionItems: 'Aucun point d’action enregistré',
        viewDetails: 'Voir les détails complets de la réunion',
        sentBy: 'Envoyé par Meeting Bot • Service automatique de résumé de réunions',
        needHelp: 'Besoin d’aide ? Contactez le support'
    },
    es: {
        preview: 'Su resumen de la reunión está listo',
        title: '📝 Resumen de la reunión listo',
        greeting: 'Hola',
        dateText: 'Su reunión del',
        hasBeenProcessed: 'ha sido procesada y está lista para revisión.',
        summary: '📋 Resumen',
        actionItems: '✅ Elementos de acción',
        noActionItems: 'Sin elementos de acción registrados',
        viewDetails: 'Ver detalles completos de la reunión',
        sentBy: 'Enviado por Meeting Bot • Servicio automático de resumen de reuniones',
        needHelp: '¿Necesita ayuda? Contacte con soporte'
    },
    de: {
        preview: 'Ihre Meeting-Zusammenfassung ist bereit',
        title: '📝 Meeting-Zusammenfassung bereit',
        greeting: 'Hallo',
        dateText: 'Ihr Meeting vom',
        hasBeenProcessed: 'wurde verarbeitet und steht zur Überprüfung bereit.',
        summary: '📋 Zusammenfassung',
        actionItems: '✅ Aktionselemente',
        noActionItems: 'Keine Aktionselemente erfasst',
        viewDetails: 'Alle Meeting-Details anzeigen',
        sentBy: 'Gesendet von Meeting Bot • Automatischer Meeting-Zusammenfassungsdienst',
        needHelp: 'Brauchen Sie Hilfe? Kontaktieren Sie den Support'
    },
    pt: {
        preview: 'Seu resumo da reunião está pronto',
        title: '📝 Resumo da reunião pronto',
        greeting: 'Olá',
        dateText: 'Sua reunião de',
        hasBeenProcessed: 'foi processada e está pronta para revisão.',
        summary: '📋 Resumo',
        actionItems: '✅ Itens de ação',
        noActionItems: 'Nenhum item de ação registrado',
        viewDetails: 'Ver detalhes completos da reunião',
        sentBy: 'Enviado por Meeting Bot • Serviço automático de resumo de reuniões',
        needHelp: 'Precisa de ajuda? Entre em contato com o suporte'
    },
    it: {
        preview: 'Il riepilogo della riunione è pronto',
        title: '📝 Riepilogo della riunione pronto',
        greeting: 'Ciao',
        dateText: 'La tua riunione del',
        hasBeenProcessed: 'è stata elaborata ed è pronta per la revisione.',
        summary: '📋 Riepilogo',
        actionItems: '✅ Elementi di azione',
        noActionItems: 'Nessun elemento d’azione registrato',
        viewDetails: 'Visualizza i dettagli completi della riunione',
        sentBy: 'Inviato da Meeting Bot • Servizio automatico di riepilogo riunioni',
        needHelp: 'Hai bisogno di aiuto? Contatta il supporto'
    }
}

export function MeetingSummaryEmailNew({
    userName,
    meetingTitle,
    summary,
    actionItems,
    meetingId,
    meetingDate,
    language = 'en'
}: MeetingSummaryEmailProps) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const t = translations[language] || translations.en

    return (
        <Html>
            <Head />
            <Preview>{t.preview}</Preview>
            <Body style={bodyStyle}>
                <Container style={containerStyle}>

                    <Section style={headerStyle}>
                        <Text style={headerTitleStyle}>{t.title}</Text>
                        <Text style={headerSubtitleStyle}>{meetingTitle}</Text>
                    </Section>

                    <Section style={contentStyle}>

                        <Text style={greetingStyle}>{t.greeting} {userName},</Text>

                        <Text style={dateStyle}>{t.dateText} {meetingDate} {t.hasBeenProcessed}</Text>

                        <Section style={summaryContainerStyle}>
                            <Text style={sectionTitleStyle}>{t.summary}</Text>
                            <Text style={summaryTextStyle}>{summary}</Text>
                        </Section>

                        <Section style={actionItemsContainerStyle}>
                            <Text style={sectionTitleStyle}>{t.actionItems}</Text>
                            {actionItems.length > 0 ? (
                                actionItems.map((item) => (
                                    <Text key={item.id} style={actionItemStyle}>• {item.text}</Text>
                                ))
                            ) : (
                                <Text style={noActionItemsStyle}>{t.noActionItems}</Text>
                            )}
                        </Section>

                        <Section style={buttonContainerStyle}>
                            <Button href={`${baseUrl}/meeting/${meetingId}`} style={buttonStyle}>{t.viewDetails}</Button>
                        </Section>

                    </Section>

                    <Hr style={hrStyle} />
                    <Section style={footerStyle}>
                        <Text style={footerTextStyle}>{t.sentBy}</Text>
                        <Text style={footerTextStyle}>{t.needHelp}</Text>
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

export default MeetingSummaryEmailNew