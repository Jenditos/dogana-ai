import { NextRequest, NextResponse } from 'next/server'
import { extractWithAI } from '@/lib/aiExtractionService'
import { getMissingFields } from '@/lib/validationService'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import type { HeaderData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const base64Images: string[] = []
    let mimeType = 'image/jpeg'

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      base64Images.push(base64)
      mimeType = file.type || 'image/jpeg'
    }

    const result = await extractWithAI(base64Images, mimeType)
    const positions = groupToAsycudaPositions(result.items)
    const missingFields = getMissingFields(result.header as HeaderData, result.items)

    return NextResponse.json({
      header: result.header,
      items: result.items,
      positions,
      missingFields,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}
