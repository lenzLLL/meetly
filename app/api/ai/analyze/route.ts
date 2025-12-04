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
          content: `You are an expert meeting analyst. You MUST respond ONLY in ${langName}. Respond ONLY in valid JSON with keys: summary, tasks, keyPoints don't go beyond transcript don't use your imagination.`
        },
        { role: 'user', content: transcriptText }
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
     
      const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.map((text: string, index: number) => ({
          id: index + 1,
          text,
        }))
      : [];
      const keyPoints  = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.map((text: string, index: number) => ({
          id: index + 1,
          text,
        }))
      : [];
    // Retourne les trois valeurs bien séparées
    return NextResponse.json({
      summary:parsed.summary|| '',
      tasks: tasks,
      keyPoints:[]
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json({ error: 'Failed to analyze transcript' }, { status: 500 })
  }
}
