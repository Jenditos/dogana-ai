'use client'
import { useState } from 'react'
import type { InvoiceItem, Language } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  items: InvoiceItem[]
  onChange: (items: InvoiceItem[]) => void
}

const STATUS_BADGE: Record<string, string> = {
  ok: 'bg-green-100 text-green-800',
  missing: 'bg-red-100 text-red-800',
  review: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-200 text-green-900',
  draft: 'bg-gray-100 text-gray-600',
}

export default function ItemsTable({ lang, items, onChange }: Props) {
  const updateItem = (idx: number, key: keyof InvoiceItem, value: unknown) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
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
                  <td className={cellClass + ' text-center'}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[item.status]}`}>
                      {t(lang, `status.${item.status}`)}
                    </span>
                  </td>
                  <td className={cellClass}>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600"
                    >✕</button>
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
