import type { ExtractionResult, InvoiceItem, HeaderData } from '@/types'
import { findTariffByKeyword, getTariffRules } from './tariffMapper'

const ALBANIAN_TRANSLATIONS: Record<string, string> = {
  'CAR AROMATHERAPY PAPER TABLET': 'TABLETA AROMATIKE PREJ LETRE PER AUTOMJETE',
  'CERAMIC BOWL': 'TAS QERAMIKE',
  'CERAMIC PLATE': 'PJATE QERAMIKE',
  'CERAMIC STOCKPOT': 'TENXHERE QERAMIKE',
  'CERAMIC TABLEWARE SET': 'SET ENESH TRYEZE QERAMIKE',
  'GLASS TABLEWARE SET': 'SET ENESH TRYEZE QELQI',
  'GLASS CUP': 'GOTE QELQI',
  'CHARGER': 'MBUSHES ELEKTRIK',
  'USB CABLE': 'KABLLO USB',
  'BLUETOOTH HEADSET': 'KUFJE BLUETOOTH',
  'BACKPACK': 'CANTE SHPINE',
  'LUGGAGE': 'VALIXHE',
  'UMBRELLA': 'OMBRELLA',
  'OUTDOOR UMBRELLA': 'OMBRELLA PER JASHTE',
  'FOLDING CHAIR': 'KARRIGE E PALOSSHME',
  'BABY STROLLER': 'KARROCA FEMIJESH',
  'MODEL METAL CAR': 'MAKINE LODRA METALIKE',
  'BALL TOY': 'TOP LODRA',
  'SCOOTER': 'BIÇIKLETE FEMIJESH',
  'PUMP': 'POMPE',
  'HAIR DRYER': 'THARSE FLOKESH',
  'DRY IRON': 'HEKUR I THATE',
  'EARPHONE': 'KUFJE',
  'USB MOUSE': 'MAUS PA TEL',
  'KEYBOARD': 'TASTIERE',
  'NOTEBOOK': 'BLLOK SHENIMESH',
  'PLUG': 'BASHKUES ELEKTRIK',
  'PILLOWCASE': 'JASTKECE',
  'QUILT': 'JORGAN',
  'PAPER NAPKIN': 'PECETE LETRE',
  'TOILET PAPER': 'LETER TUALETI',
  'PAPER TOWEL': 'PESHQIR LETRE',
}

export function translateToAlbanian(descriptionEn: string): string {
  const upper = descriptionEn.toUpperCase()

  for (const [key, val] of Object.entries(ALBANIAN_TRANSLATIONS)) {
    if (upper.includes(key)) return val
  }

  // Attempt word-by-word
  return descriptionEn.toUpperCase()
}

