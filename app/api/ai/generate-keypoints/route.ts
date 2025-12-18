import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transcript, language } = body

    // Only use the provided transcript. Do NOT use summaries or any external data.
    const source = Array.isArray(transcript)
      ? transcript.map((s: any) => s.content || (typeof s === 'string' ? s : JSON.stringify(s))).join('\n')
      : (typeof transcript === 'string' ? transcript : '')

    if (!source || source.trim().length === 0) {
      return NextResponse.json({ keyPoints: [] })
    }

    const langMap: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian'
    }

    let systemPrompt = `You are an assistant that extracts the most important key points from the provided meeting transcript. ONLY use the transcript content supplied in the request and do NOT infer, hallucinate, or add information beyond that transcript. Return a JSON array of up to 25 concise key points (each item should be a short sentence or fragment). Do not include any additional commentary.`
    if (language && langMap[language]) {
      systemPrompt += ` Respond in ${langMap[language]}.`
    }

    const userQuestion = `Extract key points from the following content:\n\n${source}`

    const aiResponse = await chatWithAI(systemPrompt, userQuestion)

    // Try to parse JSON array from the AI response
    let keyPoints: string[] = []
    try {
      const trimmed = aiResponse.trim()
      // If response looks like JSON, parse it
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) keyPoints = parsed.map(String).slice(0, 25)
      }
    } catch (err) {
      // fallback: split by lines and clean
      const lines = aiResponse.split(/\r?\n/).map((l) => l.replace(/^[-\d\.\s\u2022]+/, '').trim()).filter(Boolean)
      keyPoints = lines.slice(0, 25)
    }

    // Final safety: ensure strings
    keyPoints = keyPoints.map((k) => (typeof k === 'string' ? k : String(k))).slice(0, 25)

    return NextResponse.json({ keyPoints })
  } catch (error) {
    console.error('generate-keypoints error:', error)
    return NextResponse.json({ keyPoints: [] }, { status: 500 })
  }
}
