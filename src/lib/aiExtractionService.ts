import type { ExtractionResult, InvoiceItem, HeaderData } from '@/types'
import { findTariffByKeyword, getTariffRules } from './tariffMapper'

/* ── Albanian translation dictionary ────────────────────────── */
const ALB: Record<string, string> = {
  'CAR AROMATHERAPY PAPER TABLET': 'TABLETA AROMATIKE PREJ LETRE PER AUTOMJETE',
  'CERAMIC BOWL': 'TAS QERAMIKE',
  'CERAMIC PLATE': 'PJATE QERAMIKE',
  'CERAMIC STOCKPOT': 'TENXHERE QERAMIKE',
  'CERAMIC TABLEWARE': 'ENE TRYEZE QERAMIKE',
  'GLASS TABLEWARE': 'ENE TRYEZE QELQI',
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
  'SCOOTER': 'TROTINET',
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
  'VACUUM CLEANER': 'FSHESE ELEKTRIKE',
  'ELECTRIC MIXER': 'MIKSER ELEKTRIK',
  'HAIR STRAIGHTENER': 'DREJTUES FLOKESH',
  'SHAMPOO': 'SHAMPO',
}

export function translateToAlbanian(descriptionEn: string): string {
  const upper = descriptionEn.toUpperCase()
  // Sort by length desc so longer/more specific keywords match first
  const sorted = Object.keys(ALB).sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (upper.includes(key)) return ALB[key]
  }
  return upper
}

/* ── Shared extraction prompt ────────────────────────────────── */
const EXTRACTION_PROMPT = `You are an expert customs document data extractor. Extract ALL data from this commercial invoice or packing list.

FIELD MAPPING (extract these exact fields):
- exporterName: Seller / Manufacturer / Shipper company name
- exporterAddress: Full address of the seller
- importerName: Buyer / Consignee company name
- importerAddress: Full address of the buyer
- importerNui: NUI, NIPT, VAT number, or Tax ID of the importer
- invoiceNumber: Invoice number / reference number (e.g. "PFL2601")
- invoiceDate: Invoice date in original format (e.g. "06.02.2026")
- containerNumber: Container number (e.g. "CAIU7808456")
- incoterm: Delivery terms (e.g. "FOB NINGBO", "CIF DURRES")
- portOfLoading: Port of loading / departure port (e.g. "NINGBO")
- portOfDischarge: Port of discharge / arrival port (e.g. "DURRES")
- placeOfDelivery: Place of delivery (e.g. "KOSOVA")
- countryOfOrigin: Country where goods are produced (e.g. "CN" or "CHINA")
- countryOfExport: Country goods are exported from (e.g. "CN")
- countryOfDestination: Destination country (e.g. "XK" or "KOSOVO")
- currency: Currency code (e.g. "EUR", "USD")
- totalInvoice: Total invoice amount as a number (e.g. 68869.16)
- totalGrossWeight: Total gross weight in kg as a number (e.g. 11200)
- totalPackages: Total number of packages/cartons as a number (e.g. 562)
- totalVolume: Total volume in cubic meters as a number (e.g. 68.00)
- transportMode: Mode of transport (e.g. "SEA", "ROAD", "AIR")
- transportIdentity: Vehicle/vessel ID if present
- cmrNumber: CMR number if present
- vehiclePlate: Vehicle plate if present

For items, extract EVERY single line item from the table:
- itemNo: Item mark / article number (e.g. "F2-1--5")
- descriptionEn: Full product description in English
- qty: Quantity as a number
- unit: Unit of measurement (PCS, SET, CTN, KG, M, etc.)
- unitPrice: Unit price as a number
- totalValue: Total value as a number
- packages: Number of cartons/packages as a number
- grossWeight: Gross weight in kg as a number
- netWeight: Net weight in kg as a number (0 if not present)
- volume: Volume in cubic meters as a number (0 if not present)

Return ONLY valid JSON in this exact format — no extra text, no markdown:
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
    {
      "itemNo": "", "descriptionEn": "", "qty": 0, "unit": "", "unitPrice": 0,
      "totalValue": 0, "packages": 0, "grossWeight": 0, "netWeight": 0, "volume": 0
    }
  ]
}

IMPORTANT: Extract ALL line items. Do not skip any rows. Use 0 for missing numbers, "" for missing strings.`

