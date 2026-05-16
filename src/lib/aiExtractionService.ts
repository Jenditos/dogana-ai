import type { ExtractionResult, InvoiceItem, HeaderData } from '@/types'
import { findTariffByKeyword, getTariffRules, getConfirmedCode } from './tariffMapper'

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

/* ── Shared header-only extraction prompt ────────────────────── */
const HEADER_PROMPT = `You are an expert customs document data extractor.

Extract ONLY the document header fields from this commercial customs document.

FIELD MAPPING:
- exporterName: Seller / Manufacturer / Shipper company name
- exporterAddress: Full address of the seller
- importerName: Buyer / Consignee company name
- importerAddress: Full address of the buyer
- importerNui: NUI, NIPT, VAT number, Tax ID of the importer
- invoiceNumber: Invoice number / reference (e.g. "PFL2601")
- invoiceDate: Invoice date in original format (e.g. "06.02.2026")
- containerNumber: Container number (e.g. "CAIU7808456")
- incoterm: Delivery terms (e.g. "FOB NINGBO", "CIF DURRES")
- portOfLoading: Port of loading (e.g. "NINGBO")
- portOfDischarge: Port of discharge (e.g. "DURRES")
- placeOfDelivery: Final delivery place (e.g. "KOSOVA")
- countryOfOrigin: Country where goods are produced (e.g. "CN")
- countryOfExport: Country goods are exported from (e.g. "CN")
- countryOfDestination: Destination country (e.g. "XK")
- currency: Currency code (e.g. "EUR", "USD")
- totalInvoice: Total invoice amount as number (e.g. 68869.16)
- totalGrossWeight: Total gross weight in kg as number (e.g. 11200)
- totalPackages: Total packages/cartons as number (e.g. 562)
- totalVolume: Total volume in m³ as number (e.g. 68.00)
- transportMode: Mode of transport (e.g. "SEA")
- transportIdentity: Vehicle/vessel ID if present
- cmrNumber: CMR number if present
- vehiclePlate: Vehicle plate if present

Return ONLY: { "header": { ... } }`

