import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { texts, targetLanguage } = await req.json();
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return NextResponse.json({ error: 'Missing texts array or targetLanguage' }, { status: 400 });
    }

    const languageMap: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian',
    };
    const targetLanguageName = languageMap[targetLanguage] || 'English';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build a prompt that asks the model to return a JSON array of translations in the same order
    const system = `You are a professional translator. Translate each input text to ${targetLanguageName}. Respond with a single JSON array whose elements are the plain translated strings in the exact same order as inputs. The response MUST be valid JSON only, nothing else.`;

    const userContent = JSON.stringify({ texts });

    const resp = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = resp.choices?.[0]?.message?.content || '';

    // Try to parse JSON from model output
    let translations: string[] = [];
    try {
      translations = JSON.parse(raw);
      if (!Array.isArray(translations)) {
        throw new Error('parsed value is not array');
      }
    } catch (e) {
      // Fallback: try to extract first JSON array substring
      const match = raw.match(/\[([\s\S]*)\]/);
      if (match) {
        try {
          translations = JSON.parse(match[0]);
        } catch (ee) {
          console.error('batch translation parse fallback failed', ee, raw);
          return NextResponse.json({ error: 'Failed to parse translations from model' }, { status: 500 });
        }
      } else {
        console.error('batch translation unexpected output', raw);
        return NextResponse.json({ error: 'Unexpected translation output' }, { status: 500 });
      }
    }

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('translate-batch error', error);
    return NextResponse.json({ error: 'translate-batch failed' }, { status: 500 });
  }
}
