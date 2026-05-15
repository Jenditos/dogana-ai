import { NextRequest, NextResponse } from 'next/server'
import { generateXml, detectOldValues } from '@/lib/xmlTemplateEngine'
import { validateAll } from '@/lib/validationService'
import type { HeaderData, AsycudaPosition, InvoiceItem, AppSettings } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { header, items, positions, settings, forceDraft } = body as {
      header: HeaderData
      items: InvoiceItem[]
      positions: AsycudaPosition[]
      settings: AppSettings
      forceDraft: boolean
    }

    const validation = validateAll(header, items, positions)

    if (!validation.valid && !forceDraft) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
        requiresDraft: true,
      }, { status: 422 })
    }

    const xml = generateXml(header, positions, settings)
    const oldValues = detectOldValues(xml)
    const status = !validation.valid ? 'draft' : validation.warnings.length > 0 ? 'review' : 'ready'

    return NextResponse.json({
      xml,
      status,
      validation,
      oldValues,
      isDraft: !validation.valid,
    })
  } catch (error) {
    console.error('XML generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'XML generation failed' },
      { status: 500 }
    )
  }
}