export async function extractWithAI(
  base64Images: string[],
  mimeType: string
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = `You are a customs document data extractor. Extract ALL data from this invoice/packing list document.

Return ONLY valid JSON in this exact format:
{
  "header": {
    "exporterName": "",
    "exporterAddress": "",
    "importerName": "",
    "importerAddress": "",
    "importerNui": "",
    "invoiceNumber": "",
    "invoiceDate": "",
    "containerNumber": "",
    "incoterm": "",
    "portOfLoading": "",
    "portOfDischarge": "",
    "placeOfDelivery": "",
    "countryOfExport": "",
    "countryOfOrigin": "",
    "countryOfDestination": "",
    "currency": "",
    "totalInvoice": 0,
    "totalGrossWeight": 0,
    "totalPackages": 0,
    "totalVolume": 0,
    "transportMode": "",
    "transportIdentity": "",
    "cmrNumber": "",
    "vehiclePlate": ""
  },
  "items": [
    {
      "itemNo": "",
      "descriptionEn": "",
      "qty": 0,
      "unit": "",
      "unitPrice": 0,
      "totalValue": 0,
      "packages": 0,
      "grossWeight": 0,
      "netWeight": 0,
      "volume": 0
    }
  ]
}

Rules:
- Extract ALL line items from the invoice
- Use original English descriptions
- If a field is not found, use empty string or 0
- Return ONLY the JSON, no explanation`

  const messages: { role: string; content: unknown[] }[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...base64Images.map(img => ({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${img}`, detail: 'high' },
        })),
      ],
    },
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'

  let parsed: { header: Partial<HeaderData>; items: Partial<InvoiceItem>[] }
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }

  const rules = getTariffRules()
  const items: InvoiceItem[] = (parsed.items || []).map((item, idx) => {
    const tariffRule = findTariffByKeyword(item.descriptionEn || '', rules)
    return {
      id: `item_${idx + 1}`,
      itemNo: item.itemNo || String(idx + 1),
      descriptionEn: item.descriptionEn || '',
      descriptionSq: translateToAlbanian(item.descriptionEn || ''),
      qty: Number(item.qty) || 0,
      unit: item.unit || 'PCS',
      unitPrice: Number(item.unitPrice) || 0,
      totalValue: Number(item.totalValue) || 0,
      packages: Number(item.packages) || 0,
      grossWeight: Number(item.grossWeight) || 0,
      netWeight: Number(item.netWeight) || 0,
      volume: Number(item.volume) || 0,
      tariffCode: tariffRule?.tariffCode || '',
      customsRate: tariffRule?.customsRate || 10,
      vatRate: tariffRule?.vatRate || 18,
      status: tariffRule ? 'ok' : 'review',
    }
  })

  return {
    header: parsed.header || {},
    items,
    missingFields: [],
  }
}

/* ── Text-based extraction (for PDFs with extractable text) ── */
export async function extractWithText(text: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // Trim text to avoid token limit (keep first 12000 chars — enough for a full invoice)
  const trimmed = text.slice(0, 12000)

  const prompt = `You are a customs document data extractor. Extract ALL data from this invoice/packing list text.

Return ONLY valid JSON in this exact format:
{
  "header": {
    "exporterName": "", "exporterAddress": "", "importerName": "", "importerAddress": "",
    "importerNui": "", "invoiceNumber": "", "invoiceDate": "", "containerNumber": "",
    "incoterm": "", "portOfLoading": "", "portOfDischarge": "", "placeOfDelivery": "",
    "countryOfExport": "", "countryOfOrigin": "", "countryOfDestination": "",
    "currency": "", "totalInvoice": 0, "totalGrossWeight": 0, "totalPackages": 0,
    "totalVolume": 0, "transportMode": "", "transportIdentity": "", "cmrNumber": "", "vehiclePlate": ""
  },
  "items": [
    { "itemNo": "", "descriptionEn": "", "qty": 0, "unit": "", "unitPrice": 0,
      "totalValue": 0, "packages": 0, "grossWeight": 0, "netWeight": 0, "volume": 0 }
  ]
}

Rules:
- Extract ALL line items
- Use English descriptions
- Empty string or 0 for missing fields
- Return ONLY the JSON

Document text:
${trimmed}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data    = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'

  let parsed: { header: Partial<HeaderData>; items: Partial<InvoiceItem>[] }
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }

  const rules = getTariffRules()
  const items: InvoiceItem[] = (parsed.items || []).map((item, idx) => {
    const tariffRule = findTariffByKeyword(item.descriptionEn || '', rules)
    return {
      id: `item_${idx + 1}`,
      itemNo: item.itemNo || String(idx + 1),
      descriptionEn: item.descriptionEn || '',
      descriptionSq: translateToAlbanian(item.descriptionEn || ''),
      qty: Number(item.qty) || 0,
      unit: item.unit || 'PCS',
      unitPrice: Number(item.unitPrice) || 0,
      totalValue: Number(item.totalValue) || 0,
      packages: Number(item.packages) || 0,
      grossWeight: Number(item.grossWeight) || 0,
      netWeight: Number(item.netWeight) || 0,
      volume: Number(item.volume) || 0,
      tariffCode: tariffRule?.tariffCode || '',
      customsRate: tariffRule?.customsRate || 10,
      vatRate: tariffRule?.vatRate || 18,
      status: tariffRule ? 'ok' : 'review',
    }
  })

  return { header: parsed.header || {}, items, missingFields: [] }
}

export async function extractWithVoice(transcript: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const prompt = `Extract customs declaration data from this voice/text input. Return ONLY valid JSON.

Text: "${transcript}"

Return JSON with fields: importerName, exporterName, invoiceNumber, containerNumber, countryOfOrigin, incoterm, portOfLoading, totalInvoice, currency

Format: {"header": {...}, "items": []}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  })

  if (!response.ok) throw new Error('Voice extraction failed')

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  let parsed: { header: Partial<HeaderData>; items: Partial<InvoiceItem>[] } = { header: {}, items: [] }
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {}

  return { header: parsed.header || {}, items: [], missingFields: [] }
}