/* ── Build InvoiceItem array from AI response ────────────────── */
function buildItems(parsed: { header?: Partial<HeaderData>; items?: Partial<InvoiceItem>[] }): InvoiceItem[] {
  const rules = getTariffRules()
  return (parsed.items || []).map((item, idx) => {
    const tariffRule = findTariffByKeyword(item.descriptionEn || '', rules)
    return {
      id: `item_${idx + 1}`,
      itemNo:        item.itemNo        || String(idx + 1),
      descriptionEn: item.descriptionEn || '',
      descriptionSq: translateToAlbanian(item.descriptionEn || ''),
      qty:           Number(item.qty)         || 0,
      unit:          item.unit               || 'PCS',
      unitPrice:     Number(item.unitPrice)   || 0,
      totalValue:    Number(item.totalValue)  || 0,
      packages:      Number(item.packages)    || 0,
      grossWeight:   Number(item.grossWeight) || 0,
      netWeight:     Number(item.netWeight)   || 0,
      volume:        Number(item.volume)      || 0,
      tariffCode:    tariffRule?.tariffCode   || '',
      customsRate:   tariffRule?.customsRate  ?? 10,
      vatRate:       tariffRule?.vatRate      ?? 18,
      status:        tariffRule ? 'ok' : 'review',
    }
  })
}

/* ── Call OpenAI Chat Completions ────────────────────────────── */
// Returns raw text + truncation flag — callers decide how to handle
async function callOpenAIRaw(
  apiKey: string,
  model: string,
  content: unknown[],
  maxTokens?: number   // undefined = model decides (no artificial cap)
): Promise<{ raw: string; truncated: boolean }> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content }],
  }
  if (maxTokens) body.max_completion_tokens = maxTokens

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('[AI] callOpenAI error:', errText)
    throw new Error(`OpenAI API error: ${errText}`)
  }
  const data      = await res.json()
  const raw       = data.choices?.[0]?.message?.content || ''
  const truncated = data.choices?.[0]?.finish_reason === 'length'

  if (truncated) console.warn(`[AI] Response truncated (finish_reason=length). Model: ${model}`)
  return { raw, truncated }
}

function parseJSON(raw: string): { header: Partial<HeaderData>; items: Partial<InvoiceItem>[] } {
  if (!raw) throw new Error('OpenAI returned empty response')
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`AI did not return valid JSON. Response: ${raw.slice(0, 300)}`)
  try {
    return JSON.parse(match[0])
  } catch (e) {
    throw new Error(`JSON parse failed: ${e}. Raw: ${raw.slice(0, 300)}`)
  }
}

/* ── Upload PDF to OpenAI Files API ──────────────────────────── */
async function uploadPdfFile(apiKey: string, b64: string, filename: string): Promise<string> {
  const buffer = Buffer.from(b64, 'base64')
  const blob   = new Blob([buffer], { type: 'application/pdf' })

  const fd = new FormData()
  fd.append('file', blob, filename)
  fd.append('purpose', 'user_data')

  const res = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error('[AI] File upload error:', errText)
    throw new Error(`PDF upload failed: ${errText}`)
  }
  const data = await res.json()
  console.log(`[AI] Uploaded PDF "${filename}" → file_id: ${data.id}`)
  return data.id as string
}

