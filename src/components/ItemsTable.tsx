'use client'
import { useState } from 'react'
import type { InvoiceItem, Language } from '@/types'
import { t } from '@/lib/i18n'
import { saveConfirmedCode } from '@/lib/tariffMapper'

interface Props {
  lang: Language
  items: InvoiceItem[]
  onChange: (items: InvoiceItem[]) => void
}

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: Record<string, string> }> = {
  confirmed: {
    bg: 'rgba(5,150,105,.08)', color: 'var(--green)', border: 'var(--green-bdr)',
    label: { sq: 'I konfirmuar', en: 'Confirmed' },
  },
  ok: {
    bg: 'rgba(5,150,105,.08)', color: 'var(--green)', border: 'var(--green-bdr)',
    label: { sq: 'Në rregull', en: 'OK' },
  },
  review: {
    bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-bdr)',
    label: { sq: 'Për kontroll', en: 'Review' },
  },
  missing: {
    bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red-bdr)',
    label: { sq: 'Mungon', en: 'Missing' },
  },
  ready: {
    bg: 'rgba(5,150,105,.08)', color: 'var(--green)', border: 'var(--green-bdr)',
    label: { sq: 'Gati', en: 'Ready' },
  },
  draft: {
    bg: 'var(--surface-3)', color: 'var(--t3)', border: 'var(--border)',
    label: { sq: 'Draft', en: 'Draft' },
  },
}

function StatusBadge({ status, lang }: { status: string; lang: Language }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.missing
  const lbl = cfg.label[lang] || cfg.label.sq
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
      fontSize: 11.5, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {status === 'confirmed' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {status === 'review' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          <circle cx="12" cy="12" r="9"/>
        </svg>
      )}
      {status === 'missing' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
      {lbl}
    </span>
  )
}

/* ── Validity check for bulk confirm ────────────────────────── */
function isValidTariffCode(code: string): boolean {
  if (!code || !code.trim()) return false
  const clean = code.replace(/\s/g, '')
  if (clean === '0000000000' || clean === '00000000') return false
  if (clean.length < 8) return false
  if (!/^\d+$/.test(clean)) return false
  return true
}

/* ── Row issue computation ───────────────────────────────────── */
// Checks ALL mandatory fields for a row and returns the composite worst status.
// Priority: missing > review > confirmed > ok
interface RowIssue {
  field: string   // field name key
  labelSq: string
  labelEn: string
  type: 'missing' | 'review'
}

function computeRowIssues(item: InvoiceItem, packingListFound: boolean): RowIssue[] {
  const issues: RowIssue[] = []

  if (!item.qty || item.qty === 0) {
    issues.push({ field: 'qty', labelSq: 'Sasia mungon', labelEn: 'Quantity missing', type: 'missing' })
  }
  if (!item.totalValue || item.totalValue === 0) {
    issues.push({ field: 'totalValue', labelSq: 'Vlera totale mungon', labelEn: 'Total value missing', type: 'missing' })
  }
  if (!item.tariffCode) {
    issues.push({ field: 'tariffCode', labelSq: 'Kodi tarifor mungon', labelEn: 'Tariff code missing', type: 'missing' })
  } else if (item.status === 'review') {
    issues.push({ field: 'tariffCode', labelSq: 'Kodi tarifor për kontroll', labelEn: 'Tariff code needs review', type: 'review' })
  }
  // Only flag weight if packing list was found (otherwise we'd always show it for image-only PDFs)
  if (packingListFound && (!item.grossWeight || item.grossWeight === 0)) {
    issues.push({ field: 'grossWeight', labelSq: 'Pesha bruto mungon', labelEn: 'Gross weight missing', type: 'missing' })
  }
  if (packingListFound && (!item.packages || item.packages === 0)) {
    issues.push({ field: 'packages', labelSq: 'Paketime mungojnë', labelEn: 'Packages missing', type: 'missing' })
  }

  return issues
}

function getCompositeStatus(item: InvoiceItem, issues: RowIssue[]): 'missing' | 'review' | 'confirmed' | 'ok' {
  if (issues.some(i => i.type === 'missing')) return 'missing'
  if (issues.some(i => i.type === 'review'))  return 'review'
  if (item.status === 'confirmed')             return 'confirmed'
  return 'ok'
}

