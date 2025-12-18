import { NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { summary, keyPoints, actionItems, transcript, language } = body || {}

    // Log incoming request for debugging
    try {
      // eslint-disable-next-line no-console
      console.log('translate-content request:', { language, transcriptSnippet: (typeof transcript === 'string' ? transcript.slice(0, 200) : (Array.isArray(transcript) ? JSON.stringify(transcript).slice(0,200) : '')) })
    } catch (e) {}

    const langName = language || 'fr'
    const systemPrompt = `You are a translation assistant. Translate the provided meeting content into the target language: ${langName}. ONLY use the provided content. Do NOT add, infer, or hallucinate information beyond the supplied text. Return a valid JSON object with keys: translatedSummary (string), translatedKeyPoints (array of strings), translatedActionItems (array of strings), translatedTranscript (string). Do not include any commentary or extra fields; only return the JSON object.`

    const userPrompt = `Translate the following content into ${langName} and return only a JSON object with the keys described above.\n\nSummary:\n${summary || ''}\n\nKeyPoints:\n${(Array.isArray(keyPoints) ? keyPoints.join('\n') : keyPoints) || ''}\n\nActionItems:\n${(Array.isArray(actionItems) ? actionItems.join('\n') : actionItems) || ''}\n\nTranscript:\n${transcript || ''}`

    const aiResponse = await chatWithAI(systemPrompt, userPrompt)

    // Try to parse JSON from the model
    let parsed: any = null
    try {
      parsed = JSON.parse(aiResponse)
    } catch (e) {
      // Fallback: attempt to extract sections by labels
      parsed = {
        translatedSummary: aiResponse,
        translatedKeyPoints: Array.isArray(keyPoints) ? keyPoints : (typeof keyPoints === 'string' ? keyPoints.split('\n') : []),
        translatedActionItems: Array.isArray(actionItems) ? actionItems : (typeof actionItems === 'string' ? actionItems.split('\n') : []),
        translatedTranscript: transcript || '',
      }
    }

    // Log parsed response for debugging
    try {
      // eslint-disable-next-line no-console
      console.log('translate-content response parsed keys:', {
        hasSummary: Boolean(parsed.translatedSummary || parsed.summary),
        keyPointsCount: Array.isArray(parsed.translatedKeyPoints) ? parsed.translatedKeyPoints.length : 0,
      })
    } catch (e) {}

    return NextResponse.json({
      translatedSummary: parsed.translatedSummary || parsed.summary || '',
      translatedKeyPoints: parsed.translatedKeyPoints || parsed.keyPoints || [],
      translatedActionItems: parsed.translatedActionItems || parsed.actionItems || [],
      translatedTranscript: parsed.translatedTranscript || parsed.transcript || '',
    })
  } catch (err) {
    console.error('translate-content error', err)
    return NextResponse.json({ error: 'Failed to translate content' }, { status: 500 })
  }
}
