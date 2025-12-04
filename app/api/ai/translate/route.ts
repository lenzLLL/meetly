import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing text or targetLanguage' },
        { status: 400 }
      );
    }

    // Map language codes to full language names
    const languageMap: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian',
    };

    const targetLanguageName = languageMap[targetLanguage] || 'English';
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });


    const message = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLanguageName}. 
          Respond ONLY with the translation, nothing else. No explanations, no meta-text. Just the translated text.
          The translation MUST be in ${targetLanguageName} and ONLY in ${targetLanguageName}.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const translation = message.choices[0]?.message?.content || text;

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
