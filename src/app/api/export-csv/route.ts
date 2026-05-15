import { NextRequest, NextResponse } from 'next/server'
import { generateCsv } from '@/lib/csvExportService'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { header, items, positions, missingFields } = body as {
      header: HeaderData
      items: InvoiceItem[]
      positions: AsycudaPosition[]
      missingFields: MissingField[]
    }

    const csv = generateCsv(header, items, positions, missingFields)
    const filename = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'CSV export failed' }, { status: 500 })
  }
}
