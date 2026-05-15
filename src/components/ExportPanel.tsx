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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-gray-800 text-lg">{t(lang, 'labels.exportSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            [t(lang, 'labels.exporter'), header.exporterName],
            [t(lang, 'labels.importer'), header.importerName],
            [t(lang, 'labels.invoice'), header.invoiceNumber],
            [t(lang, 'labels.date'), header.invoiceDate],
            [t(lang, 'labels.container'), header.containerNumber],
            [t(lang, 'labels.origin'), header.countryOfOrigin],
            [t(lang, 'labels.totalValue'), `${header.totalInvoice?.toFixed(2) || 0} ${header.currency || ''}`],
            [t(lang, 'labels.totalWeight'), `${header.totalGrossWeight || 0} kg`],
            [t(lang, 'labels.packages'), header.totalPackages || 0],
            [t(lang, 'labels.positions'), positions.length],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`font-semibold text-sm ${!value ? 'text-red-500 italic' : 'text-gray-800'}`}>
                {value || '⚠ Mungon'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-red-700">⚠ {t(lang, 'messages.missingData')}</p>
          {(errors as { message: string }[]).map((e, i) => (
            <p key={i} className="text-sm text-red-600">• {e.message}</p>
          ))}
          {requiresDraft && (
            <button
              onClick={() => generateXml(true)}
              className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              {t(lang, 'buttons.createDraft')}
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-yellow-700">⚠ Paralajmërime</p>
          {(warnings as { message: string }[]).map((w, i) => (
            <p key={i} className="text-sm text-yellow-700">• {w.message}</p>
          ))}
        </div>
      )}

      {/* Old values warning */}
      {oldValues.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="font-bold text-orange-700">⚠ {t(lang, 'messages.oldDataFound')}</p>
          {(oldValues as { oldValue: string }[]).map((v, i) => (
            <p key={i} className="text-sm text-orange-600">• {v.oldValue}</p>
          ))}
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`border rounded-2xl p-4 text-center font-bold text-lg ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ''}`}>
          {t(lang, `status.${status}`)}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => generateXml(false)}
          disabled={!hasData || loading === 'xml'}
          className="col-span-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-5 px-6 rounded-2xl text-xl transition-colors flex items-center justify-center gap-3"
        >
          {loading === 'xml' ? '⏳ ' + t(lang, 'messages.validating') : '🔧 ' + t(lang, 'buttons.generate')}
        </button>

        {xml && (
          <>
            <button
              onClick={downloadXml}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              📥 {t(lang, 'buttons.downloadXml')}
            </button>
            <button
              onClick={() => setShowXml(!showXml)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
            >
              👁 {showXml ? 'Fshih XML' : 'Shiko XML'}
            </button>
          </>
        )}

        <button
          onClick={downloadCsv}
          disabled={!hasData || loading === 'csv'}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading === 'csv' ? '⏳' : '📊'} {t(lang, 'buttons.downloadCsv')}
        </button>

        <button
          onClick={downloadExcel}
          disabled={!hasData || loading === 'excel'}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading === 'excel' ? '⏳' : '📗'} {t(lang, 'buttons.downloadExcel')}
        </button>
      </div>

      {/* XML Preview */}
      {showXml && xml && (
        <div className="bg-gray-900 rounded-2xl p-4 overflow-auto max-h-96">
          <pre className="text-green-400 text-xs whitespace-pre-wrap">{xml}</pre>
        </div>
      )}
    </div>
  )
}
