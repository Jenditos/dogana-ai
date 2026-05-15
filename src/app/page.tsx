'use client'
import { useState, useEffect } from 'react'
import type { HeaderData, InvoiceItem, AsycudaPosition, MissingField, AppSettings, TariffRule, Language } from '@/types'
import { t, getLanguage } from '@/lib/i18n'
import { getTariffRules } from '@/lib/tariffMapper'
import { groupToAsycudaPositions } from '@/lib/groupPositions'
import { getMissingFields } from '@/lib/validationService'
import UploadZone from '@/components/UploadZone'
import HeaderForm from '@/components/HeaderForm'
import ItemsTable from '@/components/ItemsTable'
import ExportPanel from '@/components/ExportPanel'
import Settings from '@/components/Settings'
import VoiceInput from '@/components/VoiceInput'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'sq',
  useAsciiForAsycuda: true,
  declarantCode: '',
  declarantName: '',
  officeCode: '2048',
  officeName: 'DURRËS KONTIENER',
}

const STEPS = ['upload', 'review', 'generate'] as const
type Step = typeof STEPS[number]

const STATUS_BADGE: Record<string, { bg: string }> = {
  ok: { bg: 'bg-green-100 text-green-800' },
  missing: { bg: 'bg-red-100 text-red-800' },
  review: { bg: 'bg-yellow-100 text-yellow-800' },
  ready: { bg: 'bg-green-200 text-green-900' },
  draft: { bg: 'bg-gray-100 text-gray-600' },
}

