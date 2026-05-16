import fs from 'fs'
import path from 'path'
import type { HeaderData, AsycudaPosition, AppSettings } from '@/types'

const MASTER_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'asycuda-master-template.xml')
const ITEM_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'asycuda-item-template.xml')

// Known old values from the original example XML — warn if found in output
export const OLD_XML_VALUES = [
  'RUEN IMPORT AND EXPORT',
  'FaLura SH.P.K',
  'FALURA SH.P.K',
  'PFL2601',
  'CAIU7808456',
  '811470963',
  '5425040',
  'DOGANOVA SH.P.K',
]

function applyAsciiMode(text: string): string {
  return text
    .replace(/ë/g, 'e').replace(/Ë/g, 'E')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
}

function sanitize(value: string | number | undefined, ascii = false): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
  return ascii ? applyAsciiMode(str) : str
}

function num(value: number | undefined): string {
  if (value === undefined || value === null) return '0.00'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function generateItemsXml(
  positions: AsycudaPosition[],
  header: HeaderData,
  settings: AppSettings
): string {
  const itemTemplate = fs.readFileSync(ITEM_TEMPLATE_PATH, 'utf-8')
  const ascii = settings.useAsciiForAsycuda

  return positions.map((pos) => {
    const cdRate = Number.isFinite(pos.customsRate) ? pos.customsRate : 0
    const vtRate = Number.isFinite(pos.vatRate) ? pos.vatRate : 0
    const cif = pos.totalValue
    const cdAmount = parseFloat(num(cif * cdRate / 100))
    const vtBase = cif + cdAmount
    const vtAmount = parseFloat(num(vtBase * vtRate / 100))
    const totalTax = parseFloat(num(cdAmount + vtAmount))
    const totalInvoice = Number(header.totalInvoice)
    const alphaCoef = Number.isFinite(totalInvoice) && totalInvoice > 0 ? cif / totalInvoice : 0

    const descAlb = ascii ? applyAsciiMode(pos.descriptionSq) : pos.descriptionSq
    const descEng = pos.descriptionEn

    let item = itemTemplate
    item = item.replace(/{{ITEM_PACKAGES}}/g, String(pos.packages || 0))
    item = item.replace(/{{ITEM_INCOTERM_CODE}}/g, sanitize(header.incoterm?.split(' ')[0] || ''))
    item = item.replace(/{{ITEM_INCOTERM_PLACE}}/g, sanitize(header.portOfLoading || ''))
    item = item.replace(/{{ITEM_COMMODITY_CODE}}/g, sanitize(pos.tariffCode))
    item = item.replace(/{{ITEM_SUPP_UNIT_CODE}}/g, sanitize(pos.unit || 'PCS'))
    item = item.replace(/{{ITEM_SUPP_UNIT_NAME}}/g, sanitize(pos.unit || 'PCS'))
    item = item.replace(/{{ITEM_SUPP_UNIT_QTY}}/g, String(pos.totalQty || 0))
    item = item.replace(/{{ITEM_PRICE}}/g, num(cif))
    item = item.replace(/{{ITEM_INVOICE_REF}}/g, sanitize(header.invoiceNumber))
    item = item.replace(/{{ITEM_ORIGIN_CODE}}/g, sanitize(header.countryOfOrigin || ''))
    item = item.replace(/{{ITEM_DESC_ALBANIAN}}/g, sanitize(descAlb, false))
    item = item.replace(/{{ITEM_DESC_ENGLISH}}/g, sanitize(descEng))
    item = item.replace(/{{ITEM_QTY}}/g, String(pos.totalQty || 0))
    item = item.replace(/{{ITEM_UNIT}}/g, sanitize(pos.unit || 'PCS'))
    item = item.replace(/{{ITEM_CONTAINER}}/g, sanitize(header.containerNumber || ''))
    item = item.replace(/{{ITEM_INVOICE_DATE}}/g, sanitize(header.invoiceDate))
    item = item.replace(/{{ITEM_TOTAL_TAX}}/g, num(totalTax))
    item = item.replace(/{{ITEM_CIF}}/g, num(cif))
    item = item.replace(/{{ITEM_CD_RATE}}/g, String(cdRate))
    item = item.replace(/{{ITEM_CD_AMOUNT}}/g, num(cdAmount))
    item = item.replace(/{{ITEM_VT_BASE}}/g, num(vtBase))
    item = item.replace(/{{ITEM_VT_RATE}}/g, String(vtRate))
    item = item.replace(/{{ITEM_VT_AMOUNT}}/g, num(vtAmount))
    item = item.replace(/{{ITEM_GROSS_WEIGHT}}/g, num(pos.grossWeight))
    item = item.replace(/{{ITEM_NET_WEIGHT}}/g, num(pos.netWeight))
    item = item.replace(/{{ITEM_STATISTICAL_VALUE}}/g, num(cif))
    item = item.replace(/{{ITEM_ALPHA_COEF}}/g, String(alphaCoef.toFixed(15)))
    item = item.replace(/{{CURRENCY}}/g, sanitize(header.currency || ''))

    return item
  }).join('\n')
}

function buildCommentsText(positions: AsycudaPosition[], header: HeaderData): string {
  const lines = [`EMERTIMET SIPAS FATURES ${header.invoiceNumber} DT. ${header.invoiceDate}:`]
  positions.forEach((pos, i) => {
    lines.push(`${i + 1}. ${pos.descriptionEn} - ${pos.totalQty} ${pos.unit} - VLERA ${num(pos.totalValue)} ${header.currency || 'EUR'}`)
  })
  return lines.join('\n')
}

export function generateXml(
  header: HeaderData,
  positions: AsycudaPosition[],
  settings: AppSettings
): string {
  const masterTemplate = fs.readFileSync(MASTER_TEMPLATE_PATH, 'utf-8')
  const ascii = settings.useAsciiForAsycuda

  const itemsXml = generateItemsXml(positions, header, settings)
  const commentsText = buildCommentsText(positions, header)

  // Build Assessment_notice item tax totals (2 per item: CD + VT)
  const taxTotalCount = positions.length * 2
  const assessmentTaxTotals = Array(taxTotalCount).fill('<Item_tax_total />').join('\n')

  // Build Global_taxes (2 global items)
  const globalTaxItems = `<Global_tax_item />\n<Global_tax_item />`

  let xml = masterTemplate
  xml = xml.replace('{{ASYCUDA_ID}}', '0')
  xml = xml.replace('{{ASSESSMENT_ITEM_TAX_TOTALS}}', assessmentTaxTotals)
  xml = xml.replace('{{GLOBAL_TAX_ITEMS}}', globalTaxItems)
  xml = xml.replace('{{TOTAL_FORMS}}', String(Math.ceil(positions.length / 3)))
  xml = xml.replace('{{TOTAL_ITEMS}}', String(positions.length))
  xml = xml.replace('{{EXPORTER_NAME}}', sanitize(header.exporterName, ascii))
  xml = xml.replace('{{CONSIGNEE_CODE}}', sanitize(header.importerNui))
  xml = xml.replace('{{CONSIGNEE_NAME}}', sanitize(header.importerName + '\n' + header.importerAddress, ascii))
  xml = xml.replace('{{FINANCIAL_CODE}}', sanitize(header.importerNui))
  xml = xml.replace('{{FINANCIAL_NAME}}', sanitize(header.importerName, ascii))
  xml = xml.replace('{{DECLARANT_CODE}}', sanitize(settings.declarantCode || ''))
  xml = xml.replace('{{DECLARANT_NAME}}', sanitize(settings.declarantName || '', ascii))
  xml = xml.replace('{{EXPORT_COUNTRY_CODE}}', sanitize(header.countryOfExport || ''))
  xml = xml.replace('{{EXPORT_COUNTRY_NAME}}', sanitize(header.countryOfExport || '', ascii))
  xml = xml.replace('{{DESTINATION_COUNTRY_CODE}}', sanitize(header.countryOfDestination || ''))
  xml = xml.replace('{{DESTINATION_COUNTRY_NAME}}', sanitize(header.countryOfDestination || '', ascii))
  xml = xml.replace('{{COUNTRY_OF_ORIGIN_NAME}}', sanitize(header.countryOfOrigin || ''))
  xml = xml.replace('{{COMMENTS_FREE_TEXT}}', sanitize(commentsText, ascii))
  xml = xml.replace('{{TRANSPORT_IDENTITY}}', sanitize(header.transportIdentity || ''))
  xml = xml.replace('{{TRANSPORT_BORDER_IDENTITY}}', sanitize(header.transportIdentity || ''))
  xml = xml.replace('{{INLAND_TRANSPORT_CODE}}', '1')
  xml = xml.replace('{{INCOTERM_CODE}}', sanitize(header.incoterm?.split(' ')[0] || ''))
  xml = xml.replace('{{INCOTERM_PLACE}}', sanitize(header.portOfLoading || ''))
  xml = xml.replace('{{ITEMS}}', itemsXml)

  return xml
}

export function detectOldValues(xml: string): { field: string; oldValue: string }[] {
  const found: { field: string; oldValue: string }[] = []
  for (const val of OLD_XML_VALUES) {
    if (xml.includes(val)) {
      found.push({ field: 'XML content', oldValue: val })
    }
  }
  return found
}