/* ── Items extraction prompt — Invoice + Packing List merge ─── */
// This prompt explicitly handles the common case where a PDF contains BOTH:
// - A Commercial Invoice table (prices, values, quantities)
// - A Packing List table (packages/cartons, gross weight, volume)
// The two tables share Item Numbers as the merge key.
const ITEMS_PROMPT = `You are an expert customs document data extractor.

CRITICAL: This document may contain MULTIPLE tables spread across multiple pages:
1. A COMMERCIAL INVOICE table — has: Item No., Description, Quantity, Unit Price, Total Value
2. A PACKING LIST table — has: Item No., Description, QTY, Package/CTN, G.W., MEAS./CBM

These tables SHARE the same Item Numbers (e.g. F2-1--5, F3-1, F3-2,-4).
You MUST look at ALL pages, find BOTH tables, and MERGE their data by Item No.

COLUMN ALIASES (all mean the same):
- Packages/Cartons: PACKAGE, PACKAGES, CTN, CARTON, CARTONS, NO. OF CARTONS, PAKO, PKG, NO.OF CTN
- Gross Weight: G.W, GW, G.W.(KGS), GROSS WEIGHT, BRUTO, WEIGHT, KG
- Volume/Measurement: MEAS., MEAS, MEASUREMENT, CBM, M3, M³, VOLUME, VOLUMI, CB.M
- Quantity: QTY, QUANTITY, SASIA, PCS, SET, PRS, PIECES, UNITS
- Item Number: ITEM NO., ITEM NO, MARK, NO., REF

MERGE PROCEDURE:
Step 1 — Find the Packing List (look on EVERY page — it often starts on page 2 or 3)
Step 2 — Find the Commercial Invoice
Step 3 — For EACH item, combine data from both:
  - itemNo, descriptionEn, qty, unit, unitPrice, totalValue → from Commercial Invoice
  - packages, grossWeight, netWeight, volume → from Packing List (match by Item No.)

EXAMPLE OF CORRECT MERGE:
Invoice:      F2-1--5 | CAR AROMATHERAPY PAPER TABLET | 15600 PCS | €0.11 | €1716.00
Packing List: F2-1--5 | CAR AROMATHERAPY PAPER TABLET | 15600 | 13 CTN | 221 KG | 0.91 CBM
Merged result: { itemNo:"F2-1--5", descriptionEn:"CAR AROMATHERAPY PAPER TABLET", qty:15600, unit:"PCS", unitPrice:0.11, totalValue:1716.00, packages:13, grossWeight:221, netWeight:221, volume:0.91 }

Another example:
Invoice:      F3-2,-4 | CERAMIC PLATE | 216 PCS | €0.86 | €185.76
Packing List: F3-2,-4 | CERAMIC PLATE | 216 | 6 CTN | 125.7 KG | 0.20 CBM
Merged result: { itemNo:"F3-2,-4", descriptionEn:"CERAMIC PLATE", qty:216, unit:"PCS", unitPrice:0.86, totalValue:185.76, packages:6, grossWeight:125.7, netWeight:125.7, volume:0.20 }

STRICT DATA INTEGRITY RULES — read carefully:
1. DO NOT invent or estimate weights/packages. If an item has no matching Packing List row, use packages=0, grossWeight=0, volume=0. Do NOT guess.
2. DO NOT leave packages=0 if the Packing List clearly has data for that item.
3. DO NOT count any item twice in packages or weight.
4. Items with very low value or 1 PCS (like HEATER PEN 1 PCS €33.56) MUST be included — do not skip them.
5. The LAST 2-3 pages often contain: small misc items, HEATER PEN, MACHINE, CLOTHES SAMPLES — read every page to the very end.
6. If a Packing List row covers multiple items (e.g. "F3-1,F3-2"), assign data to each matching item individually.
7. Extract ALL items — no skipping. A common error is missing the last 3-5 items on the last page.
8. COMPLETENESS CHECK: Before returning, count your extracted items and verify sum(totalValue) ≈ invoice total. If items are missing, look again at the last pages.

Return ONLY: { "items": [ { "itemNo":"", "descriptionEn":"", "qty":0, "unit":"", "unitPrice":0, "totalValue":0, "packages":0, "grossWeight":0, "netWeight":0, "volume":0 }, ... ] }

No extra text. No markdown. Pure JSON.`

/* ── Legacy combined prompt (kept for extractWithText fallback) ─ */
const EXTRACTION_PROMPT = `${HEADER_PROMPT}

Also extract ALL line items. Use the ITEMS_PROMPT rules for merging Invoice + Packing List.

Return ONLY valid JSON: { "header": {...}, "items": [...] }`

/* ── Sanitize tariff code — never store/display 00000000 ─────── */
function sanitizeTariffCode(code: string | undefined | null): string {
  if (!code) return ''
  const clean = code.replace(/[\s-]/g, '')
  if (!clean || /^0+$/.test(clean)) return ''   // all zeros = empty
  if (!/^\d+$/.test(clean)) return ''            // non-numeric = empty
  if (clean.length < 6) return ''               // too short = invalid
  return clean
}

/* ── Normalize date string → DD.MM.YYYY ──────────────────────── */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return dateStr
  // Already clean formats
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-')
    return `${d}.${m}.${y}`
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr

  const MONTHS: Record<string, string> = {
    JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
    JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
  }
  // "6TH,FEB., 2026" | "6TH FEB 2026" | "06/02/2026"
  const m1 = dateStr.match(/(\d{1,2})(?:ST|ND|RD|TH)?[,\s./]+([A-Z]{3})[,\.\s]+(\d{4})/i)
  if (m1) return `${m1[1].padStart(2,'0')}.${MONTHS[m1[2].toUpperCase()] || '01'}.${m1[3]}`
  const m2 = dateStr.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (m2) return `${m2[1].padStart(2,'0')}.${m2[2].padStart(2,'0')}.${m2[3]}`
  return dateStr  // return as-is if unparseable
}

