import { NextRequest, NextResponse } from 'next/server'
import { extractWithAI, extractWithText } from '@/lib/aiExtractionService'
import { getMissingFields } from '@/lib/validationService'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import type { HeaderData } from '@/types'

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

async function pdfToText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('pdf-parse') as any
  const pdfParse = mod.default ?? mod
  const data = await pdfParse(buffer)
  return data.text || ''
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files    = formData.getAll('files') as File[]

    if (!files?.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const base64Images: string[] = []
    const pdfTexts:     string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      if (isPdf(file)) {
        try {
          const text = await pdfToText(buffer)
          if (text.trim()) {
            console.log(`[Extract] PDF text extracted: ${text.length} chars from "${file.name}"`)
            pdfTexts.push(text)
          } else {
            // PDF has no extractable text (scanned) → treat as image via base64
            console.log(`[Extract] PDF has no text layer, sending as image: "${file.name}"`)
            base64Images.push(buffer.toString('base64'))
          }
        } catch (err) {
          console.warn('[Extract] pdf-parse failed, falling back to image:', err)
          base64Images.push(buffer.toString('base64'))
        }
      } else {
        base64Images.push(buffer.toString('base64'))
      }
    }

    // Choose extraction path based on what we have
    let result
    if (pdfTexts.length > 0 && base64Images.length === 0) {
      // Only PDFs with text — use text extraction (cheaper, faster, more accurate)
      result = await extractWithText(pdfTexts.join('\n\n---\n\n'))
    } else if (base64Images.length > 0 && pdfTexts.length === 0) {
      // Only images — use vision
      result = await extractWithAI(base64Images, 'image/jpeg')
    } else if (pdfTexts.length > 0 && base64Images.length > 0) {
      // Mixed — extract both, merge (text first for structure, images for any photos)
      const textResult  = await extractWithText(pdfTexts.join('\n\n---\n\n'))
      const imageResult = await extractWithAI(base64Images, 'image/jpeg')
      // Prefer text result for header, merge items
      result = {
        header: { ...imageResult.header, ...textResult.header },
        items:  textResult.items.length > 0 ? textResult.items : imageResult.items,
        missingFields: [],
      }
    } else {
      return NextResponse.json({ error: 'No processable content found in files' }, { status: 400 })
    }

    const positions    = groupToAsycudaPositions(result.items)
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
