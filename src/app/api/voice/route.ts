import { NextRequest, NextResponse } from 'next/server'
import { extractWithVoice } from '@/lib/aiExtractionService'
import { guardApiRequest } from '@/lib/requestGuards'

export async function POST(req: NextRequest) {
  try {
    const guarded = guardApiRequest(req, 'voice', { limit: 60, windowMs: 60 * 60 * 1000 })
    if (guarded) return guarded

    const { transcript } = await req.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    const result = await extractWithVoice(transcript)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Voice] error:', error)
    return NextResponse.json(
      { error: 'Voice extraction failed' },
      { status: 500 }
    )
  }
}