/* ── Build InvoiceItem array from AI response ────────────────── */
function buildItems(parsed: { header?: Partial<HeaderData>; items?: Partial<InvoiceItem>[] }): InvoiceItem[] {
  const rules = getTariffRules()

  return (parsed.items || []).map((item, idx) => {
    const desc = item.descriptionEn || ''

    // ── Priority 1: previously confirmed code (user-validated) ──
    // getConfirmedCode only works client-side; returns null on server
    const confirmed = typeof window !== 'undefined' ? getConfirmedCode(desc) : null
    if (confirmed) {
      return {
        id: `item_${idx + 1}`,
        itemNo:        item.itemNo || String(idx + 1),
        descriptionEn: desc,
        descriptionSq: translateToAlbanian(desc),
        qty:         Number(item.qty)         || 0,
        unit:        item.unit               || 'PCS',
        unitPrice:   Number(item.unitPrice)   || 0,
        totalValue:  Number(item.totalValue)  || 0,
        packages:    Number(item.packages)    || 0,
        grossWeight: Number(item.grossWeight) || 0,
        netWeight:   Number(item.netWeight)   || 0,
        volume:      Number(item.volume)      || 0,
        tariffCode:  sanitizeTariffCode(confirmed.tariffCode),
        customsRate: confirmed.cdRate,
        vatRate:     confirmed.vatRate,
        status:      'confirmed',
        confirmedAt: confirmed.confirmedAt,
      }
    }

    // ── Priority 2: auto-matched from keyword table ──
    const tariffRule = findTariffByKeyword(desc, rules)

    return {
      id: `item_${idx + 1}`,
      itemNo:        item.itemNo || String(idx + 1),
      descriptionEn: desc,
      descriptionSq: translateToAlbanian(desc),
      qty:         Number(item.qty)         || 0,
      unit:        item.unit               || 'PCS',
      unitPrice:   Number(item.unitPrice)   || 0,
      totalValue:  Number(item.totalValue)  || 0,
      packages:    Number(item.packages)    || 0,
      grossWeight: Number(item.grossWeight) || 0,
      netWeight:   Number(item.netWeight)   || 0,
      volume:      Number(item.volume)      || 0,
      tariffCode:  sanitizeTariffCode(tariffRule?.tariffCode || ''),
      customsRate: tariffRule?.customsRate  ?? 10,
      vatRate:     tariffRule?.vatRate      ?? 18,
      requiresMaterial: tariffRule?.requiresMaterial,
      materialNote:     tariffRule?.materialNote,
      // 'review' = auto-suggested, must be reviewed by user
      // 'missing' = no code found at all, blocks final export
      status: tariffRule ? 'review' : 'missing',
    }
  })
}

/* ── Model routing constants ────────────────────────────────────
 *
 * GPT-5.5 — used for ALL document extraction (PDF, images, vision)
 *   Supports: Files API (PDF), image_url (JPG/PNG/WEBP), multi-page
 *   Reason: superior table recognition, multi-column invoices, mixed content
 *
 * GPT-5-mini — used ONLY for text-in/text-out tasks (voice, text fallback)
 *   No vision. Cheaper. Sufficient for plain-text prompts.
 *
 * Validation (sums, dates, tariff checks) is ALWAYS done in code, never by AI.
 * ─────────────────────────────────────────────────────────────── */
const MODEL_EXTRACTION = 'gpt-5.5'    // PDF + image extraction
const MODEL_TEXT       = 'gpt-5-mini' // voice / text-only

