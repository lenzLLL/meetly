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

    // Check file type by MIME or filename
    const isAudioType = file.type.startsWith('audio/') || 
                        file.name.toLowerCase().endsWith('.webm') ||
                        file.name.toLowerCase().endsWith('.mp3') ||
                        file.name.toLowerCase().endsWith('.wav') ||
                        file.name.toLowerCase().endsWith('.m4a') ||
                        file.name.toLowerCase().endsWith('.ogg')
    
    if (!isAudioType) {
      return NextResponse.json(
        { error: 'invalid file type, audio expected' },
        { status: 400 },
      )
    }

    // Transcription audio → texte via OpenAI
    // Ensure file has proper extension for OpenAI
    const fileName = file.name || 'audio.webm'
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'webm'
    
    // Create a properly named file blob for OpenAI
    const audioFile = new File([await file.arrayBuffer()], `audio.${fileExt}`, { type: file.type || 'audio/webm' })
    
    console.log('Sending to OpenAI:', { fileName: audioFile.name, type: audioFile.type, size: audioFile.size })
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
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
          content: `You are a meeting transcript analyzer. You MUST respond ONLY in ${langName}. 

CRITICAL RULES:
1. Extract information ONLY from what is explicitly stated in the transcript
2. Do NOT invent, assume, or infer anything not directly mentioned
3. Do NOT add context from general knowledge
4. Only mention tasks/points that are explicitly discussed or agreed upon
5. Keep summaries factual and based solely on what was said

Return ONLY valid JSON with these exact keys:
- summary: Concise factual summary of what was discussed (2-3 sentences max)
- tasks: ONLY explicit action items that were mentioned or agreed upon
- keyPoints: ONLY topics/subjects that were actually discussed

Response format: {"summary": "...", "tasks": [...], "keyPoints": [...]}`,
        },
        {
          role: 'user',
          content: `Analyze this transcript. Extract ONLY what is explicitly stated. No assumptions, no inference:

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
     
    const toText = (item: any) => {
      if (typeof item === 'string') return item
      if (!item) return ''
      return item.text || item.content || item.title || item.name || JSON.stringify(item)
    }

    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(toText) : []
    const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(toText) : []
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
