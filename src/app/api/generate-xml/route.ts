import { NextRequest, NextResponse } from 'next/server'
import { generateXml, detectOldValues } from '@/lib/xmlTemplateEngine'
import { validateAll } from '@/lib/validationService'
import { guardApiRequest } from '@/lib/requestGuards'
import type { HeaderData, AsycudaPosition, InvoiceItem, AppSettings } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const guarded = guardApiRequest(req, 'generate-xml', { limit: 120, windowMs: 60 * 60 * 1000 })
    if (guarded) return guarded

    const body = await req.json()
    const { header, items, positions, settings, forceDraft } = body as {
      header: HeaderData
      items: InvoiceItem[]
      positions: AsycudaPosition[]
      settings: AppSettings
      forceDraft: boolean
    }

    const validation = validateAll(header, items, positions)

    const requiresDraft = !validation.valid || validation.warnings.length > 0

    if (requiresDraft && !forceDraft) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
        requiresDraft: true,
      }, { status: 422 })
    }

    const xml = generateXml(header, positions, settings)
    const oldValues = detectOldValues(xml)
    const status = forceDraft || requiresDraft ? 'draft' : 'ready'

    return NextResponse.json({
      xml,
      status,
      validation,
      oldValues,
      isDraft: forceDraft || requiresDraft,
    })
  } catch (error) {
    console.error('XML generation error:', error)
    return NextResponse.json(
      { error: 'XML generation failed' },
      { status: 500 }
    )
  }
}