/* ── Bulk Confirm Dialog ─────────────────────────────────────── */
interface BulkDialogProps {
  lang: Language
  toConfirm: number
  missing: number
  invalid: number
  onCancel: () => void
  onConfirm: () => void
}
function BulkConfirmDialog({ lang, toConfirm, missing, invalid, onCancel, onConfirm }: BulkDialogProps) {
  const sq = lang === 'sq'
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel() }} style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="a-scale-in" style={{
        width: '100%', maxWidth: 460,
        background: 'var(--surface)', borderRadius: 18,
        border: '1px solid var(--border)', boxShadow: 'var(--sh-xl)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>
            {sq ? 'Konfirmo kodet e propozuara?' : 'Confirm proposed codes?'}
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--t3)', lineHeight: 1.5 }}>
            {sq
              ? 'Do të konfirmohen vetëm kodet tarifore me status "Për kontroll" që janë të vlefshme. Kodet që mungojnë ose janë të pavlefshme nuk do të konfirmohen.'
              : 'Only tariff codes with status "Review" that are valid will be confirmed. Missing or invalid codes will not be affected.'}
          </p>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: sq ? 'Kode për konfirmim' : 'Codes to confirm', value: toConfirm, color: 'var(--green)', ok: true },
            { label: sq ? 'Kode që mungojnë (nuk preken)' : 'Missing codes (not affected)', value: missing, color: 'var(--red)', ok: false },
            { label: sq ? 'Kode të pavlefshme (nuk preken)' : 'Invalid codes (not affected)', value: invalid, color: 'var(--amber)', ok: false },
          ].map(({ label, value, color, ok }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 14px', borderRadius: 10,
              background: ok ? 'var(--green-bg)' : 'var(--surface-2)',
              border: `1px solid ${ok ? 'var(--green-bdr)' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: ok ? 600 : 400 }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          padding: '14px 24px 20px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          borderTop: '1px solid var(--border)', background: 'var(--surface-2)',
        }}>
          <button onClick={onCancel} className="btn btn-ghost" style={{ height: 40 }}>
            {sq ? 'Anulo' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={toConfirm === 0}
            className="btn btn-primary"
            style={{ height: 40, gap: 7, opacity: toConfirm === 0 ? .5 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {sq ? `Konfirmo të gjitha (${toConfirm})` : `Confirm all (${toConfirm})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ItemsTable({ lang, items, onChange }: Props) {
  const sq = lang === 'sq'

  // View mode: simple shows key columns only, pro shows all
  type ViewMode = 'simple' | 'pro'
  const [viewMode, setViewMode]         = useState<ViewMode>('simple')

  // Filter state
  type FilterType = 'all' | 'missing' | 'review' | 'confirmed'
  const [filterStatus, setFilterStatus] = useState<FilterType>('all')
  const [showDialog, setShowDialog]     = useState(false)
  const [successMsg, setSuccessMsg]     = useState('')

  // Detect if packing list was found (any item has weight > 0)
  const packingListFound = items.some(i => i.grossWeight > 0)

  // Compute row issues for ALL items once
  const rowIssuesMap = Object.fromEntries(
    items.map(item => [item.id, computeRowIssues(item, packingListFound)])
  )

  // Composite status per row (reflects ALL field issues, not just tariffCode)
  const compositeStatus = (item: InvoiceItem) =>
    getCompositeStatus(item, rowIssuesMap[item.id] || [])

  // Counts for toolbar — use composite status
  const missingCount   = items.filter(i => compositeStatus(i) === 'missing').length
  const reviewCount    = items.filter(i => compositeStatus(i) === 'review').length
  const confirmedCount = items.filter(i => compositeStatus(i) === 'confirmed' || compositeStatus(i) === 'ok').length

  // Bulk confirm stats (preview for dialog)
  const bulkToConfirm  = items.filter(i => i.status === 'review' && isValidTariffCode(i.tariffCode) && i.descriptionEn).length
  const bulkMissing    = items.filter(i => !i.tariffCode || i.status === 'missing').length
  const bulkInvalid    = items.filter(i => i.status === 'review' && !isValidTariffCode(i.tariffCode)).length

  // Filtered items for display — use composite status
  const displayItems = items.map((item, idx) => ({ item, idx })).filter(({ item }) => {
    if (filterStatus === 'all') return true
    const cs = compositeStatus(item)
    if (filterStatus === 'missing') return cs === 'missing'
    if (filterStatus === 'review')  return cs === 'review'
    if (filterStatus === 'confirmed') return cs === 'confirmed' || cs === 'ok'
    return true
  })

  const updateItem = (idx: number, key: keyof InvoiceItem, value: unknown) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item
      const newItem = { ...item, [key]: value }
      // If tariffCode was changed on a confirmed item → revert to review
      if (key === 'tariffCode' && item.status === 'confirmed' && value !== item.tariffCode) {
        newItem.status = 'review'
        newItem.confirmedAt = undefined
      }
      return newItem
    })
    onChange(updated)
  }

  const confirmCode = (idx: number) => {
    const item = items[idx]
    if (!item.tariffCode || !isValidTariffCode(item.tariffCode)) return
    saveConfirmedCode(item.descriptionEn, item.tariffCode, item.customsRate, item.vatRate)
    onChange(items.map((it, i) => i === idx
      ? { ...it, status: 'confirmed' as const, confirmedAt: new Date().toISOString() }
      : it
    ))
  }

  const unconfirmCode = (idx: number) => {
    onChange(items.map((it, i) => i === idx
      ? { ...it, status: 'review' as const, confirmedAt: undefined }
      : it
    ))
  }

  const bulkConfirm = () => {
    const now = new Date().toISOString()
    let count = 0
    const updated = items.map(it => {
      if (it.status === 'review' && isValidTariffCode(it.tariffCode) && it.descriptionEn) {
        saveConfirmedCode(it.descriptionEn, it.tariffCode, it.customsRate, it.vatRate)
        count++
        return { ...it, status: 'confirmed' as const, confirmedAt: now }
      }
      return it
    })
    onChange(updated)
    setShowDialog(false)
    setSuccessMsg(sq ? `${count} kode tarifore u konfirmuan me sukses.` : `${count} tariff codes confirmed successfully.`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const addItem = () => {
    onChange([...items, {
      id: `item_${Date.now()}`,
      itemNo: String(items.length + 1),
      descriptionEn: '', descriptionSq: '',
      qty: 0, unit: 'PCS', unitPrice: 0, totalValue: 0,
      packages: 0, grossWeight: 0, netWeight: 0, volume: 0,
      tariffCode: '', customsRate: 10, vatRate: 18, status: 'missing',
    }])
  }

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  const cellClass   = 'px-2 py-1 text-sm'
  const inputClass  = 'w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400'
  const numInputClass = inputClass + ' text-right w-20'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Toolbar: filters + bulk confirm ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { key: 'all',       label: sq ? 'Të gjitha' : 'All',         count: items.length },
            { key: 'review',    label: sq ? 'Për kontroll' : 'Review',    count: reviewCount,    color: 'var(--amber)' },
            { key: 'missing',   label: sq ? 'Mungon' : 'Missing',         count: missingCount,   color: 'var(--red)' },
            { key: 'confirmed', label: sq ? 'I konfirmuar' : 'Confirmed',  count: confirmedCount, color: 'var(--green)' },
          ] as { key: FilterType; label: string; count: number; color?: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 8,
              border: `1.5px solid ${filterStatus === f.key ? (f.color || 'var(--blue)') : 'var(--border)'}`,
              background: filterStatus === f.key ? (f.key === 'all' ? 'var(--blue-50)' : f.key === 'review' ? 'var(--amber-bg)' : f.key === 'missing' ? 'var(--red-bg)' : 'var(--green-bg)') : 'var(--surface)',
              color: filterStatus === f.key ? (f.color || 'var(--blue)') : 'var(--t3)',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}>
              {f.label}
              {f.count > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 99, padding: '0 5px',
                  background: filterStatus === f.key ? (f.color || 'var(--blue)') : 'var(--surface-3)',
                  color: filterStatus === f.key ? '#fff' : 'var(--t4)',
                  fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['simple', 'pro'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${viewMode === mode ? 'var(--blue-200)' : 'var(--border)'}`,
              background: viewMode === mode ? 'var(--blue-50)' : 'var(--surface)',
              color: viewMode === mode ? 'var(--blue)' : 'var(--t3)',
            }}>
              {mode === 'simple' ? (sq ? 'Pamje e thjeshtë' : 'Simple') : (sq ? 'Pamje profesionale' : 'Pro')}
            </button>
          ))}
        </div>

        {/* Bulk confirm button */}
        {reviewCount > 0 && (
          <button
            onClick={() => setShowDialog(true)}
            className="btn btn-primary"
            style={{ height: 36, padding: '0 14px', fontSize: 13, gap: 6, background: 'var(--green)', boxShadow: '0 1px 4px rgba(5,150,105,.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#047857' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {sq ? `Konfirmo të gjitha kodet e propozuara (${reviewCount})` : `Confirm all proposed codes (${reviewCount})`}
          </button>
        )}
      </div>

      {/* ── Success toast ── */}
      {successMsg && (
        <div className="a-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 11,
          background: 'var(--green-bg)', border: '1px solid var(--green-bdr)',
          fontSize: 13, fontWeight: 600, color: 'var(--green)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ── Filter info ── */}
      {filterStatus !== 'all' && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--t4)' }}>
          {sq ? `Duke shfaqur ${displayItems.length} nga ${items.length} artikuj` : `Showing ${displayItems.length} of ${items.length} items`}
          {' · '}
          <button onClick={() => setFilterStatus('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, padding: 0, fontWeight: 600 }}>
            {sq ? 'Shfaq të gjitha' : 'Show all'}
          </button>
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          {/* Simple view: 7 key columns. Pro: all 15 columns */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">#</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Item No.</th>}
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-48">{sq ? 'Artikulli' : 'Article'}</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-40">{t(lang, 'table.descSq')}</th>}
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.qty')}</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-left font-semibold text-gray-600">{t(lang, 'table.unit')}</th>}
              {viewMode === 'pro' && <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.unitPrice')}</th>}
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.totalValue')}</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.packages')}</th>}
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{sq ? 'Pesha (kg)' : 'Weight (kg)'}</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.netWeight')}</th>}
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.tariffCode')}</th>
              {viewMode === 'pro' && <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.customsRate')}</th>}
              <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.vatRate')}</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600">{t(lang, 'table.status')}</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayItems.map(({ item, idx }) => {
              const issues     = rowIssuesMap[item.id] || []
              const cs         = getCompositeStatus(item, issues)
              const missingIss = issues.filter(i => i.type === 'missing')
              const reviewIss  = issues.filter(i => i.type === 'review')

              // Row background — driven by COMPOSITE status, not just tariff code status
              const rowBg = cs === 'missing' ? 'bg-red-50'
                          : cs === 'review'  ? 'bg-yellow-50'
                          : ''

              // Per-cell border: red for missing, orange for review
              // NEVER confuse the two — orange ≠ red for customs correctness
              const cellIssue    = (field: string) => issues.find(i => i.field === field)
              const cellHasIssue = (field: string) => !!cellIssue(field)
              const issueBorder  = (field: string) => {
                const iss = cellIssue(field)
                if (!iss) return ''
                return iss.type === 'missing' ? '1.5px solid var(--red)' : '1.5px solid var(--amber)'
              }

              const pro = viewMode === 'pro'
              return (
                <tr key={item.id} className={rowBg}>
                  <td className={cellClass + ' font-medium text-gray-500'}>{idx + 1}</td>
                  {pro && <td className={cellClass}><input className={inputClass + ' w-20'} value={item.itemNo} onChange={e => updateItem(idx, 'itemNo', e.target.value)} /></td>}
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' min-w-48'}
                      value={item.descriptionEn}
                      onChange={e => updateItem(idx, 'descriptionEn', e.target.value)}
                    />
                  </td>
                  {pro && <td className={cellClass}><input className={inputClass + ' min-w-40'} value={item.descriptionSq} onChange={e => updateItem(idx, 'descriptionSq', e.target.value)} /></td>}
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      style={{ outline: issueBorder('qty') }}
                      title={cellHasIssue('qty') ? (sq ? 'Sasia mungon' : 'Quantity missing') : undefined}
                      value={item.qty}
                      onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {pro && <td className={cellClass}><input className={inputClass + ' w-16'} value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} /></td>}
                  {pro && <td className={cellClass}><input type="number" className={numInputClass} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>}
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      style={{ outline: issueBorder('totalValue') }}
                      title={cellHasIssue('totalValue') ? (sq ? 'Vlera totale mungon' : 'Total value missing') : undefined}
                      value={item.totalValue}
                      onChange={e => updateItem(idx, 'totalValue', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {pro && (
                    <td className={cellClass}>
                      <input type="number" className={numInputClass} style={{ outline: issueBorder('packages') }}
                        title={cellHasIssue('packages') ? (sq ? 'Paketime mungojnë' : 'Packages missing') : undefined}
                        value={item.packages} onChange={e => updateItem(idx, 'packages', parseInt(e.target.value) || 0)} />
                    </td>
                  )}
                  <td className={cellClass}>
                    <input type="number" className={numInputClass}
                      style={{ outline: issueBorder('grossWeight') }}
                      title={cellHasIssue('grossWeight') ? (sq ? 'Pesha bruto mungon' : 'Gross weight missing') : undefined}
                      value={item.grossWeight}
                      onChange={e => updateItem(idx, 'grossWeight', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {pro && (
                    <td className={cellClass}>
                      <input type="number" className={numInputClass} value={item.netWeight}
                        onChange={e => updateItem(idx, 'netWeight', parseFloat(e.target.value) || 0)} />
                    </td>
                  )}
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' w-28'}
                      style={{ outline: issueBorder('tariffCode') }}
                      title={cellHasIssue('tariffCode') ? (sq ? 'Kodi tarifor mungon' : 'Tariff code missing') : undefined}
                      value={item.tariffCode}
                      onChange={e => updateItem(idx, 'tariffCode', e.target.value)}
                      placeholder={sq ? 'Shkruaj kodin' : 'Enter code'}
                    />
                  </td>
                  {pro && <td className={cellClass}><input type="number" className={numInputClass + ' w-16'} value={item.customsRate} onChange={e => updateItem(idx, 'customsRate', parseFloat(e.target.value) || 0)} /></td>}
                  {pro && <td className={cellClass}><input type="number" className={numInputClass + ' w-16'} value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', parseFloat(e.target.value) || 0)} /></td>}

                  {/* Status + Issue summary + Confirm button */}
                  <td className={cellClass} style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      {/* Composite status badge (reflects ALL field issues) */}
                      <StatusBadge status={cs} lang={lang} />

                      {/* Issue summary badge */}
                      {/* Issue labels: "Mungon: X" or "Për kontroll: X" per field */}
                      {missingIss.map(iss => (
                        <span key={iss.field} style={{ fontSize: 10.5, color: 'var(--red)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {sq ? `Mungon: ${iss.labelSq.replace(' mungon','').replace(' mungojnë','')}` : `Missing: ${iss.labelEn.replace(' missing','')}`}
                        </span>
                      ))}
                      {reviewIss.map(iss => (
                        <span key={iss.field} style={{ fontSize: 10.5, color: 'var(--amber)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {sq ? `Për kontroll: ${iss.labelSq.replace(' për kontroll','')}` : `Review: ${iss.labelEn.replace(' needs review','')}`}
                        </span>
                      ))}

                      {/* Confirm button: show for 'review' items that have a code */}
                      {item.status === 'review' && item.tariffCode && (
                        <button
                          onClick={() => confirmCode(idx)}
                          title={sq ? 'Konfirmo kodin tarifor' : 'Confirm tariff code'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                            border: '1px solid var(--green-bdr)', background: 'var(--green-bg)',
                            color: 'var(--green)', cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all .15s',
                          }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {sq ? 'Konfirmo' : 'Confirm'}
                        </button>
                      )}

                      {/* Unconfirm button: shown for confirmed items */}
                      {item.status === 'confirmed' && (
                        <button
                          onClick={() => unconfirmCode(idx)}
                          title={sq ? 'Kthe te "Për kontroll"' : 'Mark as needs review'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 600,
                            border: '1px solid var(--border)', background: 'var(--surface-3)',
                            color: 'var(--t4)', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {sq ? 'Çkonfirmo' : 'Unconfirm'}
                        </button>
                      )}

                      {/* Material note for items needing clarification */}
                      {item.requiresMaterial && item.status !== 'confirmed' && (
                        <span style={{
                          fontSize: 10, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {item.materialNote || (sq ? 'Specifikoni materialin' : 'Specify material')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Delete button */}
                  <td className={cellClass}>
                    <button
                      onClick={() => removeItem(idx)}
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--surface-3)', color: 'var(--t4)', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-bdr)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t4)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-sm text-gray-700">TOTAL</td>
                <td className="px-3 py-2 text-sm text-right">{items.reduce((s, i) => s + i.qty, 0).toFixed(0)}</td>
                <td></td>
                <td></td>
                <td className="px-3 py-2 text-sm text-right">{items.reduce((s, i) => s + i.totalValue, 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-right">{items.reduce((s, i) => s + i.packages, 0)}</td>
                <td className="px-3 py-2 text-sm text-right">{items.reduce((s, i) => s + i.grossWeight, 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-right">{items.reduce((s, i) => s + i.netWeight, 0).toFixed(2)}</td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        onClick={addItem}
        className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors"
      >
        + {t(lang, 'buttons.addItem')}
      </button>

      {/* Bulk Confirm Dialog */}
      {showDialog && (
        <BulkConfirmDialog
          lang={lang}
          toConfirm={bulkToConfirm}
          missing={bulkMissing}
          invalid={bulkInvalid}
          onCancel={() => setShowDialog(false)}
          onConfirm={bulkConfirm}
        />
      )}
    </div>
  )
}
