import { NextRequest, NextResponse } from 'next/server'
import { generateExcel } from '@/lib/excelExportService'
import { guardApiRequest } from '@/lib/requestGuards'
import { validateXmlPayload } from '@/lib/schemaValidation'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const guarded = await guardApiRequest(req, 'export-excel', { limit: 120, windowMs: 60 * 60 * 1000 })
    if (guarded) return guarded

    const body = await req.json()
    const payloadValidation = validateXmlPayload(body)
    if (!payloadValidation.ok) {
      return NextResponse.json(
        { error: 'Invalid export payload', errors: payloadValidation.errors },
        { status: 400 }
      )
    }

    const { header, items, positions, missingFields } = body as {
      header: HeaderData
      items: InvoiceItem[]
      positions: AsycudaPosition[]
      missingFields: MissingField[]
    }

    const buffer = await generateExcel(header, items, positions, missingFields)
    const filename = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.xlsx`
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Excel export failed' }, { status: 500 })
  }
}
