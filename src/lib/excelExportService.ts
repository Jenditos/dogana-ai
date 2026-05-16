import * as XLSX from 'xlsx'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField } from '@/types'

export function generateExcel(
  header: HeaderData,
  items: InvoiceItem[],
  positions: AsycudaPosition[],
  missingFields: MissingField[]
): Buffer {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Permbledhje
  const summaryData = [
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
  const ws1 = XLSX.utils.aoa_to_sheet([['Fusha', 'Vlera'], ...summaryData])
  ws1['!cols'] = [{ wch: 30 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Permbledhje')

  // Sheet 2: Rreshtat e fatures
  const itemHeaders = ['Nr.', 'Item No.', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia', 'Njesia', 'Cmimi/njesi', 'Vlera totale', 'Paketime', 'Pesha bruto', 'Pesha neto', 'Volumi', 'Kodi tarifor', 'Dogana %', 'TVSH %', 'Statusi']
  const itemRows = items.map((item, i) => [
    i + 1, item.itemNo, item.descriptionEn, item.descriptionSq,
    item.qty, item.unit, item.unitPrice, item.totalValue,
    item.packages, item.grossWeight, item.netWeight, item.volume,
    item.tariffCode, item.customsRate, item.vatRate, item.status,
  ])
  // Totals row
  const totalRow = [
    'TOTAL', '', '', '',
    items.reduce((s, i) => s + i.qty, 0), '',
    '', items.reduce((s, i) => s + i.totalValue, 0),
    items.reduce((s, i) => s + i.packages, 0),
    items.reduce((s, i) => s + i.grossWeight, 0),
    items.reduce((s, i) => s + i.netWeight, 0),
    items.reduce((s, i) => s + i.volume, 0),
    '', '', '', '',
  ]
  const ws2 = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows, totalRow])
  ws2['!cols'] = itemHeaders.map((_, i) => ({ wch: i < 2 ? 8 : i < 4 ? 35 : 15 }))
  XLSX.utils.book_append_sheet(wb, ws2, 'Rreshtat e fatures')

  // Sheet 3: Pozicionet ASYCUDA
  const posHeaders = ['Pozicioni', 'Kodi tarifor', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia totale', 'Vlera totale', 'Pesha bruto', 'Pesha neto', 'Paketime', 'Dogana %', 'TVSH %', 'Statusi']
  const posRows = positions.map(pos => [
    pos.positionNo, pos.tariffCode, pos.descriptionEn, pos.descriptionSq,
    pos.totalQty, pos.totalValue, pos.grossWeight, pos.netWeight,
    pos.packages, pos.customsRate, pos.vatRate, pos.status,
  ])
  const posTotalRow = [
    'TOTAL', '', '', '',
    positions.reduce((s, p) => s + p.totalQty, 0),
    positions.reduce((s, p) => s + p.totalValue, 0),
    positions.reduce((s, p) => s + p.grossWeight, 0),
    positions.reduce((s, p) => s + p.netWeight, 0),
    positions.reduce((s, p) => s + p.packages, 0),
    '', '', '',
  ]
  const ws3 = XLSX.utils.aoa_to_sheet([posHeaders, ...posRows, posTotalRow])
  ws3['!cols'] = posHeaders.map((_, i) => ({ wch: i < 2 ? 12 : i < 4 ? 35 : 15 }))
  XLSX.utils.book_append_sheet(wb, ws3, 'Pozicionet ASYCUDA')

  // Sheet 4: Mapping XML
  const mapHeaders = ['Fusha XML', 'Pershkrimi', 'Vlera aktuale']
  const mapData = [
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
  const ws4 = XLSX.utils.aoa_to_sheet([mapHeaders, ...mapData])
  ws4['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, ws4, 'Mapping XML')

  // Sheet 5: Kontrolli
  const ctrlData = [
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
  const ws5 = XLSX.utils.aoa_to_sheet(ctrlData)
  ws5['!cols'] = [{ wch: 40 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws5, 'Kontrolli')

  // Sheet 6: Te dhenat qe mungojne
  const missingHeaders = ['Fusha', 'Artikulli', 'Problemi', 'Cfare duhet plotesuar', 'Statusi']
  const missingRows = missingFields.map(m => [m.field, m.item || '', m.problem, m.whatToFill, m.status])
  const ws6 = XLSX.utils.aoa_to_sheet([missingHeaders, ...missingRows])
  ws6['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 40 }, { wch: 35 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws6, 'Te dhenat qe mungojne')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
