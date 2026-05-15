import { NextRequest, NextResponse } from 'next/server'
import { extractWithAI, extractWithPdf } from '@/lib/aiExtractionService'
import { getMissingFields } from '@/lib/validationService'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import type { HeaderData } from '@/types'

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files    = formData.getAll('files') as File[]

    if (!files?.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const pdfBase64s:   string[] = []
    const imageBase64s: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const b64    = buffer.toString('base64')
      if (isPdf(file)) {
        pdfBase64s.push(b64)
      } else {
        imageBase64s.push(b64)
      }
    }

    // PDFs → OpenAI native PDF processing (text + page images, no local parsing)
    // Images → Vision API
    let result
    if (pdfBase64s.length > 0 && imageBase64s.length === 0) {
      result = await extractWithPdf(pdfBase64s)
    } else if (imageBase64s.length > 0 && pdfBase64s.length === 0) {
      result = await extractWithAI(imageBase64s, 'image/jpeg')
    } else if (pdfBase64s.length > 0 && imageBase64s.length > 0) {
      // Mixed: send all to extractWithPdf (handles both PDFs and images)
      result = await extractWithPdf(pdfBase64s, imageBase64s)
    } else {
      return NextResponse.json({ error: 'No files to process' }, { status: 400 })
    }

    const positions     = groupToAsycudaPositions(result.items)
    const missingFields = getMissingFields(result.header as HeaderData, result.items)

    return NextResponse.json({ header: result.header, items: result.items, positions, missingFields })
  } catch (error) {
    console.error('[Extract] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}
