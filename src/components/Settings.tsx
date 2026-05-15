'use client'
import { useState } from 'react'
import type { AppSettings, Language, TariffRule } from '@/types'
import { t, setLanguage } from '@/lib/i18n'
import { saveTariffRules } from '@/lib/tariffMapper'

interface Props {
  lang: Language
  settings: AppSettings
  tariffRules: TariffRule[]
  onSettingsChange: (s: AppSettings) => void
  onTariffRulesChange: (r: TariffRule[]) => void
  onClose: () => void
}

export default function Settings({ lang, settings, tariffRules, onSettingsChange, onTariffRulesChange, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'tariffs' | 'dev'>('general')
  const [newRule, setNewRule] = useState<Partial<TariffRule>>({ customsRate: 10, vatRate: 18 })

  const handleLangChange = (newLang: Language) => {
    setLanguage(newLang)
    onSettingsChange({ ...settings, language: newLang })
  }

  const addRule = () => {
    if (!newRule.keyword || !newRule.tariffCode) return
    const rule: TariffRule = {
      id: `rule_${Date.now()}`,
      keyword: newRule.keyword || '',
      descriptionEn: newRule.descriptionEn || '',
      descriptionSq: newRule.descriptionSq || '',
      tariffCode: newRule.tariffCode || '',
      customsRate: newRule.customsRate || 10,
      vatRate: newRule.vatRate || 18,
      notes: newRule.notes || '',
    }
    const updated = [...tariffRules, rule]
    saveTariffRules(updated)
    onTariffRulesChange(updated)
    setNewRule({ customsRate: 10, vatRate: 18 })
  }

  const removeRule = (id: string) => {
    const updated = tariffRules.filter(r => r.id !== id)
    saveTariffRules(updated)
    onTariffRulesChange(updated)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">⚙️ {t(lang, 'settings.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['general', 'tariffs', 'dev'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'general' ? '⚙️ Gjeneral' : tab === 'tariffs' ? '📋 ' + t(lang, 'settings.tariffCodes') : '🔧 ' + t(lang, 'settings.devArea')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Language */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3">🌐 {t(lang, 'settings.language')}</h3>
                <div className="flex gap-3">
                  {(['sq', 'en'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => handleLangChange(l)}
                      className={`px-6 py-3 rounded-xl font-medium border-2 transition-colors ${settings.language === l ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {l === 'sq' ? '🇦🇱 Shqip' : '🇬🇧 English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ASCII mode */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => onSettingsChange({ ...settings, useAsciiForAsycuda: !settings.useAsciiForAsycuda })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.useAsciiForAsycuda ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.useAsciiForAsycuda ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <span className="font-medium text-gray-700">{t(lang, 'labels.asciiMode')}</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-14">ë → e, ç → c (për ASYCUDA)</p>
              </div>

              {/* Declarant */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3">👤 {t(lang, 'settings.declarant')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">{t(lang, 'settings.declarantCode')}</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      value={settings.declarantCode}
                      onChange={e => onSettingsChange({ ...settings, declarantCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">{t(lang, 'settings.declarantName')}</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      value={settings.declarantName}
                      onChange={e => onSettingsChange({ ...settings, declarantName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tariffs' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Shto rregulla të reja për kodimin automatik tarifor.</p>

              {/* Add new */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-blue-800">+ Shto rregull të ri</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ['Fjala kyçe (BACKPACK)', 'keyword'],
                    ['Pershkrimi anglisht', 'descriptionEn'],
                    ['Pershkrimi shqip', 'descriptionSq'],
                    ['Kodi tarifor', 'tariffCode'],
                    ['Dogana %', 'customsRate'],
                    ['TVSH %', 'vatRate'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-600 mb-1 block">{label}</label>
                      <input
                        type={key.includes('Rate') ? 'number' : 'text'}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white"
                        value={(newRule as Record<string, unknown>)[key] as string || ''}
                        onChange={e => setNewRule(prev => ({ ...prev, [key]: key.includes('Rate') ? parseFloat(e.target.value) : e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRule}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
                >
                  + {t(lang, 'buttons.addTariff')}
                </button>
              </div>

              {/* Existing rules */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fjala kyçe', 'Pershkrimi shqip', 'Kodi tarifor', 'Dogana %', 'TVSH %', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tariffRules.map(rule => (
                      <tr key={rule.id}>
                        <td className="px-3 py-2 font-medium">{rule.keyword}</td>
                        <td className="px-3 py-2 text-gray-600">{rule.descriptionSq}</td>
                        <td className="px-3 py-2 font-mono">{rule.tariffCode}</td>
                        <td className="px-3 py-2 text-center">{rule.customsRate}%</td>
                        <td className="px-3 py-2 text-center">{rule.vatRate}%</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dev' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="font-bold text-yellow-800">🔧 Zona e zhvilluesit</p>
                <p className="text-sm text-yellow-700 mt-1">Ky seksion është vetëm për zhvillues. Përdoruesit normalë nuk kanë nevojë për këtë.</p>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-700">📁 Master Template</p>
                  <p className="text-sm text-gray-500 mt-1">templates/asycuda-master-template.xml</p>
                  <p className="text-sm text-gray-500">templates/asycuda-item-template.xml</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-700">🔑 API Keys</p>
                  <p className="text-sm text-gray-500 mt-1">OPENAI_API_KEY in .env.local</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-700">🌐 Versioni</p>
                  <p className="text-sm text-gray-500 mt-1">DUDI AI Generator v1.0.0</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            {t(lang, 'buttons.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
