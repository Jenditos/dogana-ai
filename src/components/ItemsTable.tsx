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

export default function ItemsTable({ lang, items, onChange }: Props) {
  const sq = lang === 'sq'

  const updateItem = (idx: number, key: keyof InvoiceItem, value: unknown) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
    )
    onChange(updated)
  }

  const confirmCode = (idx: number) => {
    const item = items[idx]
    if (!item.tariffCode) return
    // Save to persistent confirmed store
    saveConfirmedCode(item.descriptionEn, item.tariffCode, item.customsRate, item.vatRate)
    // Update item status
    const updated = items.map((it, i) => i === idx
      ? { ...it, status: 'confirmed' as const, confirmedAt: new Date().toISOString() }
      : it
    )
    onChange(updated)
  }

  const unconfirmCode = (idx: number) => {
    const updated = items.map((it, i) => i === idx
      ? { ...it, status: 'review' as const, confirmedAt: undefined }
      : it
    )
    onChange(updated)
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}`,
      itemNo: String(items.length + 1),
      descriptionEn: '',
      descriptionSq: '',
      qty: 0,
      unit: 'PCS',
      unitPrice: 0,
      totalValue: 0,
      packages: 0,
      grossWeight: 0,
      netWeight: 0,
      volume: 0,
      tariffCode: '',
      customsRate: 10,
      vatRate: 18,
      status: 'missing',
    }
    onChange([...items, newItem])
  }

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const cellClass = 'px-2 py-1 text-sm'
  const inputClass = 'w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400'
  const numInputClass = inputClass + ' text-right w-20'

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">#</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Item No.</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-48">{t(lang, 'table.descEn')}</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap min-w-40">{t(lang, 'table.descSq')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.qty')}</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">{t(lang, 'table.unit')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.unitPrice')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.totalValue')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.packages')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.grossWeight')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.netWeight')}</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t(lang, 'table.tariffCode')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.customsRate')}</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">{t(lang, 'table.vatRate')}</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600">{t(lang, 'table.status')}</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const rowBg = item.status === 'missing' ? 'bg-red-50' : item.status === 'review' ? 'bg-yellow-50' : ''
              return (
                <tr key={item.id} className={rowBg}>
                  <td className={cellClass + ' font-medium text-gray-500'}>{idx + 1}</td>
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' w-20'}
                      value={item.itemNo}
                      onChange={e => updateItem(idx, 'itemNo', e.target.value)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' min-w-48'}
                      value={item.descriptionEn}
                      onChange={e => updateItem(idx, 'descriptionEn', e.target.value)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' min-w-40'}
                      value={item.descriptionSq}
                      onChange={e => updateItem(idx, 'descriptionSq', e.target.value)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.qty}
                      onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' w-16'}
                      value={item.unit}
                      onChange={e => updateItem(idx, 'unit', e.target.value)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.totalValue}
                      onChange={e => updateItem(idx, 'totalValue', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.packages}
                      onChange={e => updateItem(idx, 'packages', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.grossWeight}
                      onChange={e => updateItem(idx, 'grossWeight', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass}
                      value={item.netWeight}
                      onChange={e => updateItem(idx, 'netWeight', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      className={inputClass + ' w-28'}
                      value={item.tariffCode}
                      onChange={e => updateItem(idx, 'tariffCode', e.target.value)}
                      placeholder="0000000000"
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass + ' w-16'}
                      value={item.customsRate}
                      onChange={e => updateItem(idx, 'customsRate', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className={cellClass}>
                    <input
                      type="number"
                      className={numInputClass + ' w-16'}
                      value={item.vatRate}
                      onChange={e => updateItem(idx, 'vatRate', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  {/* Status + Confirm button */}
                  <td className={cellClass} style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <StatusBadge status={item.status} lang={lang} />

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
    </div>
  )
}
