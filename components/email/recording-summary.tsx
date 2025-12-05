import {
    Body, Container, Head, Html, Preview, Section, Text, Button, Hr
} from '@react-email/components'

interface RecordingSummaryEmailProps {
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

const translations = {
    en: {
        preview: 'Your recording summary is ready',
        title: '🎙️ Recording Summary Ready',
        greeting: 'Hi',
        dateText: 'Your recording from',
        hasBeenProcessed: 'has been processed and is ready for review.',
        summary: '📋 Summary',
        keyPoints: '🎯 Key Points',
        actionItems: '✅ Action Items',
        noActionItems: 'No action items recorded',
        viewDetails: 'View Full Recording Details',
        sentBy: 'Sent by Conia • Automated recording analysis service',
        needHelp: 'Need help? Contact support'
    },
    fr: {
        preview: 'Votre résumé d\'enregistrement est prêt',
        title: '🎙️ Résumé de l\'enregistrement prêt',
        greeting: 'Bonjour',
        dateText: 'Votre enregistrement du',
        hasBeenProcessed: 'a été traité et est prêt pour examen.',
        summary: '📋 Résumé',
        keyPoints: '🎯 Points clés',
        actionItems: '✅ Éléments d\'action',
        noActionItems: 'Aucun élément d\'action enregistré',
        viewDetails: 'Voir les détails complets de l\'enregistrement',
        sentBy: 'Envoyé par Conia • Service d\'analyse d\'enregistrement automatisé',
        needHelp: 'Besoin d\'aide? Contactez le support'
    },
    es: {
        preview: 'Su resumen de grabación está listo',
        title: '🎙️ Resumen de grabación listo',
        greeting: 'Hola',
        dateText: 'Su grabación del',
        hasBeenProcessed: 'ha sido procesada y está lista para revisión.',
        summary: '📋 Resumen',
        keyPoints: '🎯 Puntos clave',
        actionItems: '✅ Elementos de acción',
        noActionItems: 'Sin elementos de acción grabados',
        viewDetails: 'Ver detalles completos de la grabación',
        sentBy: 'Enviado por Conia • Servicio automático de análisis de grabaciones',
        needHelp: '¿Necesita ayuda? Contacte con soporte'
    },
    de: {
        preview: 'Ihre Aufnahmezusammenfassung ist bereit',
        title: '🎙️ Aufnahmezusammenfassung bereit',
        greeting: 'Hallo',
        dateText: 'Ihre Aufnahme vom',
        hasBeenProcessed: 'wurde verarbeitet und ist überprüfungsbereit.',
        summary: '📋 Zusammenfassung',
        keyPoints: '🎯 Wichtigste Punkte',
        actionItems: '✅ Aktionselemente',
        noActionItems: 'Keine Aktionselemente erfasst',
        viewDetails: 'Alle Aufnahmedetails anzeigen',
        sentBy: 'Gesendet von Conia • Automatischer Aufnahmeanalysedienst',
        needHelp: 'Benötigen Sie Hilfe? Wenden Sie sich an den Support'
    },
    pt: {
        preview: 'Seu resumo de gravação está pronto',
        title: '🎙️ Resumo de gravação pronto',
        greeting: 'Olá',
        dateText: 'Sua gravação de',
        hasBeenProcessed: 'foi processada e está pronta para revisão.',
        summary: '📋 Resumo',
        keyPoints: '🎯 Pontos-chave',
        actionItems: '✅ Itens de ação',
        noActionItems: 'Nenhum item de ação registrado',
        viewDetails: 'Ver detalhes completos da gravação',
        sentBy: 'Enviado por Conia • Serviço automático de análise de gravações',
        needHelp: 'Precisa de ajuda? Entre em contato com o suporte'
    },
    it: {
        preview: 'Il vostro riepilogo di registrazione è pronto',
        title: '🎙️ Riepilogo della registrazione pronto',
        greeting: 'Ciao',
        dateText: 'La vostra registrazione del',
        hasBeenProcessed: 'è stata elaborata ed è pronta per la revisione.',
        summary: '📋 Riepilogo',
        keyPoints: '🎯 Punti chiave',
        actionItems: '✅ Elementi di azione',
        noActionItems: 'Nessun elemento di azione registrato',
        viewDetails: 'Visualizza i dettagli completi della registrazione',
        sentBy: 'Inviato da Conia • Servizio automatico di analisi delle registrazioni',
        needHelp: 'Hai bisogno di aiuto? Contatta il supporto'
    }
}

export function RecordingSummaryEmail({
    userName,
    meetingTitle,
    summary,
    keyPoints,
    actionItems,
    recordingId,
    recordingDate,
    language = 'en'
}: RecordingSummaryEmailProps) {
    const t = translations[language] || translations.en
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

    return (
        <Html>
            <Head />
            <Preview>{t.preview}</Preview>
            <Body style={bodyStyle}>
                <Container style={containerStyle}>

                    <Section style={headerStyle}>
                        <Text style={headerTitleStyle}>
                            {t.title}
                        </Text>
                        <Text style={headerSubtitleStyle}>
                            {meetingTitle}
                        </Text>
                    </Section>

                    <Section style={contentStyle}>

                        <Text style={greetingStyle}>
                            {t.greeting} {userName},
                        </Text>

                        <Text style={dateStyle}>
                            {t.dateText} {recordingDate} {t.hasBeenProcessed}
                        </Text>

                        <Section style={summaryContainerStyle}>
                            <Text style={sectionTitleStyle}>
                                {t.summary}
                            </Text>
                            <Text style={summaryTextStyle}>
                                {summary}
                            </Text>
                        </Section>

                        {keyPoints && keyPoints.length > 0 && (
                            <Section style={keyPointsContainerStyle}>
                                <Text style={sectionTitleStyle}>
                                    {t.keyPoints}
                                </Text>
                                {keyPoints.map((point, index) => (
                                    <Text key={index} style={keyPointStyle}>
                                        • {point}
                                    </Text>
                                ))}
                            </Section>
                        )}

                        <Section style={actionItemsContainerStyle}>
                            <Text style={sectionTitleStyle}>
                                {t.actionItems}
                            </Text>
                            {actionItems.length > 0 ? (
                                actionItems.map((item) => (
                                    <Text key={item.id} style={actionItemStyle}>
                                        • {item.text}
                                    </Text>
                                ))
                            ) : (
                                <Text style={noActionItemsStyle}>
                                    {t.noActionItems}
                                </Text>
                            )}
                        </Section>

                        <Section style={buttonContainerStyle}>
                            <Button
                                href={`${baseUrl}/recording/${recordingId}`}
                                style={buttonStyle}
                            >
                                {t.viewDetails}
                            </Button>
                        </Section>

                    </Section>

                    <Hr style={hrStyle} />
                    <Section style={footerStyle}>
                        <Text style={footerTextStyle}>
                            {t.sentBy}
                        </Text>
                        <Text style={footerTextStyle}>
                            {t.needHelp}
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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
    borderLeft: '4px solid #8b5cf6',
    padding: '20px',
    margin: '25px 0',
    borderRadius: '4px'
}

const keyPointsContainerStyle = {
    backgroundColor: '#1a1a1a',
    borderLeft: '4px solid #f59e0b',
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

const keyPointStyle = {
    color: '#cccccc',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    padding: '14px 28px',
    textDecoration: 'none',
    borderRadius: '6px',
    display: 'inline-block',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.25)'
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

export default RecordingSummaryEmail
