'use client'
import type { HeaderData, Language, ItemStatus } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  data: Partial<HeaderData>
  onChange: (data: Partial<HeaderData>) => void
}

const STATUS_COLORS: Record<ItemStatus, string> = {
  ok: 'border-green-400 bg-green-50',
  missing: 'border-red-400 bg-red-50',
  review: 'border-yellow-400 bg-yellow-50',
  ready: 'border-green-500 bg-green-50',
  draft: 'border-gray-300 bg-gray-50',
}

function Field({
  label,
  value,
  onChange,
  status,
  required,
}: {
  label: string
  value: string | number | undefined
  onChange: (v: string) => void
  status?: ItemStatus
  required?: boolean
}) {
  const borderColor = status ? STATUS_COLORS[status] : 'border-gray-200'
  const isEmpty = !value && required

  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isEmpty && <span className="text-xs text-red-500 font-normal ml-1">⚠ Mungon</span>}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full border-2 ${isEmpty ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors`}
      />
    </div>
  )
}

export default function HeaderForm({ lang, data, onChange }: Props) {
  const set = (key: keyof HeaderData) => (val: string) => {
    onChange({ ...data, [key]: val })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <h3 className="text-base font-bold text-gray-700 mb-3 border-b pb-2">
            🏭 {t(lang, 'labels.exporter')} / {t(lang, 'labels.importer')}
          </h3>
        </div>

        <Field label={t(lang, 'labels.exporter')} value={data.exporterName} onChange={set('exporterName')} required />
        <Field label="Adresa eksportuesit" value={data.exporterAddress} onChange={set('exporterAddress')} />
        <Field label={t(lang, 'labels.importer')} value={data.importerName} onChange={set('importerName')} required />
        <Field label="Adresa importuesit" value={data.importerAddress} onChange={set('importerAddress')} />
        <Field label="NUI / NIPT" value={data.importerNui} onChange={set('importerNui')} required />

        <div className="md:col-span-2">
          <h3 className="text-base font-bold text-gray-700 mb-3 border-b pb-2 mt-2">
            📄 {t(lang, 'labels.invoice')}
          </h3>
        </div>

        <Field label="Numri i faturës" value={data.invoiceNumber} onChange={set('invoiceNumber')} required />
        <Field label="Data e faturës" value={data.invoiceDate} onChange={set('invoiceDate')} required />
        <Field label={t(lang, 'labels.container')} value={data.containerNumber} onChange={set('containerNumber')} />
        <Field label="Incoterm" value={data.incoterm} onChange={set('incoterm')} />
        <Field label="Porti i ngarkimit" value={data.portOfLoading} onChange={set('portOfLoading')} />
        <Field label="Porti i shkarkimit" value={data.portOfDischarge} onChange={set('portOfDischarge')} />
        <Field label="Vendi i dorëzimit" value={data.placeOfDelivery} onChange={set('placeOfDelivery')} />

        <div className="md:col-span-2">
          <h3 className="text-base font-bold text-gray-700 mb-3 border-b pb-2 mt-2">
            🌍 Vendet / Vlerat
          </h3>
        </div>

        <Field label="Vendi i origjinës" value={data.countryOfOrigin} onChange={set('countryOfOrigin')} required />
        <Field label="Vendi i eksportit" value={data.countryOfExport} onChange={set('countryOfExport')} required />
        <Field label="Vendi i destinacionit" value={data.countryOfDestination} onChange={set('countryOfDestination')} />
        <Field label="Monedha" value={data.currency} onChange={set('currency')} required />

        <Field
          label="Vlera totale"
          value={data.totalInvoice}
          onChange={v => onChange({ ...data, totalInvoice: parseFloat(v) || 0 })}
          required
        />
        <Field
          label="Pesha bruto totale (kg)"
          value={data.totalGrossWeight}
          onChange={v => onChange({ ...data, totalGrossWeight: parseFloat(v) || 0 })}
        />
        <Field
          label="Paketime totale"
          value={data.totalPackages}
          onChange={v => onChange({ ...data, totalPackages: parseInt(v) || 0 })}
        />
        <Field
          label="Volumi total (m³)"
          value={data.totalVolume}
          onChange={v => onChange({ ...data, totalVolume: parseFloat(v) || 0 })}
        />

        <Field label="CMR numri" value={data.cmrNumber} onChange={set('cmrNumber')} />
        <Field label="EUR.1 numri" value={data.eur1Number} onChange={set('eur1Number')} />
        <Field label="Targa automjetit" value={data.vehiclePlate} onChange={set('vehiclePlate')} />
        <Field label="Mënyra e transportit" value={data.transportMode} onChange={set('transportMode')} />
        <Field label="Identiteti i transportit" value={data.transportIdentity} onChange={set('transportIdentity')} />
      </div>
    </div>
  )
}