async function deletePdfFile(apiKey: string, fileId: string): Promise<void> {
  await fetch(`https://api.openai.com/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  }).catch(e => console.warn(`[AI] Could not delete file ${fileId}:`, e))
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT FUNCTIONS
   ════════════════════════════════════════════════════════════════ */

/**
 * Extract from PDF files using OpenAI Files API.
 *
 * Strategy: two parallel calls (header + items) to avoid JSON truncation
 * on large invoices. No hardcoded token limit — model decides its own max.
 * If the items call is still truncated, auto-chunks into batches of 50.
 */
export async function extractWithPdf(
  pdfBase64s: string[],
  imageBase64s: string[] = [],
  imageMimeTypes: string[] = []
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const fileIds: string[] = []
  try {
    for (let i = 0; i < pdfBase64s.length; i++) {
      const fileId = await uploadPdfFile(apiKey, pdfBase64s[i], `invoice_${i + 1}.pdf`)
      fileIds.push(fileId)
    }

    // Shared file/image attachments for both calls
    const attachments: unknown[] = [
      ...fileIds.map(fileId => ({ type: 'file', file: { file_id: fileId } })),
      ...imageBase64s.map((b64, i) => ({
        type: 'image_url',
        image_url: { url: `data:${imageMimeTypes[i] || 'image/jpeg'};base64,${b64}`, detail: 'high' },
      })),
    ]

    // ── Call 1: header only (fast, never truncated) ──────────
    const headerPrompt = `${EXTRACTION_PROMPT}

IMPORTANT: Return ONLY the "header" object — no "items" array needed.
Return JSON: { "header": { ... } }`

    const { raw: headerRaw } = await callOpenAIRaw(apiKey, 'gpt-4o-mini', [
      { type: 'text', text: headerPrompt },
      ...attachments,
    ])
    const headerParsed = parseJSON(headerRaw)

    // ── Call 2: items only (may be large for big invoices) ───
    const itemsPrompt = `Extract ONLY the line items from this invoice. Return a JSON array.
Return ONLY: { "items": [ { "itemNo":"", "descriptionEn":"", "qty":0, "unit":"", "unitPrice":0, "totalValue":0, "packages":0, "grossWeight":0, "netWeight":0, "volume":0 }, ... ] }
Extract ALL items — do not skip any. Use 0 for missing numbers.`

    const { raw: itemsRaw, truncated } = await callOpenAIRaw(apiKey, 'gpt-4o-mini', [
      { type: 'text', text: itemsPrompt },
      ...attachments,
    ])

    let itemsParsed: { items: Partial<InvoiceItem>[] } = { items: [] }
    if (!truncated) {
      itemsParsed = parseJSON(itemsRaw) as { items: Partial<InvoiceItem>[] }
    } else {
      // Truncated: extract in batches by item range
      console.warn('[AI] Items truncated, chunking by range...')
      itemsParsed = await extractItemsChunked(apiKey, attachments)
    }

    return {
      header: headerParsed.header || {},
      items:  buildItems({ header: headerParsed.header, items: itemsParsed.items || [] }),
      missingFields: [],
    }
  } finally {
    if (fileIds.length > 0) {
      await Promise.allSettled(fileIds.map(id => deletePdfFile(apiKey, id)))
    }
  }
}

/** Chunked item extraction for very large invoices (200+ items). */
async function extractItemsChunked(
  apiKey: string,
  attachments: unknown[]
): Promise<{ items: Partial<InvoiceItem>[] }> {
  const BATCH = 50
  let offset = 0
  const allItems: Partial<InvoiceItem>[] = []

  while (true) {
    const prompt = `Extract line items ${offset + 1} to ${offset + BATCH} from this invoice.
If there are fewer remaining items, return all remaining ones.
Return ONLY: { "items": [...], "hasMore": true/false }
Use 0 for missing numbers.`

    const { raw, truncated } = await callOpenAIRaw(apiKey, 'gpt-4o-mini', [
      { type: 'text', text: prompt },
      ...attachments,
    ])

    if (truncated) {
      console.warn(`[AI] Chunk offset=${offset} truncated, stopping`)
      break
    }

    let parsed: { items?: Partial<InvoiceItem>[]; hasMore?: boolean }
    try { parsed = parseJSON(raw) as typeof parsed } catch { break }

    const chunk = parsed.items || []
    if (chunk.length === 0) break
    allItems.push(...chunk)

    if (!parsed.hasMore || chunk.length < BATCH) break
    offset += BATCH
  }

  console.log(`[AI] Chunked extraction complete: ${allItems.length} items`)
  return { items: allItems }
}

/**
 * Extract from images (JPG/PNG/WEBP) using OpenAI Vision.
 */
export async function extractWithAI(
  base64Images: string[],
  mimeType: string
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const content: unknown[] = [
    { type: 'text', text: EXTRACTION_PROMPT },
    ...base64Images.map(img => ({
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${img}`, detail: 'high' },
    })),
  ]

  // Same 2-call strategy for images: header + items separately
  const headerContent: unknown[] = [
    { type: 'text', text: `${EXTRACTION_PROMPT}\nIMPORTANT: Return ONLY { "header": { ... } }` },
    ...base64Images.map(img => ({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${img}`, detail: 'high' } })),
  ]
  const itemsContent: unknown[] = [
    { type: 'text', text: 'Extract ONLY the line items. Return ONLY: { "items": [...] }. Use 0 for missing numbers.' },
    ...base64Images.map(img => ({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${img}`, detail: 'high' } })),
  ]
  const [{ raw: hRaw }, { raw: iRaw }] = await Promise.all([
    callOpenAIRaw(apiKey, 'gpt-4o-mini', headerContent),
    callOpenAIRaw(apiKey, 'gpt-4o-mini', itemsContent),
  ])
  const headerP = parseJSON(hRaw)
  const itemsP  = parseJSON(iRaw)
  return { header: headerP.header || {}, items: buildItems({ header: headerP.header, items: itemsP.items || [] }), missingFields: [] }
}

