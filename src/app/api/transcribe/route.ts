import { NextRequest, NextResponse } from 'next/server'
import { guardApiRequest } from '@/lib/requestGuards'

export async function POST(req: NextRequest) {
  try {
    const guarded = guardApiRequest(req, 'transcribe', { limit: 30, windowMs: 60 * 60 * 1000 })
    if (guarded) return guarded

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })

    const formData = await req.formData()
    const audio    = formData.get('audio') as File | null
    const lang     = (formData.get('lang') as string) || 'sq'

    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    // Forward to OpenAI Whisper
    const whisperForm = new FormData()
    whisperForm.append('file', audio, audio.name || 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', lang === 'sq' ? 'sq' : lang === 'de' ? 'de' : 'en')
    whisperForm.append('response_format', 'json')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Whisper] error:', err)
      return NextResponse.json({ error: 'Transcription provider failed' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ transcript: data.text || '' })
  } catch (error) {
    console.error('[Transcribe] error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
