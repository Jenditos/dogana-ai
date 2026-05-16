interface ValidationOutcome {
  ok: boolean
  errors: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function finiteNonNegative(value: unknown, max = 1_000_000_000): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
}

function validRate(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}

function validString(value: unknown, max = 500): boolean {
  return typeof value === 'string' && value.length <= max
}

function validTariffCode(value: unknown): boolean {
  return value === '' || (typeof value === 'string' && /^\d{10}$/.test(value))
}

export function validateXmlPayload(payload: unknown): ValidationOutcome {
  const errors: string[] = []

  if (!isObject(payload)) {
    return { ok: false, errors: ['Payload must be an object.'] }
  }

  const header = payload.header
  const items = payload.items
  const positions = payload.positions

  if (!isObject(header)) errors.push('Header must be an object.')
  if (!Array.isArray(items)) errors.push('Items must be an array.')
  if (!Array.isArray(positions)) errors.push('Positions must be an array.')

  if (errors.length > 0) return { ok: false, errors }

  const itemRows = items as unknown[]
  const positionRows = positions as unknown[]
  const headerFields = header as Record<string, unknown>

  if (itemRows.length > 300) errors.push('Too many invoice rows. Maximum is 300.')
  if (positionRows.length > 120) errors.push('Too many ASYCUDA positions. Maximum is 120.')

  for (const key of ['exporterName', 'importerName', 'invoiceNumber', 'invoiceDate', 'currency']) {
    if (headerFields[key] !== undefined && !validString(headerFields[key], 300)) errors.push(`Invalid header field: ${key}.`)
  }
  for (const key of ['totalInvoice', 'totalGrossWeight', 'totalPackages', 'totalVolume']) {
    if (headerFields[key] !== undefined && !finiteNonNegative(headerFields[key])) errors.push(`Invalid header number: ${key}.`)
  }

  itemRows.forEach((item, index) => {
    if (!isObject(item)) {
      errors.push(`Item ${index + 1} must be an object.`)
      return
    }
    if (!validString(item.descriptionEn, 500)) errors.push(`Item ${index + 1}: invalid description.`)
    if (!validTariffCode(item.tariffCode)) errors.push(`Item ${index + 1}: tariff code must be 10 digits.`)
    for (const key of ['qty', 'unitPrice', 'totalValue', 'packages', 'grossWeight', 'netWeight', 'volume']) {
      if (!finiteNonNegative(item[key])) errors.push(`Item ${index + 1}: invalid ${key}.`)
    }
    if (!validRate(item.customsRate) || !validRate(item.vatRate)) {
      errors.push(`Item ${index + 1}: invalid tax rate.`)
    }
  })

  positionRows.forEach((pos, index) => {
    if (!isObject(pos)) {
      errors.push(`Position ${index + 1} must be an object.`)
      return
    }
    if (!validTariffCode(pos.tariffCode)) errors.push(`Position ${index + 1}: tariff code must be 10 digits.`)
    for (const key of ['totalQty', 'totalValue', 'packages', 'grossWeight', 'netWeight']) {
      if (!finiteNonNegative(pos[key])) errors.push(`Position ${index + 1}: invalid ${key}.`)
    }
    if (!validRate(pos.customsRate) || !validRate(pos.vatRate)) {
      errors.push(`Position ${index + 1}: invalid tax rate.`)
    }
  })

  return { ok: errors.length === 0, errors }
}
