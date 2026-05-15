'use client'
import type { HeaderData, Language } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  data: Partial<HeaderData>
  onChange: (data: Partial<HeaderData>) => void
}

const IcoBusiness = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/>
  </svg>
)
const IcoDoc = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
)
const IcoGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IcoWarn = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex', alignItems: 'center', gap: 8,
      paddingBottom: 10, marginBottom: 2,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 7,
        background: 'var(--blue-50)', color: 'var(--blue)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{label}</span>
    </div>
  )
}

function Field({ label, value, onChange, required }: {
  label: string; value: string | number | undefined; onChange: (v: string) => void; required?: boolean
}) {
  const empty = !value && required
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em',
        textTransform: 'uppercase', color: 'var(--t4)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {label}
        {required && <span style={{ color: 'var(--red)', fontWeight: 800 }}>*</span>}
        {empty && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: 'var(--red)', fontSize: 11, fontWeight: 600, textTransform: 'none', letterSpacing: 0,
          }}>
            <IcoWarn /> Mungon
          </span>
        )}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="field-input"
        style={{
          borderColor: empty ? 'var(--red)' : 'var(--border)',
          background: empty ? 'var(--red-bg)' : 'var(--surface)',
        }}
        onFocus={e => { if (!empty) e.target.style.borderColor = 'var(--blue)' }}
        onBlur={e => { e.target.style.borderColor = empty ? 'var(--red)' : 'var(--border)' }}
      />
    </div>
  )
}

export default function HeaderForm({ lang, data, onChange }: Props) {
  const set = (key: keyof HeaderData) => (val: string) => onChange({ ...data, [key]: val })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>

      <SectionHeading icon={<IcoBusiness />} label={`${t(lang, 'labels.exporter')} / ${t(lang, 'labels.importer')}`} />
      <Field label={t(lang, 'labels.exporter')} value={data.exporterName} onChange={set('exporterName')} required />
      <Field label="Adresa eksportuesit" value={data.exporterAddress} onChange={set('exporterAddress')} />
      <Field label={t(lang, 'labels.importer')} value={data.importerName} onChange={set('importerName')} required />
      <Field label="Adresa importuesit" value={data.importerAddress} onChange={set('importerAddress')} />
      <Field label="NUI / NIPT" value={data.importerNui} onChange={set('importerNui')} required />

      <SectionHeading icon={<IcoDoc />} label={t(lang, 'labels.invoice')} />
      <Field label="Numri i faturës" value={data.invoiceNumber} onChange={set('invoiceNumber')} required />
      <Field label="Data e faturës" value={data.invoiceDate} onChange={set('invoiceDate')} required />
      <Field label={t(lang, 'labels.container')} value={data.containerNumber} onChange={set('containerNumber')} />
      <Field label="Incoterm" value={data.incoterm} onChange={set('incoterm')} />
      <Field label="Porti i ngarkimit" value={data.portOfLoading} onChange={set('portOfLoading')} />
      <Field label="Porti i shkarkimit" value={data.portOfDischarge} onChange={set('portOfDischarge')} />
      <Field label="Vendi i dorëzimit" value={data.placeOfDelivery} onChange={set('placeOfDelivery')} />

      <SectionHeading icon={<IcoGlobe />} label={lang === 'sq' ? 'Vendet / Vlerat' : 'Countries / Values'} />
      <Field label="Vendi i origjinës" value={data.countryOfOrigin} onChange={set('countryOfOrigin')} required />
      <Field label="Vendi i eksportit" value={data.countryOfExport} onChange={set('countryOfExport')} required />
      <Field label="Vendi i destinacionit" value={data.countryOfDestination} onChange={set('countryOfDestination')} />
      <Field label="Monedha" value={data.currency} onChange={set('currency')} required />
      <Field label="Vlera totale" value={data.totalInvoice} onChange={v => onChange({ ...data, totalInvoice: parseFloat(v) || 0 })} required />
      <Field label="Pesha bruto totale (kg)" value={data.totalGrossWeight} onChange={v => onChange({ ...data, totalGrossWeight: parseFloat(v) || 0 })} />
      <Field label="Paketime totale" value={data.totalPackages} onChange={v => onChange({ ...data, totalPackages: parseInt(v) || 0 })} />
      <Field label="Volumi total (m³)" value={data.totalVolume} onChange={v => onChange({ ...data, totalVolume: parseFloat(v) || 0 })} />
      <Field label="CMR numri" value={data.cmrNumber} onChange={set('cmrNumber')} />
      <Field label="EUR.1 numri" value={data.eur1Number} onChange={set('eur1Number')} />
      <Field label="Targa automjetit" value={data.vehiclePlate} onChange={set('vehiclePlate')} />
      <Field label="Mënyra e transportit" value={data.transportMode} onChange={set('transportMode')} />
      <Field label="Identiteti i transportit" value={data.transportIdentity} onChange={set('transportIdentity')} />
    </div>
  )
}
