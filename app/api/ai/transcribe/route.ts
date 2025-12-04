import { NextRequest, NextResponse } from "next/server";

// Minimal proxy endpoint to request a transcription from MeetingBaas.
// Expects JSON { audioUrl?: string, language?: string, metadata?: Record<string, any> }
// Requires environment variables: MEETINGBAAS_API_URL and MEETINGBAAS_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, language, metadata } = body || {};

    const MB_URL = process.env.MEETINGBAAS_API_URL;
    const MB_KEY = process.env.MEETINGBAAS_API_KEY;

    if (!MB_URL || !MB_KEY) {
      return NextResponse.json(
        { error: 'Missing MeetingBaas config: set MEETINGBAAS_API_URL and MEETINGBAAS_API_KEY' },
        { status: 500 }
      );
    }

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    // Provider-specific path may vary; this attempts a generic /transcriptions endpoint.
    const url = `${MB_URL.replace(/\/$/, '')}/transcriptions`;

    const payload = {
      audio_url: audioUrl,
      language: language || 'en',
      metadata: metadata || {}
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MB_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.text();

    // Forward provider status and body
    return new NextResponse(data, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
  } catch (error) {
    console.error('transcribe endpoint error:', error);
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }
}
