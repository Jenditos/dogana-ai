'use client'
import { useState } from 'react'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField, AppSettings, Language } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  header: Partial<HeaderData>
  items: InvoiceItem[]
  positions: AsycudaPosition[]
  missingFields: MissingField[]
  settings: AppSettings
  onStatusChange: (status: string) => void
}

const STATUS_COLORS = {
  ready: 'text-green-600 bg-green-50 border-green-200',
  review: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  draft: 'text-gray-600 bg-gray-50 border-gray-200',
  missing: 'text-red-600 bg-red-50 border-red-200',
  ok: 'text-green-600 bg-green-50 border-green-200',
}

export default function ExportPanel({ lang, header, items, positions, missingFields, settings, onStatusChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [xml, setXml] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [errors, setErrors] = useState<unknown[]>([])
  const [warnings, setWarnings] = useState<unknown[]>([])
  const [oldValues, setOldValues] = useState<unknown[]>([])
  const [showXml, setShowXml] = useState(false)
  const [requiresDraft, setRequiresDraft] = useState(false)

  const generateXml = async (forceDraft = false) => {
    setLoading('xml')
    setErrors([])
    setWarnings([])
    try {
      const res = await fetch('/api/generate-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, items, positions, settings, forceDraft }),
      })
      const data = await res.json()

      if (res.status === 422) {
        setErrors(data.errors || [])
        setWarnings(data.warnings || [])
        setRequiresDraft(true)
        setStatus('review')
        onStatusChange('review')
        return
      }

      setXml(data.xml)
      setStatus(data.status)
      setWarnings(data.validation?.warnings || [])
      setOldValues(data.oldValues || [])
      setRequiresDraft(false)
      onStatusChange(data.status)
    } catch {
      setErrors([{ message: 'Gabim i brendshëm', messageEn: 'Internal error' }])
    } finally {
      setLoading(null)
    }
  }

  const downloadXml = () => {
    if (!xml) return
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.xml`
    a.click()
  }

  const downloadCsv = async () => {
    setLoading('csv')
    try {
      const res = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, items, positions, missingFields }),
      })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.csv`
      a.click()
    } finally {
      setLoading(null)
    }
  }

  const downloadExcel = async () => {
    setLoading('excel')
    try {
      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, items, positions, missingFields }),
      })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `DUDI_${header.invoiceNumber || 'export'}_${Date.now()}.xlsx`
      a.click()
    } finally {
      setLoading(null)
    }
  }

  const hasData = items.length > 0 || positions.length > 0
  const sq = lang === 'sq'

  /* ── Inline SVG icons ── */
  const IcoGenerate = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  )
  const IcoDownload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
  const IcoEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
  const IcoEyeOff = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  const IcoCsv = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  )
  const IcoXls = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="12" x2="15" y2="18"/><line x1="15" y1="12" x2="9" y2="18"/>
    </svg>
  )
  const IcoAlert = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
  const IcoSpinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
  const IcoCheck = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
  const IcoMissing = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )

  const statusConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
    ready:  { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-bdr)',  label: t(lang, 'status.ready') },
    review: { bg: 'var(--amber-bg)',  color: 'var(--amber)',  border: 'var(--amber-bdr)',  label: t(lang, 'status.review') },
    draft:  { bg: 'var(--surface-3)', color: 'var(--t3)',     border: 'var(--border)',     label: t(lang, 'status.draft') },
    missing:{ bg: 'var(--red-bg)',    color: 'var(--red)',    border: 'var(--red-bdr)',    label: t(lang, 'status.missing') },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="md:grid-cols-3">
        {([
          [t(lang, 'labels.exporter'), header.exporterName],
          [t(lang, 'labels.importer'), header.importerName],
          [t(lang, 'labels.invoice'), header.invoiceNumber],
          [t(lang, 'labels.date'), header.invoiceDate],
          [t(lang, 'labels.container'), header.containerNumber],
          [t(lang, 'labels.origin'), header.countryOfOrigin],
          [t(lang, 'labels.totalValue'), header.totalInvoice ? `${header.totalInvoice.toFixed(2)} ${header.currency || ''}` : null],
          [t(lang, 'labels.totalWeight'), header.totalGrossWeight ? `${header.totalGrossWeight} kg` : null],
          [t(lang, 'labels.packages'), header.totalPackages || null],
          [t(lang, 'labels.positions'), positions.length || null],
        ] as [string, string | number | null | undefined][]).map(([label, value]) => (
          <div key={label as string} style={{ background: 'var(--surface-2)', borderRadius: 11, padding: '11px 14px', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--t4)' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: value ? 'var(--t1)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {value || <><IcoMissing /> {sq ? 'Mungon' : 'Missing'}</>}
            </p>
          </div>
        ))}
      </div>

      {/* ── Errors ── */}
      {errors.length > 0 && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoAlert /> {t(lang, 'messages.missingData')}
          </p>
          {(errors as { message: string }[]).map((e, i) => (
            <p key={i} style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, display: 'inline-block' }} />
              {e.message}
            </p>
          ))}
          {requiresDraft && (
            <button onClick={() => generateXml(true)} className="btn btn-ghost" style={{ marginTop: 12, height: 36, fontSize: 12.5 }}>
              {t(lang, 'buttons.createDraft')}
            </button>
          )}
        </div>
      )}

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bdr)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoAlert /> {sq ? 'Paralajmërime' : 'Warnings'}
          </p>
          {(warnings as { message: string }[]).map((w, i) => (
            <p key={i} style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, display: 'inline-block' }} />
              {w.message}
            </p>
          ))}
        </div>
      )}

      {/* ── Old data warning ── */}
      {oldValues.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoAlert /> {t(lang, 'messages.oldDataFound')}
          </p>
          {(oldValues as { oldValue: string }[]).map((v, i) => (
            <p key={i} style={{ margin: '3px 0 0', fontSize: 12.5, color: '#EA580C' }}>· {v.oldValue}</p>
          ))}
        </div>
      )}

      {/* ── Status badge ── */}
      {status && statusConfig[status] && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, textAlign: 'center',
          background: statusConfig[status].bg,
          border: `1px solid ${statusConfig[status].border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontWeight: 700, fontSize: 14, color: statusConfig[status].color,
        }}>
          {status === 'ready' ? <IcoCheck /> : <IcoAlert />}
          {statusConfig[status].label}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Generate */}
        <button
          onClick={() => generateXml(false)}
          disabled={!hasData || loading === 'xml'}
          className="btn btn-primary"
          style={{ width: '100%', height: 56, fontSize: 16, fontWeight: 700, borderRadius: 14, gap: 10 }}
        >
          {loading === 'xml' ? <><IcoSpinner />{t(lang, 'messages.validating')}</> : <><IcoGenerate />{t(lang, 'buttons.generate')}</>}
        </button>

        {/* Download row */}
        {xml && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={downloadXml} className="btn btn-primary" style={{ height: 46, gap: 8, background: 'var(--green)', boxShadow: '0 1px 4px rgba(5,150,105,.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#047857'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.transform = 'none'; }}>
              <IcoDownload /> {t(lang, 'buttons.downloadXml')}
            </button>
            <button onClick={() => setShowXml(v => !v)} className="btn btn-ghost" style={{ height: 46, gap: 8 }}>
              {showXml ? <IcoEyeOff /> : <IcoEye />}
              {showXml ? (sq ? 'Fshih XML' : 'Hide XML') : (sq ? 'Shiko XML' : 'View XML')}
            </button>
          </div>
        )}

        {/* CSV + Excel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={downloadCsv} disabled={!hasData || loading === 'csv'} className="btn btn-ghost" style={{ height: 46, gap: 8 }}>
            {loading === 'csv' ? <IcoSpinner /> : <IcoCsv />}
            {t(lang, 'buttons.downloadCsv')}
          </button>
          <button onClick={downloadExcel} disabled={!hasData || loading === 'excel'} className="btn btn-ghost" style={{ height: 46, gap: 8 }}>
            {loading === 'excel' ? <IcoSpinner /> : <IcoXls />}
            {t(lang, 'buttons.downloadExcel')}
          </button>
        </div>
      </div>

      {/* ── XML Preview ── */}
      {showXml && xml && (
        <div className="a-fade-in" style={{ background: '#0F172A', borderRadius: 14, padding: 20, overflow: 'auto', maxHeight: 380, border: '1px solid #1E293B' }}>
          <pre style={{ margin: 0, color: '#4ADE80', fontSize: 11.5, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{xml}</pre>
        </div>
      )}
    </div>
  )
}
