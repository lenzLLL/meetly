import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { transcript, language } = await req.json()

    let transcriptText = ''
    if (typeof transcript === 'string') {
      transcriptText = transcript
    } else if (Array.isArray(transcript)) {
      transcriptText = transcript
        .map((seg: any) => {
          let words = ''
          if (Array.isArray(seg.words)) words = seg.words.map((w: any) => w.word || w).join(' ')
          else if (typeof seg.words === 'string') words = seg.words
          else if (seg.text) words = seg.text
          return `${seg.speaker || 'Speaker'}: ${words}`.trim()
        })
        .join('\n')
    } else if (transcript && typeof transcript === 'object') {
      try { transcriptText = JSON.stringify(transcript) } catch { transcriptText = String(transcript) }
    }

    const languageMap: Record<string, string> = {
      en: 'English', fr: 'French', es: 'Spanish',
      de: 'German', pt: 'Portuguese', it: 'Italian'
    }
    const langName = languageMap[language || 'en'] || 'English'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a meeting transcript analyzer. You MUST respond ONLY in ${langName}.

CRITICAL RULES:
1. Extract information ONLY from what is explicitly stated in the transcript
2. Do NOT invent, assume, or infer anything not directly mentioned
3. Do NOT add context from general knowledge
4. Only mention tasks/points that are explicitly discussed or agreed upon
5. Keep summaries factual and based solely on what was said

Return ONLY valid JSON with exact keys:
- summary: Factual summary of what was discussed (2-3 sentences max)
- tasks: ONLY explicit action items mentioned or agreed upon
- keyPoints: ONLY topics/subjects actually discussed

Format: {"summary": "...", "tasks": [...], "keyPoints": [...]}`
        },
        { role: 'user', content: `Extract information ONLY explicitly stated in transcript. No assumptions:\n\n${transcriptText}` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

   const response = completion.choices[0].message.content?.trim();
   if (!response) throw new Error("Empty response from OpenAI");
       let parsed;
       try {
         const jsonStart = response.indexOf("{");
         const jsonEnd = response.lastIndexOf("}");
         const jsonString = response.slice(jsonStart, jsonEnd + 1);
         parsed = JSON.parse(jsonString);
       } catch (err) {
         console.error("Invalid JSON from OpenAI:", response);
         parsed = {
           summary: "...",
           tasks: [],
           keyPoints:[]
         };
       }
    // EXTRACTION PROPRE DU JSON
     
      const toText = (item: any) => {
        if (typeof item === 'string') return item
        if (!item) return ''
        return item.text || item.content || item.title || item.name || JSON.stringify(item)
      }

      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(toText) : []
      const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(toText) : []
    // Retourne les trois valeurs bien séparées
    return NextResponse.json({
      summary:parsed.summary|| '',
      tasks: tasks,
      keyPoints: keyPoints
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({ error: 'Failed to analyze transcript' }, { status: 500 })
  }
}
