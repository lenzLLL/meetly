import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name || 'uploaded.pdf'
    const fileSize = Number((file as any).size) || 0

    // Limit to avoid huge uploads (e.g., 25 MB)
    const MAX_BYTES = 25 * 1024 * 1024
    if (fileSize > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    // Convert uploaded File to Buffer
    const arrayBuffer = await (file as any).arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use pdf-parse to extract text
    const data = await pdfParse(buffer)
    const text = (data && data.text) ? data.text.trim() : ''

    if (!text) {
      // If no text extracted, return a helpful message (possible scanned PDF)
      return NextResponse.json({
        success: true,
        text: `PDF file received: ${fileName}. No textual content could be extracted (maybe a scanned image PDF). Consider OCR processing.`,
        fileName,
      })
    }

    return NextResponse.json({ success: true, text, fileName })
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 })
  }
}