/**
 * Extract from plain text (used as fallback or for already-extracted text).
 */
export async function extractWithText(text: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // No token limit — gpt-5-mini decides its own max (up to 128k output)
  const hPrompt = `${EXTRACTION_PROMPT}\nIMPORTANT: Return ONLY { "header": { ... } }\n\nText:\n---\n${text.slice(0, 14000)}\n---`
  const iPrompt = `Extract ONLY the line items from this invoice text. Return ONLY: { "items": [...] }\n\nText:\n---\n${text.slice(0, 14000)}\n---`

  const [{ raw: hRaw }, { raw: iRaw }] = await Promise.all([
    callOpenAIRaw(apiKey, 'gpt-5-mini', [{ type: 'text', text: hPrompt }]),
    callOpenAIRaw(apiKey, 'gpt-5-mini', [{ type: 'text', text: iPrompt }]),
  ])
  const headerP = parseJSON(hRaw)
  const itemsP  = parseJSON(iRaw)
  return { header: headerP.header || {}, items: buildItems({ header: headerP.header, items: itemsP.items || [] }), missingFields: [] }
}

/**
 * Extract fields from a voice transcript.
 */
export async function extractWithVoice(transcript: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const prompt = `Extract customs declaration data from this voice/text input. Return ONLY valid JSON.

Input: "${transcript}"

Return JSON with this exact structure:
{"header": {"importerName":"","exporterName":"","invoiceNumber":"","containerNumber":"","countryOfOrigin":"","incoterm":"","portOfLoading":"","portOfDischarge":"","totalInvoice":0,"currency":"","totalGrossWeight":0,"totalPackages":0}, "items":[]}`

  const { raw } = await callOpenAIRaw(apiKey, 'gpt-5-mini', [{ type: 'text', text: prompt }], 2048)
  const parsed  = parseJSON(raw)
  return { header: parsed.header || {}, items: [], missingFields: [] }
}
