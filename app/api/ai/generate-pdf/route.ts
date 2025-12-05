import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { summary, tasks, keyPoints, language, meetingTitle } = await req.json()

    const langCode = typeof language === 'string' ? language : 'fr'
    const labelsByLang: Record<string, {
      reportTitle: string
      generatedOnLabel: string
      execSummaryTitle: string
      keyPointsTitle: string
      actionItemsTitle: string
      footerText: string
    }> = {
      fr: {
        reportTitle: 'Compte-rendu d\'enregistrement',
        generatedOnLabel: 'Généré le',
        execSummaryTitle: 'Résumé exécutif',
        keyPointsTitle: 'Points clés de discussion',
        actionItemsTitle: 'Actions à réaliser',
        footerText: 'Ce rapport a été généré automatiquement par Conia Recording Studio',
      },
      en: {
        reportTitle: 'Recording Summary Report',
        generatedOnLabel: 'Generated on',
        execSummaryTitle: 'Executive Summary',
        keyPointsTitle: 'Key Discussion Points',
        actionItemsTitle: 'Action Items',
        footerText: 'This report was generated automatically by Conia Recording Studio',
      },
      es: {
        reportTitle: 'Informe de Resumen de Grabación',
        generatedOnLabel: 'Generado el',
        execSummaryTitle: 'Resumen Ejecutivo',
        keyPointsTitle: 'Puntos Clave de Discusión',
        actionItemsTitle: 'Elementos de Acción',
        footerText: 'Este informe fue generado automáticamente por Conia Recording Studio',
      },
      de: {
        reportTitle: 'Aufnahmezusammenfassungsbericht',
        generatedOnLabel: 'Generiert am',
        execSummaryTitle: 'Zusammenfassung',
        keyPointsTitle: 'Wichtige Diskussionspunkte',
        actionItemsTitle: 'Aktionselemente',
        footerText: 'Dieser Bericht wurde automatisch von Conia Recording Studio generiert',
      },
      pt: {
        reportTitle: 'Relatório de Resumo de Gravação',
        generatedOnLabel: 'Gerado em',
        execSummaryTitle: 'Resumo Executivo',
        keyPointsTitle: 'Pontos-Chave da Discussão',
        actionItemsTitle: 'Itens de Ação',
        footerText: 'Este relatório foi gerado automaticamente pelo Conia Recording Studio',
      },
      it: {
        reportTitle: 'Rapporto di Sintesi della Registrazione',
        generatedOnLabel: 'Generato il',
        execSummaryTitle: 'Sommario Esecutivo',
        keyPointsTitle: 'Punti Chiave della Discussione',
        actionItemsTitle: 'Elementi di Azione',
        footerText: 'Questo rapporto è stato generato automaticamente da Conia Recording Studio',
      },
    }

    const labels = labelsByLang[langCode] || labelsByLang['en']

    // Build topics section with simple relative weights based on keyPoints content
    let topicsSection = ''
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      const points = keyPoints.map((p: any) => String(p || ''))

      const listItems = points
        .map((point) => `<li class="task-item">${point}</li>`)
        .join('')

      topicsSection = `
            <div class="section">
              <h2>${labels.keyPointsTitle}</h2>
              <ul class="task-list">
                ${listItems}
              </ul>
            </div>
      `
    }

    // Create PDF content as HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 40px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #8b5cf6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 {
              color: #8b5cf6;
              margin: 0;
            }
            .date {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #8b5cf6;
              border-left: 4px solid #8b5cf6;
              padding-left: 15px;
              margin-bottom: 15px;
            }
            .summary-text {
              background-color: #f9f5ff;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #8b5cf6;
            }
            .task-list {
              list-style: none;
              padding: 0;
            }
            .task-item {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
              display: flex;
              align-items: flex-start;
            }
            .task-item:last-child {
              border-bottom: none;
            }
            .task-item::before {
              content: "✓";
              color: #8b5cf6;
              font-weight: bold;
              margin-right: 10px;
              font-size: 18px;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${meetingTitle || labels.reportTitle}</h1>
              <div class="date">${labels.generatedOnLabel} ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="section">
              <h2>${labels.execSummaryTitle}</h2>
              <div class="summary-text">
                ${summary || 'No summary available'}
              </div>
            </div>

            ${topicsSection}

            ${tasks && tasks.length > 0 ? `
            <div class="section">
              <h2>${labels.actionItemsTitle}</h2>
              <ul class="task-list">
                ${tasks.map((task: string) => `<li class="task-item">${task}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div class="footer">
              <p>${labels.footerText}</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Convert HTML to PDF using a simple approach
    const pdfBase64 = Buffer.from(htmlContent).toString('base64')

    return NextResponse.json({
      html: htmlContent,
      success: true,
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
