import { NextRequest, NextResponse } from 'next/server'
import { extractWithAI, extractWithPdf } from '@/lib/aiExtractionService'
import { getMissingFields } from '@/lib/validationService'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import type { HeaderData } from '@/types'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const SUPPORTED_PDF_TYPES   = ['application/pdf']

function getFileType(file: File): 'pdf' | 'image' | 'unsupported' {
  const mime = (file.type || '').toLowerCase()
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (SUPPORTED_PDF_TYPES.includes(mime) || ext === 'pdf') return 'pdf'
  if (SUPPORTED_IMAGE_TYPES.includes(mime) || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  return 'unsupported'
}

function getMimeType(file: File): string {
  const mime = (file.type || '').toLowerCase()
  if (SUPPORTED_IMAGE_TYPES.includes(mime)) return mime
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const extMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
  return extMap[ext] || 'image/jpeg'
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files    = formData.getAll('files') as File[]

    if (!files?.length) {
      return NextResponse.json({ error: 'Asnjë skedar nuk u ngarkua.' }, { status: 400 })
    }

    const pdfBase64s:    string[] = []
    const imageBase64s:  string[] = []
    const imageMimeTypes:string[] = []
    const rejected:      string[] = []

    for (const file of files) {
      const fileType = getFileType(file)
      if (fileType === 'unsupported') {
        rejected.push(file.name)
        continue
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const b64    = buffer.toString('base64')

      if (fileType === 'pdf') {
        pdfBase64s.push(b64)
      } else {
        imageBase64s.push(b64)
        imageMimeTypes.push(getMimeType(file))
      }
    }

    if (rejected.length > 0) {
      return NextResponse.json({
        error: `Formati nuk mbështetet: ${rejected.join(', ')}. Ngarko PDF, JPG, PNG ose WEBP.`,
      }, { status: 400 })
    }

    if (pdfBase64s.length === 0 && imageBase64s.length === 0) {
      return NextResponse.json({ error: 'Asnjë skedar i vlefshëm nuk u gjet.' }, { status: 400 })
    }

    let result
    if (pdfBase64s.length > 0) {
      // PDFs → Files API upload → gpt-4o-mini native processing
      // Images (if mixed) → passed alongside PDFs
      result = await extractWithPdf(pdfBase64s, imageBase64s, imageMimeTypes)
    } else {
      // Images only → Vision API
      result = await extractWithAI(imageBase64s, imageMimeTypes[0] || 'image/jpeg')
    }

    const positions     = groupToAsycudaPositions(result.items)
    const missingFields = getMissingFields(result.header as HeaderData, result.items)

    return NextResponse.json({ header: result.header, items: result.items, positions, missingFields })
  } catch (error) {
    console.error('[Extract] error:', error)
    const msg = error instanceof Error ? error.message : 'Gabim gjatë leximit të dokumentit.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
