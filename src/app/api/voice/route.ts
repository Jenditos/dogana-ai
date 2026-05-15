import { NextRequest, NextResponse } from 'next/server'
import { extractWithVoice } from '@/lib/aiExtractionService'

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    const result = await extractWithVoice(transcript)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Voice extraction failed' },
      { status: 500 }
    )
  }
}
