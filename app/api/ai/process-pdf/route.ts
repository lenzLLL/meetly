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

    // Convert uploaded File to Buffer (handle different runtimes)
    let buffer: Buffer
    try {
      if (typeof (file as any).arrayBuffer === 'function') {
        const arrayBuffer = await (file as any).arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else if (typeof (file as any).stream === 'function' || (file as any).stream) {
        // Node-like stream
        const stream = (file as any).stream()
        const chunks: Buffer[] = []
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        buffer = Buffer.concat(chunks)
      } else if (typeof (file as any).stream === 'object' && (file as any).stream?.getReader) {
        // Web ReadableStream
        const reader = (file as any).stream().getReader()
        const chunks: Buffer[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(Buffer.from(value))
        }
        buffer = Buffer.concat(chunks)
      } else {
        // Last resort: try to read as arrayBuffer from request body (not ideal)
        console.warn('process-pdf: unknown File shape, attempting request.arrayBuffer() fallback')
        const ab = await request.arrayBuffer()
        buffer = Buffer.from(ab)
      }
    } catch (err) {
      console.error('Error reading uploaded file into buffer:', err)
      return NextResponse.json({ error: 'Failed to read uploaded file' }, { status: 500 })
    }

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
