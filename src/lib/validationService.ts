import type { HeaderData, AsycudaPosition, InvoiceItem, ValidationResult, MissingField } from '@/types'

const TOLERANCE = 0.05

/* ── Sum validation result ───────────────────────────────────── */
export interface SumCheck {
  label:    string      // field name
  expected: number      // value from header / packing list
  actual:   number      // calculated from rows
  diff:     number      // actual - expected
  ok:       boolean     // |diff| <= tolerance
  blocking: boolean     // must match exactly for XML export
}

export interface SumValidationResult {
  checks:  SumCheck[]
  allOk:   boolean
  hasBlocker: boolean   // any blocking check failed
}

/**
 * Validates that row-level sums match the declared header totals.
 * Called before XML export; blocking failures prevent export.
 */
export function validateSums(
  header: Partial<HeaderData>,
  items: InvoiceItem[],
  positions: AsycudaPosition[]
): SumValidationResult {
  const VALUE_TOL   = 0.05   // €0.05 tolerance for rounding
  const WEIGHT_TOL  = 1.0    // 1 kg tolerance
  const PKG_TOL     = 0      // 0 package tolerance (must be exact)

  const sumItemsValue   = items.reduce((s, i) => s + i.totalValue,    0)
  const sumItemsWeight  = items.reduce((s, i) => s + i.grossWeight,   0)
  const sumItemsPkgs    = items.reduce((s, i) => s + i.packages,      0)
  const sumPosValue     = positions.reduce((s, p) => s + p.totalValue,   0)
  const sumPosWeight    = positions.reduce((s, p) => s + p.grossWeight,  0)

  const invoiceTotal   = Number(header.totalInvoice)      || 0
  const headerWeight   = Number(header.totalGrossWeight)  || 0
  const headerPkgs     = Number(header.totalPackages)     || 0

  const checks: SumCheck[] = []

  if (invoiceTotal > 0) {
    const diff = sumItemsValue - invoiceTotal
    checks.push({
      label: 'Vlera e rreshtave vs. totali i faturës',
      expected: invoiceTotal, actual: sumItemsValue, diff,
      ok: Math.abs(diff) <= VALUE_TOL, blocking: true,
    })
    // Also check ASYCUDA grouped sum
    if (positions.length > 0) {
      const diffPos = sumPosValue - invoiceTotal
      checks.push({
        label: 'Vlera ASYCUDA vs. totali i faturës',
        expected: invoiceTotal, actual: sumPosValue, diff: diffPos,
        ok: Math.abs(diffPos) <= VALUE_TOL, blocking: false,
      })
    }
  }

  if (headerWeight > 0) {
    const diff = sumItemsWeight - headerWeight
    checks.push({
      label: 'Pesha e rreshtave vs. packing list total',
      expected: headerWeight, actual: sumItemsWeight, diff,
      ok: Math.abs(diff) <= WEIGHT_TOL, blocking: false,
    })
  }

  if (headerPkgs > 0) {
    const diff = sumItemsPkgs - headerPkgs
    checks.push({
      label: 'Paketime e rreshtave vs. packing list total',
      expected: headerPkgs, actual: sumItemsPkgs, diff,
      ok: Math.abs(diff) <= PKG_TOL, blocking: false,
    })
  }

  const allOk      = checks.every(c => c.ok)
  const hasBlocker = checks.some(c => !c.ok && c.blocking)

  return { checks, allOk, hasBlocker }
}

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

  // Determine if the extraction found ANY weight/package data at all.
  // If at least one item has grossWeight > 0, the packing list was likely found.
  // In that case, items with weight=0 are genuinely missing (not extraction failures).
  // If NO item has weight data, it means the packing list wasn't extracted yet —
  // mark weight issues as 'review' (needs verification) not 'missing' (blocking).
  const packingListFound = items.some(i => i.grossWeight > 0)
  const weightStatus: 'missing' | 'review' = packingListFound ? 'missing' : 'review'

  for (const item of items) {
    // Tariff code: always required → 'missing' if absent
    if (!item.tariffCode) {
      missing.push({
        field: 'Kodi tarifor',
        item: item.descriptionEn,
        problem: `Kodi tarifor mungon për "${item.descriptionEn}"`,
        whatToFill: 'Shto kodin tarifor HS',
        status: 'missing',
      })
    }

    // Quantity: required → 'missing' if zero
    if (!item.qty || item.qty === 0) {
      missing.push({
        field: 'Sasia',
        item: item.descriptionEn,
        problem: `Sasia mungon për "${item.descriptionEn}"`,
        whatToFill: 'Shto sasinë',
        status: 'missing',
      })
    }

    // Gross weight: required for customs, but only flag after packing list analysis.
    // If packing list was found and weight is still 0 → truly missing.
    // If packing list wasn't found (all weights are 0) → mark as review, not missing.
    if (!item.grossWeight || item.grossWeight === 0) {
      missing.push({
        field: 'Pesha bruto',
        item: item.descriptionEn,
        problem: packingListFound
          ? `Pesha bruto mungon për "${item.descriptionEn}"`
          : `Pesha bruto nuk u gjet — kontrollo nëse PDF ka Packing List`,
        whatToFill: packingListFound
          ? 'Shto pesën bruto (kg)'
          : 'Ngarko Packing List ose shto pesën manualisht',
        status: weightStatus,
      })
    }
  }

  // If no weight data was found at all, add a single document-level warning
  // instead of one warning per item (which would flood the missing fields list).
  if (!packingListFound && items.length > 0) {
    // Replace per-item weight warnings with a single document-level warning
    const weightWarnings = missing.filter(m => m.field === 'Pesha bruto')
    // Remove individual weight warnings and replace with one grouped warning
    const withoutWeightWarnings = missing.filter(m => m.field !== 'Pesha bruto')
    withoutWeightWarnings.push({
      field: 'Pesha bruto (të gjitha)',
      problem: `Packing List nuk u gjet — pesët mungojnë për ${weightWarnings.length} artikuj`,
      whatToFill: 'Ngarko Packing List bashkë me faturën ose shto pesët manualisht',
      status: 'review',
    })
    return withoutWeightWarnings
  }

  return missing
}
