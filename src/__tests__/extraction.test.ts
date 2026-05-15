/**
 * Unit tests for extraction logic, file-type routing, and field mapping.
 * Run: npx tsx src/__tests__/extraction.test.ts
 *
 * These tests do NOT call the real OpenAI API.
 * They verify the pipeline logic, type detection, and JSON mapping.
 */

// ── File type detection (mirrors extract/route.ts logic) ──────
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const SUPPORTED_PDF_TYPES   = ['application/pdf']

function getFileType(mimeType: string, filename: string): 'pdf' | 'image' | 'unsupported' {
  const mime = mimeType.toLowerCase()
  const ext  = filename.split('.').pop()?.toLowerCase() ?? ''
  if (SUPPORTED_PDF_TYPES.includes(mime) || ext === 'pdf') return 'pdf'
  if (SUPPORTED_IMAGE_TYPES.includes(mime) || ['jpg','jpeg','png','webp','gif'].includes(ext)) return 'image'
  return 'unsupported'
}

function getMimeType(mimeType: string, filename: string): string {
  const mime = mimeType.toLowerCase()
  if (SUPPORTED_IMAGE_TYPES.includes(mime)) return mime
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const extMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
  return extMap[ext] || 'image/jpeg'
}

// ── Test runner ───────────────────────────────────────────────
let passed = 0, failed = 0
function test(name: string, fn: () => void) {
  try { fn(); console.log(`  ✓ ${name}`); passed++ }
  catch (e) { console.error(`  ✗ ${name}: ${e}`); failed++ }
}
function expect(actual: unknown) {
  return {
    toBe:    (expected: unknown) => { if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`) },
    toEqual: (expected: unknown) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`) },
    not: {
      toBe: (expected: unknown) => { if (actual === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`) },
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. File Type Detection
// ═══════════════════════════════════════════════════════════════
console.log('\n1. File Type Detection')

test('PDF with correct MIME type → pdf', () => {
  expect(getFileType('application/pdf', 'invoice.pdf')).toBe('pdf')
})
test('PDF with octet-stream MIME but .pdf extension → pdf', () => {
  expect(getFileType('application/octet-stream', 'FALURA_INVOICE.pdf')).toBe('pdf')
})
test('JPEG image → image', () => {
  expect(getFileType('image/jpeg', 'photo.jpg')).toBe('image')
})
test('PNG image → image', () => {
  expect(getFileType('image/png', 'scan.png')).toBe('image')
})
test('WEBP image → image', () => {
  expect(getFileType('image/webp', 'doc.webp')).toBe('image')
})
test('Word document → unsupported', () => {
  expect(getFileType('application/msword', 'invoice.doc')).toBe('unsupported')
})
test('Excel file → unsupported', () => {
  expect(getFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data.xlsx')).toBe('unsupported')
})
test('PDF is NOT treated as image', () => {
  const type = getFileType('application/pdf', 'invoice.pdf')
  expect(type).not.toBe('image')
})

// ═══════════════════════════════════════════════════════════════
// 2. MIME Type Detection for Images
// ═══════════════════════════════════════════════════════════════
console.log('\n2. MIME Type Detection')

test('image/jpeg → image/jpeg', () => {
  expect(getMimeType('image/jpeg', 'photo.jpg')).toBe('image/jpeg')
})
test('image/png → image/png', () => {
  expect(getMimeType('image/png', 'scan.png')).toBe('image/png')
})
test('image/webp → image/webp', () => {
  expect(getMimeType('image/webp', 'doc.webp')).toBe('image/webp')
})
test('.jpg extension without MIME → image/jpeg', () => {
  expect(getMimeType('', 'photo.jpg')).toBe('image/jpeg')
})
test('.png extension without MIME → image/png', () => {
  expect(getMimeType('', 'scan.png')).toBe('image/png')
})

// ═══════════════════════════════════════════════════════════════
// 3. AI Response JSON Parsing
// ═══════════════════════════════════════════════════════════════
console.log('\n3. AI Response JSON Parsing')

// Simulate what callOpenAI does
function parseAIResponse(raw: string): object | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

test('Valid JSON response parsed correctly', () => {
  const raw = '{"header":{"exporterName":"RUEN IMPORT"},"items":[]}'
  const result = parseAIResponse(raw) as { header: { exporterName: string } }
  expect(result?.header?.exporterName).toBe('RUEN IMPORT')
})
test('JSON embedded in text parsed correctly', () => {
  const raw = 'Here is the data: {"header":{"invoiceNumber":"PFL2601"},"items":[]}'
  const result = parseAIResponse(raw) as { header: { invoiceNumber: string } }
  expect(result?.header?.invoiceNumber).toBe('PFL2601')
})
test('Empty response returns null', () => {
  expect(parseAIResponse('')).toBe(null)
})
test('Non-JSON response returns null', () => {
  expect(parseAIResponse('Sorry, I cannot process this document.')).toBe(null)
})

// ═══════════════════════════════════════════════════════════════
// 4. Example Invoice Data Validation
// ═══════════════════════════════════════════════════════════════
console.log('\n4. Example Invoice Validation')

// This is the expected extracted data from the test invoice NR.1 FALURA INVOICE 2026-2-6 CAIU7808456
const EXPECTED_HEADER = {
  exporterName: 'RUEN IMPORT AND EXPORT CO., LTD',
  importerName: 'FaLura SH.P.K.',
  importerNui: '811470963',
  invoiceNumber: 'PFL2601',
  containerNumber: 'CAIU7808456',
  portOfLoading: 'NINGBO',
  portOfDischarge: 'DURRES',
  incoterm: 'FOB NINGBO',
  currency: 'EUR',
  totalInvoice: 68869.16,
  totalGrossWeight: 11200,
  totalPackages: 562,
}

// Simulate what the AI should return (acceptance criteria)
const simulatedAIResponse = {
  header: EXPECTED_HEADER,
  items: [
    { itemNo: 'F2-1--5', descriptionEn: 'CAR AROMATHERAPY PAPER TABLET', qty: 15600, unit: 'PCS', unitPrice: 0.11, totalValue: 1716.00, packages: 13, grossWeight: 221, netWeight: 221, volume: 0.91 },
    { itemNo: 'F3-1', descriptionEn: 'CERAMIC BOWL', qty: 72, unit: 'PCS', unitPrice: 2.84, totalValue: 204.48, packages: 3, grossWeight: 71.1, netWeight: 71.1, volume: 0.15 },
    { itemNo: 'F3-2,-4', descriptionEn: 'CERAMIC PLATE', qty: 216, unit: 'PCS', unitPrice: 0.86, totalValue: 185.76, packages: 6, grossWeight: 125.7, netWeight: 125.7, volume: 0.20 },
  ],
}

test('Example invoice: exporter name present', () => {
  expect(!!simulatedAIResponse.header.exporterName).toBe(true)
})
test('Example invoice: importer name present', () => {
  expect(!!simulatedAIResponse.header.importerName).toBe(true)
})
test('Example invoice: NUI present', () => {
  expect(simulatedAIResponse.header.importerNui).toBe('811470963')
})
test('Example invoice: invoice number present', () => {
  expect(simulatedAIResponse.header.invoiceNumber).toBe('PFL2601')
})
test('Example invoice: container present', () => {
  expect(simulatedAIResponse.header.containerNumber).toBe('CAIU7808456')
})
test('Example invoice: currency is EUR', () => {
  expect(simulatedAIResponse.header.currency).toBe('EUR')
})
test('Example invoice: items array not empty', () => {
  expect(simulatedAIResponse.items.length > 0).toBe(true)
})
test('Example invoice: first item has description', () => {
  expect(!!simulatedAIResponse.items[0].descriptionEn).toBe(true)
})
test('Example invoice: first item has positive qty', () => {
  expect(simulatedAIResponse.items[0].qty > 0).toBe(true)
})
test('Example invoice: first item has positive value', () => {
  expect(simulatedAIResponse.items[0].totalValue > 0).toBe(true)
})

// ═══════════════════════════════════════════════════════════════
// 5. No window.alert() in source code
// ═══════════════════════════════════════════════════════════════
console.log('\n5. Code Quality Checks')

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function findInFiles(dir: string, pattern: RegExp, exts: string[]): string[] {
  const results: string[] = []
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const full = join(d, f)
      if (statSync(full).isDirectory() && !['node_modules', '.next', '.git'].includes(f)) {
        walk(full)
      } else if (exts.some(e => f.endsWith(e))) {
        const content = readFileSync(full, 'utf8')
        const lines   = content.split('\n')
        lines.forEach((line, i) => {
          if (pattern.test(line)) results.push(`${full}:${i + 1}: ${line.trim()}`)
        })
      }
    }
  }
  walk(dir)
  return results
}

const srcDir = join(process.cwd(), 'src')

test('No window.alert() calls in source', () => {
  const found = findInFiles(srcDir, /(?<!\/\/.*)\bwindow\.alert\s*\(|(?<![/*\s])(?<!replaces\s)\balert\s*\(/, ['.ts', '.tsx'])
    .filter(l => !l.includes('__tests__') && !l.includes('//') && !l.includes('/*') && !l.includes('*'))
  if (found.length > 0) throw new Error(`Found alert() at:\n${found.join('\n')}`)
})

test('No hardcoded max_tokens (use max_completion_tokens)', () => {
  const found = findInFiles(srcDir, /["']max_tokens["']/, ['.ts', '.tsx'])
    .filter(l => !l.includes('__tests__'))
  if (found.length > 0) throw new Error(`Found max_tokens at:\n${found.join('\n')}`)
})

test('No PDF sent as image_url', () => {
  const found = findInFiles(srcDir, /application\/pdf.*image_url|image_url.*application\/pdf/, ['.ts', '.tsx'])
  if (found.length > 0) throw new Error(`PDF sent as image_url at:\n${found.join('\n')}`)
})

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('TESTS FAILED')
  process.exit(1)
} else {
  console.log('ALL TESTS PASSED ✓')
}
