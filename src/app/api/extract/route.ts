import { NextRequest, NextResponse } from 'next/server'
import { extractWithAI, extractWithPdf } from '@/lib/aiExtractionService'
import { getMissingFields } from '@/lib/validationService'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import type { HeaderData } from '@/types'

const MAX_FILES = 5
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const SUPPORTED_PDF_TYPES   = ['application/pdf']

function getFileType(file: File): 'pdf' | 'image' | 'unsupported' {
  const mime = (file.type || '').toLowerCase()
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (SUPPORTED_PDF_TYPES.includes(mime) || ext === 'pdf') return 'pdf'
  if (SUPPORTED_IMAGE_TYPES.includes(mime) || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'image'
  return 'unsupported'
}

function getMimeType(file: File): string {
  const mime = (file.type || '').toLowerCase()
  if (SUPPORTED_IMAGE_TYPES.includes(mime)) return mime
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const extMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  return extMap[ext] || 'image/jpeg'
}

function hasExpectedSignature(buffer: Buffer, fileType: 'pdf' | 'image', mimeType: string): boolean {
  if (fileType === 'pdf') return buffer.subarray(0, 5).toString('utf8') === '%PDF-'
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return buffer.length > 8
      && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
      && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  }
  if (mimeType === 'image/webp') {
    return buffer.length > 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ngarkimi është shumë i madh. Maksimumi është 25 MB.' }, { status: 413 })
    }

    const formData = await req.formData()
    const files    = formData.getAll('files') as File[]

    if (!files?.length) {
      return NextResponse.json({ error: 'Asnjë skedar nuk u ngarkua.' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Shumë skedarë. Maksimumi është ${MAX_FILES}.` }, { status: 413 })
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ngarkimi është shumë i madh. Maksimumi është 25 MB.' }, { status: 413 })
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
      if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({
          error: `Skedari "${file.name}" është bosh ose më i madh se 15 MB.`,
        }, { status: 413 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const mimeType = fileType === 'image' ? getMimeType(file) : 'application/pdf'
      if (!hasExpectedSignature(buffer, fileType, mimeType)) {
        rejected.push(file.name)
        continue
      }
      const b64    = buffer.toString('base64')

      if (fileType === 'pdf') {
        pdfBase64s.push(b64)
      } else {
        imageBase64s.push(b64)
        imageMimeTypes.push(mimeType)
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
      // PDFs → Files API upload → model-native processing
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
    return NextResponse.json({ error: 'Gabim gjatë leximit të dokumentit.' }, { status: 500 })
  }
}
