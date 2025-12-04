import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const language = (formData.get('language') as string | null) || 'fr'

    if (!file) {
      return NextResponse.json({ error: 'no file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'invalid file type, audio expected' },
        { status: 400 },
      )
    }

    // Transcription audio → texte via OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file,
      // Adapte le modèle si besoin selon ta config OpenAI
      model: 'gpt-4o-mini-transcribe',
      language,
    } as any)

    const transcriptText =
      (transcription as any).text || (transcription as any).transcript || ''

    if (!transcriptText || !transcriptText.trim()) {
      return NextResponse.json(
        { error: 'empty transcript from OpenAI audio' },
        { status: 500 },
      )
    }

    // Analyse texte (résumé, tâches, points clés) via OpenAI
    const languageMap: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian',
    }

    const langName = languageMap[language] || 'French'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert meeting analyst. You MUST respond ONLY in ${langName}. No other language is permitted.

Analyze the meeting transcript and provide ONLY a JSON response with these exact keys:
- summary: A concise executive summary (3-4 sentences) in ${langName}
- tasks: A list of key action items/tasks in ${langName}
- keyPoints: Main discussion points in ${langName}

IMPORTANT: Every single word in your response MUST be in ${langName}. Do not mix languages.
Respond ONLY with valid JSON, nothing else.
don't go beyond transcript don't use your imagination.
`,
        },
        {
          role: 'user',
          content: `Analyze this meeting transcript and respond ONLY in ${langName}:

${transcriptText}`,
        },
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
  ? parsed.tasks // tableau de string directement
  : [];
   const keyPoints = Array.isArray(parsed.keyPoints)
  ? parsed.keyPoints
  : [];
    console.log('ANALYZE RESULT:', { parsed, tasks, keyPoints });
    return NextResponse.json({
      transcript: transcriptText,
      summary: parsed.summary || '',
      tasks,
      keyPoints,
    })
  } catch (error) {
    console.error('recording/transcribe-and-analyze error:', error)
    return NextResponse.json(
      { error: 'failed to transcribe and analyze audio' },
      { status: 500 },
    )
  }
}
