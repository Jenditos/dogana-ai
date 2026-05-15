export type Language = 'sq' | 'en'
export type ItemStatus = 'ok' | 'missing' | 'review' | 'ready' | 'draft'

export interface InvoiceItem {
  id: string
  itemNo: string
  descriptionEn: string
  descriptionSq: string
  qty: number
  unit: string
  unitPrice: number
  totalValue: number
  packages: number
  grossWeight: number
  netWeight: number
  volume: number
  tariffCode: string
  customsRate: number
  vatRate: number
  status: ItemStatus
}

export interface AsycudaPosition {
  positionNo: number
  tariffCode: string
  descriptionEn: string
  descriptionSq: string
  totalQty: number
  totalValue: number
  grossWeight: number
  netWeight: number
  packages: number
  customsRate: number
  vatRate: number
  unit: string
  status: ItemStatus
}

export interface MissingField {
  field: string
  item?: string
  problem: string
  whatToFill: string
  status: ItemStatus
}

export interface HeaderData {
  exporterName: string
  exporterAddress: string
  importerName: string
  importerAddress: string
  importerNui: string
  declarantCode: string
  declarantName: string
  invoiceNumber: string
  invoiceDate: string
  containerNumber: string
  incoterm: string
  portOfLoading: string
  portOfDischarge: string
  placeOfDelivery: string
  countryOfExport: string
  countryOfOrigin: string
  countryOfDestination: string
  currency: string
  totalInvoice: number
  totalGrossWeight: number
  totalPackages: number
  totalVolume: number
  transportMode: string
  transportIdentity: string
  cmrNumber: string
  eur1Number: string
  vehiclePlate: string
  status: ItemStatus
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  messageEn: string
}

export interface ValidationWarning {
  field: string
  message: string
  messageEn: string
}

export interface ExtractionResult {
  header: Partial<HeaderData>
  items: InvoiceItem[]
  missingFields: MissingField[]
  rawText?: string
}

export interface AppSettings {
  language: Language
  useAsciiForAsycuda: boolean
  declarantCode: string
  declarantName: string
  officeCode: string
  officeName: string
}

export interface TariffRule {
  id: string
  keyword: string
  descriptionEn: string
  descriptionSq: string
  tariffCode: string
  customsRate: number
  vatRate: number
  notes: string
}

export interface GeneratedFiles {
  xml: string
  csvData: string
  excelBuffer?: ArrayBuffer
  status: ItemStatus
  warnings: string[]
}
