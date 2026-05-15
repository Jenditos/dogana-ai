import type { HeaderData, AsycudaPosition, InvoiceItem, ValidationResult, MissingField } from '@/types'

const TOLERANCE = 0.05

export function validateAll(
  header: HeaderData,
  items: InvoiceItem[],
  positions: AsycudaPosition[]
): ValidationResult {
  const errors: ValidationResult['errors'] = []
  const warnings: ValidationResult['warnings'] = []

  // Mandatory header fields
  const mandatory: { key: keyof HeaderData; sq: string; en: string }[] = [
    { key: 'exporterName', sq: 'Eksportuesi mungon', en: 'Exporter is missing' },
    { key: 'importerName', sq: 'Importuesi mungon', en: 'Importer is missing' },
    { key: 'invoiceNumber', sq: 'Numri i faturës mungon', en: 'Invoice number is missing' },
    { key: 'invoiceDate', sq: 'Data e faturës mungon', en: 'Invoice date is missing' },
    { key: 'countryOfOrigin', sq: 'Vendi i origjinës mungon', en: 'Country of origin is missing' },
    { key: 'countryOfExport', sq: 'Vendi i eksportit mungon', en: 'Country of export is missing' },
    { key: 'currency', sq: 'Monedha mungon', en: 'Currency is missing' },
  ]

  for (const m of mandatory) {
    if (!header[m.key]) {
      errors.push({ field: m.key, message: m.sq, messageEn: m.en })
    }
  }

  // Sum validation
  if (header.totalInvoice && positions.length > 0) {
    const sumPositions = positions.reduce((s, p) => s + p.totalValue, 0)
    if (Math.abs(sumPositions - header.totalInvoice) > TOLERANCE) {
      warnings.push({
        field: 'totalInvoice',
        message: `Shuma e pozicioneve (${sumPositions.toFixed(2)}) nuk përputhet me totalin (${header.totalInvoice.toFixed(2)})`,
        messageEn: `Sum of positions (${sumPositions.toFixed(2)}) does not match invoice total (${header.totalInvoice.toFixed(2)})`,
      })
    }
  }

  if (header.totalGrossWeight && positions.length > 0) {
    const sumWeight = positions.reduce((s, p) => s + p.grossWeight, 0)
    if (Math.abs(sumWeight - header.totalGrossWeight) > 0.5) {
      warnings.push({
        field: 'totalGrossWeight',
        message: `Shuma e pesave (${sumWeight.toFixed(2)}) nuk përputhet me totalin (${header.totalGrossWeight.toFixed(2)})`,
        messageEn: `Sum of weights (${sumWeight.toFixed(2)}) does not match total (${header.totalGrossWeight.toFixed(2)})`,
      })
    }
  }

  // Tariff codes
  for (const pos of positions) {
    if (!pos.tariffCode || pos.tariffCode === '') {
      errors.push({
        field: `tariffCode_${pos.positionNo}`,
        message: `Pozicioni ${pos.positionNo}: kodi tarifor mungon`,
        messageEn: `Position ${pos.positionNo}: tariff code is missing`,
      })
    }
    if (pos.status === 'review') {
      warnings.push({
        field: `status_${pos.positionNo}`,
        message: `Pozicioni ${pos.positionNo}: kodi tarifor nuk është i sigurt`,
        messageEn: `Position ${pos.positionNo}: tariff code is uncertain`,
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function getMissingFields(
  header: HeaderData,
  items: InvoiceItem[]
): MissingField[] {
  const missing: MissingField[] = []

  const headerChecks: { key: keyof HeaderData; sq: string; en: string; problem: string }[] = [
    { key: 'exporterName', sq: 'Eksportuesi', en: 'Exporter', problem: 'Emri i eksportuesit mungon' },
    { key: 'importerName', sq: 'Importuesi', en: 'Importer', problem: 'Emri i importuesit mungon' },
    { key: 'importerNui', sq: 'NUI/NIPT', en: 'NUI/VAT', problem: 'NUI i importuesit mungon' },
    { key: 'invoiceNumber', sq: 'Numri faturës', en: 'Invoice number', problem: 'Numri i faturës mungon' },
    { key: 'invoiceDate', sq: 'Data faturës', en: 'Invoice date', problem: 'Data e faturës mungon' },
    { key: 'containerNumber', sq: 'Kontejneri', en: 'Container', problem: 'Numri i kontejnerit mungon' },
    { key: 'incoterm', sq: 'Incoterm', en: 'Incoterm', problem: 'Kushti i dorëzimit mungon' },
    { key: 'portOfLoading', sq: 'Porti i ngarkimit', en: 'Port of loading', problem: 'Porti i ngarkimit mungon' },
    { key: 'countryOfOrigin', sq: 'Vendi origjinës', en: 'Country of origin', problem: 'Vendi i origjinës mungon' },
    { key: 'currency', sq: 'Monedha', en: 'Currency', problem: 'Monedha mungon' },
  ]

  for (const check of headerChecks) {
    if (!header[check.key]) {
      missing.push({
        field: check.sq,
        problem: check.problem,
        whatToFill: check.en,
        status: 'missing',
      })
    }
  }

  for (const item of items) {
    if (!item.tariffCode) {
      missing.push({
        field: 'Kodi tarifor',
        item: item.descriptionEn,
        problem: `Kodi tarifor mungon për "${item.descriptionEn}"`,
        whatToFill: 'Shto kodin tarifor HS',
        status: 'missing',
      })
    }
    if (!item.grossWeight || item.grossWeight === 0) {
      missing.push({
        field: 'Pesha bruto',
        item: item.descriptionEn,
        problem: `Pesha bruto mungon për "${item.descriptionEn}"`,
        whatToFill: 'Shto pesën bruto (kg)',
        status: 'missing',
      })
    }
    if (!item.qty || item.qty === 0) {
      missing.push({
        field: 'Sasia',
        item: item.descriptionEn,
        problem: `Sasia mungon për "${item.descriptionEn}"`,
        whatToFill: 'Shto sasinë',
        status: 'missing',
      })
    }
  }

  return missing
}
