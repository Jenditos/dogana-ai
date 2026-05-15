import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField } from '@/types'

function escCsv(val: unknown): string {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(...cols: unknown[]): string {
  return cols.map(escCsv).join(',') + '\r\n'
}

export function generateCsv(
  header: HeaderData,
  items: InvoiceItem[],
  positions: AsycudaPosition[],
  missingFields: MissingField[]
): string {
  let csv = '﻿' // UTF-8 BOM

  // Sheet: Summary
  csv += 'PERMBLEDHJE\r\n'
  csv += row('Eksportuesi', header.exporterName)
  csv += row('Importuesi', header.importerName)
  csv += row('NUI', header.importerNui)
  csv += row('Fatura', header.invoiceNumber)
  csv += row('Data', header.invoiceDate)
  csv += row('Kontejneri', header.containerNumber)
  csv += row('Incoterm', header.incoterm)
  csv += row('Porti ngarkimit', header.portOfLoading)
  csv += row('Porti shkarkimit', header.portOfDischarge)
  csv += row('Origjina', header.countryOfOrigin)
  csv += row('Eksporti', header.countryOfExport)
  csv += row('Destinacioni', header.countryOfDestination)
  csv += row('Monedha', header.currency)
  csv += row('Vlera totale', header.totalInvoice)
  csv += row('Pesha bruto', header.totalGrossWeight)
  csv += row('Paketime', header.totalPackages)
  csv += row('Volumi', header.totalVolume)
  csv += '\r\n'

  // Sheet: Invoice rows
  csv += 'RRESHTAT E FATURES\r\n'
  csv += row('Nr.', 'Item No.', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia', 'Njesia', 'Cmimi/njesi', 'Vlera totale', 'Paketime', 'Pesha bruto', 'Pesha neto', 'Volumi', 'Kodi tarifor', 'Dogana %', 'TVSH %', 'Statusi')
  items.forEach((item, i) => {
    csv += row(i + 1, item.itemNo, item.descriptionEn, item.descriptionSq, item.qty, item.unit, item.unitPrice, item.totalValue, item.packages, item.grossWeight, item.netWeight, item.volume, item.tariffCode, item.customsRate, item.vatRate, item.status)
  })
  csv += '\r\n'

  // Sheet: ASYCUDA positions
  csv += 'POZICIONET ASYCUDA\r\n'
  csv += row('Pozicioni', 'Kodi tarifor', 'Pershkrimi anglisht', 'Pershkrimi shqip', 'Sasia totale', 'Vlera totale', 'Pesha bruto', 'Pesha neto', 'Paketime', 'Dogana %', 'TVSH %', 'Statusi')
  positions.forEach(pos => {
    csv += row(pos.positionNo, pos.tariffCode, pos.descriptionEn, pos.descriptionSq, pos.totalQty, pos.totalValue, pos.grossWeight, pos.netWeight, pos.packages, pos.customsRate, pos.vatRate, pos.status)
  })
  csv += '\r\n'

  // Sheet: Missing data
  csv += 'TE DHENAT QE MUNGOJNE\r\n'
  csv += row('Fusha', 'Artikulli', 'Problemi', 'Cfare duhet plotesuar', 'Statusi')
  missingFields.forEach(m => {
    csv += row(m.field, m.item || '', m.problem, m.whatToFill, m.status)
  })

  return csv
}
