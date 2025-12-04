import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { summary, tasks, keyPoints, language } = await req.json()

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
        reportTitle: 'Compte-rendu de réunion',
        generatedOnLabel: 'Généré le',
        execSummaryTitle: 'Résumé exécutif',
        keyPointsTitle: 'Points clés de discussion',
        actionItemsTitle: 'Actions à réaliser',
        footerText: 'Ce rapport a été généré automatiquement par Meetly Recording Studio',
      },
      en: {
        reportTitle: 'Meeting Summary Report',
        generatedOnLabel: 'Generated on',
        execSummaryTitle: 'Executive Summary',
        keyPointsTitle: 'Key Discussion Points',
        actionItemsTitle: 'Action Items',
        footerText: 'This report was generated automatically by Meetly Recording Studio',
      },
    }

    const labels = labelsByLang[langCode] || labelsByLang['en']

    // Build topics section with simple relative weights based on keyPoints content
    let topicsSection = ''
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      const points = keyPoints.map((p: any) => String(p || ''))
      const rawScores = points.map((p) => Math.max(1, p.length))
      const maxScore = Math.max(...rawScores)
      const widths = rawScores.map((s) => 40 + Math.round((s / maxScore) * 60)) // 40%–100%

      const listItems = points
        .map((point) => `<li class="task-item">${point}</li>`)
        .join('')

      const bars = points
        .map((point, index) => {
          const width = Math.min(Math.max(widths[index] || 40, 40), 100)
          return `<div class="topic-bar" style="width:${width}%">
              <span class="topic-bar-label">${index + 1}</span>
            </div>`
        })
        .join('')

      topicsSection = `
            <div class="section">
              <h2>${labels.keyPointsTitle}</h2>
              <ul class="task-list">
                ${listItems}
              </ul>
              <div class="topics-graph">
                ${bars}
              </div>
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
            .topics-graph {
              margin-top: 12px;
            }
            .topic-bar {
              height: 10px;
              border-radius: 999px;
              background: linear-gradient(90deg, #8b5cf6, #ec4899);
              margin-bottom: 8px;
              position: relative;
              overflow: hidden;
            }
            .topic-bar-label {
              position: absolute;
              left: 8px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 10px;
              color: #f9f5ff;
              font-weight: bold;
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
              <h1>${labels.reportTitle}</h1>
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
