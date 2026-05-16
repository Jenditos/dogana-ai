import ExcelJS from 'exceljs'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField } from '@/types'

type CellValue = string | number
type SheetRow = CellValue[]

function addSheet(workbook: ExcelJS.Workbook, name: string, rows: SheetRow[], widths: number[]): void {
  const ws = workbook.addWorksheet(name)
  ws.addRows(rows)
  ws.columns = widths.map(width => ({ width }))

  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } }
  header.alignment = { vertical: 'middle' }

  ws.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
      cell.alignment = { vertical: 'middle', wrapText: true }
    })
  })

  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function generateExcel(
  header: HeaderData,
  items: InvoiceItem[],
  positions: AsycudaPosition[],
  missingFields: MissingField[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'DUDI AI Generator'
  wb.created = new Date()

  // Sheet 1: Permbledhje
  const summaryData: SheetRow[] = [
    ['Eksportuesi', header.exporterName || ''],
    ['Importuesi', header.importerName || ''],
    ['NUI/NIPT', header.importerNui || ''],
    ['Fatura', header.invoiceNumber || ''],
    ['Data', header.invoiceDate || ''],
    ['Kontejneri', header.containerNumber || ''],
    ['Incoterm', header.incoterm || ''],
    ['Porti i ngarkimit', header.portOfLoading || ''],
    ['Porti i shkarkimit', header.portOfDischarge || ''],
    ['Vendi i origjines', header.countryOfOrigin || ''],
    ['Vendi i eksportit', header.countryOfExport || ''],
    ['Destinacioni', header.countryOfDestination || ''],
    ['Monedha', header.currency || ''],
    ['Vlera totale', header.totalInvoice || 0],
    ['Pesha bruto totale', header.totalGrossWeight || 0],
    ['Paketime totale', header.totalPackages || 0],
    ['Volumi total', header.totalVolume || 0],
  ]
  addSheet(wb, 'Permbledhje', [['Fusha', 'Vlera'], ...summaryData], [30, 40])

  // Sheet 2: Rreshtat e fatures
  const itemHeaders = ['Nr.', 'Item No.', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia', 'Njesia', 'Cmimi/njesi', 'Vlera totale', 'Paketime', 'Pesha bruto', 'Pesha neto', 'Volumi', 'Kodi tarifor', 'Dogana %', 'TVSH %', 'Statusi']
  const itemRows: SheetRow[] = items.map((item, i) => [
    i + 1, item.itemNo, item.descriptionEn, item.descriptionSq,
    item.qty, item.unit, item.unitPrice, item.totalValue,
    item.packages, item.grossWeight, item.netWeight, item.volume,
    item.tariffCode, item.customsRate, item.vatRate, item.status,
  ])
  // Totals row
  const totalRow: SheetRow = [
    'TOTAL', '', '', '',
    items.reduce((s, i) => s + i.qty, 0), '',
    '', items.reduce((s, i) => s + i.totalValue, 0),
    items.reduce((s, i) => s + i.packages, 0),
    items.reduce((s, i) => s + i.grossWeight, 0),
    items.reduce((s, i) => s + i.netWeight, 0),
    items.reduce((s, i) => s + i.volume, 0),
    '', '', '', '',
  ]
  addSheet(wb, 'Rreshtat e fatures', [itemHeaders, ...itemRows, totalRow], itemHeaders.map((_, i) => i < 2 ? 8 : i < 4 ? 35 : 15))

  // Sheet 3: Pozicionet ASYCUDA
  const posHeaders = ['Pozicioni', 'Kodi tarifor', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia totale', 'Vlera totale', 'Pesha bruto', 'Pesha neto', 'Paketime', 'Dogana %', 'TVSH %', 'Statusi']
  const posRows: SheetRow[] = positions.map(pos => [
    pos.positionNo, pos.tariffCode, pos.descriptionEn, pos.descriptionSq,
    pos.totalQty, pos.totalValue, pos.grossWeight, pos.netWeight,
    pos.packages, pos.customsRate, pos.vatRate, pos.status,
  ])
  const posTotalRow: SheetRow = [
    'TOTAL', '', '', '',
    positions.reduce((s, p) => s + p.totalQty, 0),
    positions.reduce((s, p) => s + p.totalValue, 0),
    positions.reduce((s, p) => s + p.grossWeight, 0),
    positions.reduce((s, p) => s + p.netWeight, 0),
    positions.reduce((s, p) => s + p.packages, 0),
    '', '', '',
  ]
  addSheet(wb, 'Pozicionet ASYCUDA', [posHeaders, ...posRows, posTotalRow], posHeaders.map((_, i) => i < 2 ? 12 : i < 4 ? 35 : 15))

  // Sheet 4: Mapping XML
  const mapHeaders = ['Fusha XML', 'Pershkrimi', 'Vlera aktuale']
  const mapData: SheetRow[] = [
    ['Exporter_name', 'Eksportuesi', header.exporterName || ''],
    ['Consignee_name', 'Importuesi', header.importerName || ''],
    ['Consignee_code', 'NUI', header.importerNui || ''],
    ['Invoice_number', 'Numri faturës', header.invoiceNumber || ''],
    ['Export_country_code', 'Vendi eksportit', header.countryOfExport || ''],
    ['Destination_country_code', 'Destinacioni', header.countryOfDestination || ''],
    ['Currency', 'Monedha', header.currency || ''],
    ['Total_items', 'Numri pozicioneve', positions.length],
    ['Container', 'Kontejneri', header.containerNumber || ''],
  ]
  addSheet(wb, 'Mapping XML', [mapHeaders, ...mapData], [30, 30, 40])

  // Sheet 5: Kontrolli
  const ctrlData: SheetRow[] = [
    ['Kontrolli', 'Rezultati'],
    ['Sasia pozicioneve', positions.length],
    ['Vlera totale pozicioneve', positions.reduce((s, p) => s + p.totalValue, 0).toFixed(2)],
    ['Vlera totale fatures', header.totalInvoice || 0],
    ['Diferenca vlere', Math.abs((positions.reduce((s, p) => s + p.totalValue, 0)) - (header.totalInvoice || 0)).toFixed(2)],
    ['Pesha bruto totale pozicioneve', positions.reduce((s, p) => s + p.grossWeight, 0).toFixed(2)],
    ['Pesha bruto totale fatures', header.totalGrossWeight || 0],
    ['Paketime totale pozicioneve', positions.reduce((s, p) => s + p.packages, 0)],
    ['Paketime totale fatures', header.totalPackages || 0],
  ]
  addSheet(wb, 'Kontrolli', ctrlData, [40, 20])

  // Sheet 6: Te dhenat qe mungojne
  const missingHeaders = ['Fusha', 'Artikulli', 'Problemi', 'Cfare duhet plotesuar', 'Statusi']
  const missingRows: SheetRow[] = missingFields.map(m => [m.field, m.item || '', m.problem, m.whatToFill, m.status])
  addSheet(wb, 'Te dhenat qe mungojne', [missingHeaders, ...missingRows], [25, 35, 40, 35, 15])

  const output = await wb.xlsx.writeBuffer()
  return Buffer.isBuffer(output) ? output : Buffer.from(output as ArrayBuffer)
}