export default function Home() {
  const [lang, setLang] = useState<Language>('sq')
  const [step, setStep] = useState<Step>('upload')
  const [activeTab, setActiveTab] = useState<'upload' | 'voice'>('upload')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([])
  const [finalStatus, setFinalStatus] = useState<string>('')

  const [header, setHeader] = useState<Partial<HeaderData>>({})
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [positions, setPositions] = useState<AsycudaPosition[]>([])
  const [missingFields, setMissingFields] = useState<MissingField[]>([])

  useEffect(() => {
    const savedLang = getLanguage()
    const savedSettings = localStorage.getItem('dudi_settings')
    if (savedLang) setLang(savedLang)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, language: savedLang })
      } catch {}
    }
    setTariffRules(getTariffRules())
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      const pos = groupToAsycudaPositions(items)
      setPositions(pos)
      setMissingFields(getMissingFields(header as HeaderData, items))
    }
  }, [items, header])

  const handleSettingsChange = (s: AppSettings) => {
    setSettings(s)
    setLang(s.language)
    localStorage.setItem('dudi_settings', JSON.stringify(s))
  }

  const handleFilesUpload = async (files: File[]) => {
    setLoading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      setHeader(data.header || {})
      setItems(data.items || [])
      setPositions(data.positions || [])
      setMissingFields(data.missingFields || [])
      setStep('review')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gabim gjatë leximit të dokumenteve')
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceExtracted = (data: Partial<HeaderData>) => {
    setHeader(prev => ({ ...prev, ...data }))
    if (step === 'upload') setStep('review')
  }

  const missingCount = missingFields.filter(m => m.status === 'missing').length
  const reviewCount = items.filter(i => i.status === 'review').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-black text-lg px-3 py-1 rounded-xl">DUDI</div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm leading-tight">{t(lang, 'app.title')}</h1>
              <p className="text-xs text-gray-500">{t(lang, 'app.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {finalStatus && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[finalStatus]?.bg || 'bg-gray-100'}`}>
                {t(lang, `status.${finalStatus}`)}
              </span>
            )}
            <button onClick={() => setShowSettings(true)} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-sm">
              ⚙️ {t(lang, 'buttons.settings')}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
          {[
            { key: 'upload', icon: '📤', label: t(lang, 'steps.upload') },
            { key: 'review', icon: '🔍', label: t(lang, 'steps.review') },
            { key: 'generate', icon: '⚙️', label: t(lang, 'steps.generate') },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setStep(key as Step)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {icon} {label}
              {key === 'review' && missingCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{missingCount}</span>
              )}
              {key === 'review' && reviewCount > 0 && missingCount === 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">{reviewCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">{t(lang, 'app.subtitle')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t(lang, 'app.description')}</p>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  📤 {t(lang, 'buttons.upload')}
                </button>
                <button onClick={() => setActiveTab('voice')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'voice' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  🎤 {t(lang, 'buttons.voice')}
                </button>
              </div>
              {activeTab === 'upload' && <UploadZone lang={lang} onFiles={handleFilesUpload} loading={loading} />}
              {activeTab === 'voice' && <VoiceInput lang={lang} onExtracted={handleVoiceExtracted} />}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            {items.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold text-blue-800">{t(lang, 'messages.extracted')}</p>
                  <p className="text-sm text-blue-600">{t(lang, 'messages.checkRed')}</p>
                </div>
              </div>
            )}
            {missingCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="font-bold text-red-700">⚠ {t(lang, 'messages.missingData')} ({missingCount})</p>
                <ul className="mt-2 space-y-1">
                  {missingFields.filter(m => m.status === 'missing').slice(0, 5).map((m, i) => (
                    <li key={i} className="text-sm text-red-600">• {m.problem}</li>
                  ))}
                  {missingCount > 5 && <li className="text-sm text-red-500">... dhe {missingCount - 5} të tjera</li>}
                </ul>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Të dhënat e dokumentit</h3>
              <HeaderForm lang={lang} data={header} onChange={setHeader} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {t(lang, 'labels.invoiceRows')} <span className="ml-2 text-sm text-gray-400 font-normal">({items.length} artikuj)</span>
              </h3>
              <ItemsTable lang={lang} items={items} onChange={setItems} />
            </div>
            {positions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t(lang, 'labels.asycudaPositions')} <span className="ml-2 text-sm text-gray-400 font-normal">({positions.length} pozicione)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Poz.', t(lang, 'table.tariffCode'), t(lang, 'table.descSq'), t(lang, 'table.qty'), t(lang, 'table.totalValue'), t(lang, 'table.grossWeight'), t(lang, 'table.packages'), t(lang, 'table.customsRate'), t(lang, 'table.vatRate'), t(lang, 'table.status')].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {positions.map(pos => (
                        <tr key={pos.positionNo} className={pos.status === 'missing' ? 'bg-red-50' : pos.status === 'review' ? 'bg-yellow-50' : ''}>
                          <td className="px-3 py-2 font-medium">{pos.positionNo}</td>
                          <td className="px-3 py-2 font-mono text-xs">{pos.tariffCode || <span className="text-red-500">⚠ Mungon</span>}</td>
                          <td className="px-3 py-2">{pos.descriptionSq}</td>
                          <td className="px-3 py-2 text-right">{pos.totalQty} {pos.unit}</td>
                          <td className="px-3 py-2 text-right font-medium">{pos.totalValue.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{pos.grossWeight.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{pos.packages}</td>
                          <td className="px-3 py-2 text-right">{pos.customsRate}%</td>
                          <td className="px-3 py-2 text-right">{pos.vatRate}%</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[pos.status]?.bg || 'bg-gray-100'}`}>
                              {t(lang, `status.${pos.status}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setStep('generate')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-lg">
                {t(lang, 'buttons.next')} →
              </button>
            </div>
          </div>
        )}

        {step === 'generate' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">⚙️ {t(lang, 'steps.generate')} / {t(lang, 'steps.download')}</h3>
            <ExportPanel lang={lang} header={header} items={items} positions={positions} missingFields={missingFields} settings={settings} onStatusChange={setFinalStatus} />
          </div>
        )}
      </main>

      {showSettings && (
        <Settings lang={lang} settings={settings} tariffRules={tariffRules} onSettingsChange={handleSettingsChange} onTariffRulesChange={setTariffRules} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