/* ── Call OpenAI Chat Completions ────────────────────────────── */
async function callOpenAIRaw(
  apiKey: string,
  model: string,
  content: unknown[],
  maxTokens?: number
): Promise<{ raw: string; truncated: boolean }> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content }],
    // response_format omitted: incompatible with file/image inputs in gpt-5.5
    // JSON output is enforced via the prompt ("Return ONLY: { ... }")
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
    const { raw: headerRaw } = await callOpenAIRaw(apiKey, MODEL_EXTRACTION, [
      { type: 'text', text: HEADER_PROMPT },
      ...attachments,
    ])
    const headerParsed = parseJSON(headerRaw)
    // Normalize date to DD.MM.YYYY for display
    if (headerParsed.header?.invoiceDate) {
      headerParsed.header.invoiceDate = normalizeDate(headerParsed.header.invoiceDate)
    }

    // ── Call 2: items with Invoice+PackingList merge logic ───
    // ITEMS_PROMPT explicitly tells GPT to look at ALL pages,
    // find BOTH the Invoice and Packing List tables,
    // and merge them by Item No. to get packages/weight/volume.
    const { raw: itemsRaw, truncated } = await callOpenAIRaw(apiKey, MODEL_EXTRACTION, [
      { type: 'text', text: ITEMS_PROMPT },
      ...attachments,
    ])

    let itemsParsed: { items: Partial<InvoiceItem>[] } = { items: [] }
    if (!truncated) {
      itemsParsed = parseJSON(itemsRaw) as { items: Partial<InvoiceItem>[] }
    } else {
      console.warn('[AI] Items truncated, chunking by range...')
      itemsParsed = await extractItemsChunked(apiKey, attachments)
    }

    // ── Recovery: if sum(items) ≠ invoice total, find missing items ──
    // This catches cases where GPT missed the last few rows (e.g. HEATER PEN on last page)
    const headerTotal   = Number(headerParsed.header?.totalInvoice) || 0
    const extractedSum  = (itemsParsed.items || []).reduce((s, i) => s + (Number(i.totalValue) || 0), 0)
    const valueDiff     = Math.abs(headerTotal - extractedSum)

    if (headerTotal > 0 && valueDiff > 0.5) {
      console.warn(`[AI] Sum mismatch: extracted=${extractedSum.toFixed(2)}, expected=${headerTotal} (diff=${valueDiff.toFixed(2)}). Running recovery call...`)
      const recoveryPrompt = `RECOVERY EXTRACTION — some line items were missed in the previous extraction.

Known facts:
- Invoice total stated in document: ${headerTotal}
- Items already extracted have a sum of: ${extractedSum.toFixed(2)}
- Missing amount: ${(headerTotal - extractedSum).toFixed(2)}

TASK: Find ONLY the items that are MISSING. Look especially at:
- The LAST pages of the document (last 2-3 pages)
- Small misc items (e.g. HEATER PEN, MACHINE, LASER MACHINE, CLOTHES SAMPLES)
- Items with quantity = 1 PCS that may have been skipped
- Items at the very bottom of any invoice table

Already extracted item numbers (do NOT repeat these):
${(itemsParsed.items || []).map(i => i.itemNo).filter(Boolean).join(', ')}

Return ONLY the missing items: { "items": [ { "itemNo":"", "descriptionEn":"", "qty":0, "unit":"", "unitPrice":0, "totalValue":0, "packages":0, "grossWeight":0, "netWeight":0, "volume":0 } ] }`

      const { raw: recoveryRaw } = await callOpenAIRaw(apiKey, MODEL_EXTRACTION, [
        { type: 'text', text: recoveryPrompt },
        ...attachments,
      ])
      try {
        const recovery = parseJSON(recoveryRaw) as { items: Partial<InvoiceItem>[] }
        if (recovery.items?.length > 0) {
          console.log(`[AI] Recovery found ${recovery.items.length} missing items`)
          itemsParsed.items = [...(itemsParsed.items || []), ...recovery.items]
        }
      } catch (e) {
        console.warn('[AI] Recovery parse failed:', e)
      }
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

    const { raw, truncated } = await callOpenAIRaw(apiKey, MODEL_EXTRACTION, [
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
    callOpenAIRaw(apiKey, MODEL_EXTRACTION, headerContent),
    callOpenAIRaw(apiKey, MODEL_EXTRACTION, itemsContent),
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
    callOpenAIRaw(apiKey, MODEL_TEXT, [{ type: 'text', text: hPrompt }]),
    callOpenAIRaw(apiKey, MODEL_TEXT, [{ type: 'text', text: iPrompt }]),
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

  const { raw } = await callOpenAIRaw(apiKey, MODEL_TEXT, [{ type: 'text', text: prompt }], 2048)
  const parsed  = parseJSON(raw)
  return { header: parsed.header || {}, items: [], missingFields: [] }
}
