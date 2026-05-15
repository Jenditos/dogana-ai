import { NextRequest, NextResponse } from 'next/server'
import { generateExcel } from '@/lib/excelExportService'
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

    const buffer = generateExcel(header, items, positions, missingFields)
    const filename = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.xlsx`
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Excel export failed' }, { status: 500 })
  }
}
