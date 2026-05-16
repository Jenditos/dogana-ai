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
  // If still unmatched, return cleaned-up original (better than empty)
  return upper
}

// Additional translations for common non-English invoice languages
const ALB_EXTRA: Record<string, string> = {
  // Serbian/Croatian/Bosnian
  'T.PAPIR': 'LETER TUALETI', 'TOALETNI PAPIR': 'LETER TUALETI',
  'UBRUS': 'PECETE LETRE', 'SALVETE': 'PECETE LETRE',
  'MARAMICE': 'SHAMICE LETRE', 'PAPIRNI': 'LETER',
  // German
  'TOILETTENPAPIER': 'LETER TUALETI', 'SERVIETTEN': 'PECETE LETRE',
  'KÜCHENROLLE': 'PESHQIRE LETRE', 'KUCHENROLLE': 'PESHQIRE LETRE',
  // Turkish
  'TUVALET KAGIDI': 'LETER TUALETI', 'KAGIT HAVLU': 'PESHQIRE LETRE',
  // Italian
  'CARTA IGIENICA': 'LETER TUALETI', 'TOVAGLIOLI': 'PECETE LETRE',
  // Add more as needed
}

export function translateToAlbanianFull(description: string): string {
  const upper = description.toUpperCase()
  // Try extra translations first (more specific)
  const extraKeys = Object.keys(ALB_EXTRA).sort((a, b) => b.length - a.length)
  for (const key of extraKeys) {
    if (upper.includes(key)) return ALB_EXTRA[key]
  }
  return translateToAlbanian(description)
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
- totalGrossWeight: Total gross weight in kg as number — ONLY if explicitly written in the document (e.g. "11200 kg"). If not found → 0
- totalPackages: Total packages/cartons as number — ONLY if explicitly written (e.g. "562 CTN"). If not found → 0
- totalVolume: Total volume in m³ — ONLY if explicitly written (e.g. "68.00 CBM"). If not found → 0
- transportMode: Mode of transport — ONLY if written in document. If not found → ""
- transportIdentity: Vehicle/vessel ID — ONLY if written. If not found → ""
- cmrNumber: CMR number — ONLY if written. If not found → ""
- vehiclePlate: Vehicle plate — ONLY if written. If not found → ""

CRITICAL — NEVER INVENT DATA:
- If a field is not present in the document, use 0 (for numbers) or "" (for strings)
- NEVER estimate, guess, or calculate totalGrossWeight or totalPackages from item data
- NEVER use internal product codes as weight or package values
- If the document has no Packing List and no explicit weight/package totals → totalGrossWeight=0, totalPackages=0
- Only extract values that are LITERALLY written in the document

Return ONLY: { "header": { ... } }`

/* ── Items extraction prompt — Invoice + Packing List merge ─── */
const ITEMS_PROMPT = `You are an expert customs document data extractor and HS tariff classifier.

STEP 1 — LANGUAGE DETECTION
The document may be in ANY language (English, Chinese, Serbian, German, Turkish, Albanian, Italian, etc.).
Detect the language automatically. Translate ALL product descriptions to English for the "descriptionEn" field.
Examples:
  Serbian "Toaletni papir" → English "Toilet paper"
  Serbian "Ubrus" → English "Paper napkins"
  Chinese "卫生纸" → English "Toilet paper"
  German "Toilettenpapier" → English "Toilet paper"

STEP 2 — FIND INVOICE AND PACKING LIST
The document may contain:
1. A COMMERCIAL INVOICE — has: Item No., Description, Quantity, Unit Price, Total Value
2. A PACKING LIST — has: Item No., Description, QTY, Package/CTN, G.W., MEAS./CBM
Look at ALL pages. Merge them by Item No. when both exist.

COLUMN ALIASES:
- Packages/Cartons: PACKAGE, CTN, CARTON, PAKO, KOM, KOM., Kol.
- Gross Weight: G.W, GW, BRUTO, WEIGHT, KG, Težina bruto
- Volume: MEAS., CBM, M3, VOLUMI
- Quantity: QTY, QUANTITY, Količina, SASIA, PCS, SET, KOM

STEP 3 — ASSIGN HS TARIFF CODE (this is critical)
For EACH item, you MUST suggest the best matching HS tariff code based on what the product actually is.
Use your knowledge of the Harmonized System (HS) nomenclature.

TARIFF CODE RULES:
- Return the 10-digit TARIK code as a string (e.g. "4818100000")
- If very confident → set tariffCodeConfidence: "high"
- If somewhat confident → set tariffCodeConfidence: "medium"
- If unsure → set tariffCodeConfidence: "low" but still suggest the closest code
- NEVER leave tariffCode empty if you can identify what the product is
- NEVER use "0000000000"

COMMON CODES by product type (use as reference):
Toilet paper → 4818100000 (CD 10%, VAT 18%)
Paper napkins / tissue / ubrus → 4818201000 (CD 10%, VAT 18%)
Paper serviettes / salvete → 4818300000 (CD 10%, VAT 18%)
Paper towels → 4818209100 (CD 10%, VAT 18%)
Ceramic tableware → 6912002900 (CD 10%, VAT 18%)
Glass cups → 7013289000 (CD 10%, VAT 18%)
Charger/adapter → 8504408390 (CD 10%, VAT 18%)
USB cable → 8544429000 (CD 10%, VAT 18%)
Bluetooth headset → 8518300020 (CD 10%, VAT 18%)
Clothing → 6211000000 (CD 10%, VAT 18%)
Bags/backpacks → 4202911000 (CD 10%, VAT 18%)
Toys → 9503007900 (CD 10%, VAT 18%)

STEP 4 — MERGE PROCEDURE
- itemNo, descriptionEn (translated!), qty, unit, unitPrice, totalValue → from Invoice
- packages, grossWeight, netWeight, volume → from Packing List (0 if no Packing List found)

STRICT RULES:
1. DO NOT invent weights/packages if no Packing List exists — use 0
2. DO NOT skip any item — check last pages for small/misc items
3. ALWAYS translate descriptions to English
4. ALWAYS suggest a tariff code with confidence level
5. COMPLETENESS: verify sum(totalValue) ≈ invoice total before returning

Return ONLY this JSON structure:
{ "items": [ {
  "itemNo": "",
  "descriptionEn": "",
  "qty": 0,
  "unit": "",
  "unitPrice": 0,
  "totalValue": 0,
  "packages": 0,
  "grossWeight": 0,
  "netWeight": 0,
  "volume": 0,
  "tariffCode": "",
  "tariffCodeConfidence": "high|medium|low",
  "cdRate": 10,
  "vatRate": 18
} ] }

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

    // ── Priority 1: previously confirmed code by user ──
    const confirmed = typeof window !== 'undefined' ? getConfirmedCode(desc) : null
    if (confirmed) {
      return {
        id: `item_${idx + 1}`,
        itemNo:        item.itemNo || String(idx + 1),
        descriptionEn: desc,
        descriptionSq: translateToAlbanianFull(desc),
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

    // ── Priority 2: keyword-based rule match ──
    const tariffRule = findTariffByKeyword(desc, rules)

    // ── Priority 3: AI-suggested code from prompt (gpt-5.5 classified it) ──
    // The AI returns tariffCode + tariffCodeConfidence when it recognizes the product,
    // even if the description is in a foreign language (Serbian, Chinese, etc.)
    const aiCode    = sanitizeTariffCode((item as { tariffCode?: string }).tariffCode || '')
    const aiCdRate  = Number((item as { cdRate?: number }).cdRate) || 10
    const aiVatRate = Number((item as { vatRate?: number }).vatRate) || 18
    const aiConf    = (item as { tariffCodeConfidence?: string }).tariffCodeConfidence || ''

    // Determine best code: keyword rule > AI suggestion > empty
    const finalCode = sanitizeTariffCode(tariffRule?.tariffCode || '') || aiCode
    const finalCd   = tariffRule?.customsRate ?? (aiCode ? aiCdRate : 10)
    const finalVat  = tariffRule?.vatRate     ?? (aiCode ? aiVatRate : 18)

    // Status logic:
    // 'confirmed' — user confirmed (handled above)
    // 'review'    — code found (keyword OR ai), needs user confirmation
    // 'missing'   — no code anywhere, must be manually added
    const hasCode = !!finalCode
    const status  = hasCode ? 'review' : 'missing'

    // Log when AI classifier provided the code (no keyword match)
    if (!tariffRule && aiCode) {
      console.log(`[buildItems] AI-classified "${desc}" → ${aiCode} (confidence: ${aiConf})`)
    }

    return {
      id: `item_${idx + 1}`,
      itemNo:        item.itemNo || String(idx + 1),
      descriptionEn: desc,
      descriptionSq: translateToAlbanianFull(desc),
      qty:         Number(item.qty)         || 0,
      unit:        item.unit               || 'PCS',
      unitPrice:   Number(item.unitPrice)   || 0,
      totalValue:  Number(item.totalValue)  || 0,
      packages:    Number(item.packages)    || 0,
      grossWeight: Number(item.grossWeight) || 0,
      netWeight:   Number(item.netWeight)   || 0,
      volume:      Number(item.volume)      || 0,
      tariffCode:  finalCode,
      customsRate: finalCd,
      vatRate:     finalVat,
      requiresMaterial: tariffRule?.requiresMaterial,
      materialNote:     tariffRule?.materialNote,
      status,
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
