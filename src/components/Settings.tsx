'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { AppSettings, Language, TariffRule } from '@/types'
import { t, setLanguage } from '@/lib/i18n'
import { saveTariffRules } from '@/lib/tariffMapper'

const TariffSearch = dynamic(() => import('./TariffSearch'), { ssr: false })

interface Props {
  lang: Language
  settings: AppSettings
  tariffRules: TariffRule[]
  onSettingsChange: (s: AppSettings) => void
  onTariffRulesChange: (r: TariffRule[]) => void
  onClose: () => void
}

/* ── Icons (SVG only, zero emoji) ─────────────────────────── */
const IcoGear = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IcoTable = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
)
const IcoCode = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoGlobe = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IcoUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IcoKey = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IcoFile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ── Shared style helpers ──────────────────────────────────── */
const S = {
  section: { marginBottom: 28 } as React.CSSProperties,
  label: { display: 'block', fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: 'var(--t4)', marginBottom: 10 },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 700, color: 'var(--t2)', marginBottom: 12,
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    background: 'var(--surface)', color: 'var(--t1)',
    fontSize: 13.5, outline: 'none', transition: 'border-color .15s',
  } as React.CSSProperties,
  divider: { height: 1, background: 'var(--border)', margin: '24px 0' } as React.CSSProperties,
}

export default function Settings({ lang, settings, tariffRules, onSettingsChange, onTariffRulesChange, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'tariffs' | 'dev'>('general')
  const [newRule, setNewRule] = useState<Partial<TariffRule>>({ customsRate: 10, vatRate: 18 })
  const [showTarikSearch, setShowTarikSearch] = useState(false)
  const sq = lang === 'sq'

  const handleLangChange = (l: Language) => {
    setLanguage(l)
    onSettingsChange({ ...settings, language: l })
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

  const tabs = [
    { key: 'general' as const, icon: <IcoGear />, label: sq ? 'Gjeneral' : 'General' },
    { key: 'tariffs' as const, icon: <IcoTable />, label: sq ? 'Kode tarifore' : 'Tariff codes' },
    { key: 'dev'     as const, icon: <IcoCode />,  label: sq ? 'Zhvilluesi' : 'Developer' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      background: 'rgba(15,23,42,.55)',
      backdropFilter: 'blur(6px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="a-scale-in" style={{
        background: 'var(--surface)', borderRadius: 20,
        boxShadow: 'var(--sh-xl)',
        width: '100%', maxWidth: 780,
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}>

        {/* ── Modal header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--blue-50)', color: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IcoGear />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
                {t(lang, 'settings.title')}
              </h2>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)' }}>
                {sq ? 'Konfiguro preferencat e aplikacionit' : 'Configure application preferences'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface-3)',
            color: 'var(--t3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-bdr)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <IcoClose />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', gap: 2 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: active ? 'var(--blue)' : 'var(--t3)',
                borderBottom: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
                marginBottom: -1,
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--t2)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--t3)' }}
              >
                <span style={{ color: active ? 'var(--blue)' : 'var(--t4)', transition: 'color .15s' }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ════ GENERAL ════ */}
          {activeTab === 'general' && (
            <div>
              {/* Language */}
              <div style={S.section}>
                <div style={S.sectionTitle}>
                  <span style={{ color: 'var(--t4)' }}><IcoGlobe /></span>
                  {t(lang, 'settings.language')}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['sq', 'en'] as Language[]).map(l => {
                    const active = settings.language === l
                    return (
                      <button key={l} onClick={() => handleLangChange(l)} style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '10px 20px', borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                        background: active ? 'var(--blue-50)' : 'var(--surface)',
                        color: active ? 'var(--blue)' : 'var(--t2)',
                        fontWeight: 600, fontSize: 13.5,
                        transition: 'all .15s',
                        boxShadow: active ? '0 0 0 3px var(--blue-100)' : 'none',
                      }}>
                        {active && (
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'var(--blue)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <IcoCheck />
                          </span>
                        )}
                        <span style={{
                          width: 20, height: 14, borderRadius: 3, overflow: 'hidden', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 900, letterSpacing: '-.02em',
                          background: l === 'sq' ? '#E41E20' : '#012169',
                          color: '#fff',
                        }}>
                          {l === 'sq' ? 'AL' : 'EN'}
                        </span>
                        {l === 'sq' ? 'Shqip' : 'English'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={S.divider} />

              {/* ASCII toggle */}
              <div style={S.section}>
                <button
                  onClick={() => onSettingsChange({ ...settings, useAsciiForAsycuda: !settings.useAsciiForAsycuda })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', padding: '14px 16px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {/* Toggle switch */}
                  <div style={{
                    width: 44, height: 24, borderRadius: 99, flexShrink: 0,
                    background: settings.useAsciiForAsycuda ? 'var(--blue)' : 'var(--border-2)',
                    position: 'relative', transition: 'background .2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3,
                      left: settings.useAsciiForAsycuda ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      transition: 'left .2s var(--ease-out)',
                    }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>
                      {t(lang, 'labels.asciiMode')}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t4)' }}>
                      ë → e &nbsp;·&nbsp; ç → c &nbsp;·&nbsp; {sq ? 'rekomandohet për ASYCUDA' : 'recommended for ASYCUDA'}
                    </p>
                  </div>
                </button>
              </div>

              <div style={S.divider} />

              {/* Declarant */}
              <div style={S.section}>
                <div style={S.sectionTitle}>
                  <span style={{ color: 'var(--t4)' }}><IcoUser /></span>
                  {t(lang, 'settings.declarant')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: t(lang, 'settings.declarantCode'), key: 'declarantCode' as const },
                    { label: t(lang, 'settings.declarantName'), key: 'declarantName' as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label style={S.label}>{label}</label>
                      <input
                        className="field-input"
                        value={settings[key] || ''}
                        onChange={e => onSettingsChange({ ...settings, [key]: e.target.value })}
                        placeholder={key === 'declarantCode' ? '812402981' : 'DOGANOVA SH.P.K.'}
                        onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ TARIFFS ════ */}
          {activeTab === 'tariffs' && (
            <div>
              {/* TARIK full database search */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 14, marginBottom: 20,
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: 'var(--t1)' }}>
                    {sq ? 'TARIK 2025 — Baza e plotë e tarifave' : 'TARIK 2025 — Full tariff database'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t4)' }}>
                    {sq ? '9,299 kode tariforë · Dogana e Kosovës' : '9,299 tariff codes · Kosovo Customs'}
                  </p>
                </div>
                <button onClick={() => setShowTarikSearch(true)} className="btn btn-primary" style={{ height: 38, padding: '0 16px', gap: 7, fontSize: 13 }}>
                  <IcoSearch />
                  {sq ? 'Kërko kodin' : 'Search code'}
                </button>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t3)' }}>
                {sq ? 'Shto rregulla të reja për kodimin automatik tarifor.' : 'Add new rules for automatic tariff code assignment.'}
              </p>

              {/* Add new rule form */}
              <div style={{
                background: 'var(--blue-50)', border: '1px solid var(--blue-200)',
                borderRadius: 14, padding: 18, marginBottom: 20,
              }}>
                <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 13, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IcoPlus /> {sq ? 'Shto rregull të ri' : 'Add new rule'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {([
                    ['Fjala kyçe (p.sh. BACKPACK)', 'keyword', 'text'],
                    ['Pershkrimi anglisht', 'descriptionEn', 'text'],
                    ['Pershkrimi shqip', 'descriptionSq', 'text'],
                    ['Kodi tarifor', 'tariffCode', 'text'],
                    ['Dogana %', 'customsRate', 'number'],
                    ['TVSH %', 'vatRate', 'number'],
                  ] as [string, string, string][]).map(([label, key, type]) => (
                    <div key={key}>
                      <label style={{ ...S.label, color: 'var(--blue)' }}>{label}</label>
                      <input
                        type={type}
                        style={{ ...S.input, borderColor: 'var(--blue-200)', background: '#fff', fontSize: 13 }}
                        value={(newRule as Record<string, unknown>)[key] as string || ''}
                        onChange={e => setNewRule(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                        onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
                        onBlur={e => { e.target.style.borderColor = 'var(--blue-200)' }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRule}
                  className="btn btn-primary"
                  style={{ marginTop: 14, height: 38, padding: '0 16px', fontSize: 13, gap: 6 }}
                >
                  <IcoPlus /> {t(lang, 'buttons.addTariff')}
                </button>
              </div>

              {/* Rules table */}
              <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {['Fjala kyçe', 'Pershkrimi shqip', 'Kodi tarifor', 'Dogana', 'TVSH', ''].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tariffRules.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px', fontStyle: 'italic' }}>
                          {sq ? 'Nuk ka rregulla' : 'No rules added'}
                        </td>
                      </tr>
                    )}
                    {tariffRules.map(rule => (
                      <tr key={rule.id}>
                        <td style={{ fontWeight: 600 }}>{rule.keyword}</td>
                        <td style={{ color: 'var(--t3)' }}>{rule.descriptionSq}</td>
                        <td><code style={{ fontSize: 12, background: 'var(--surface-3)', padding: '2px 7px', borderRadius: 5, color: 'var(--t2)' }}>{rule.tariffCode}</code></td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{rule.customsRate}%</span></td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-gray">{rule.vatRate}%</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removeRule(rule.id)} style={{
                            width: 28, height: 28, borderRadius: 7,
                            border: '1px solid var(--border)', background: 'var(--surface-3)',
                            color: 'var(--t4)', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .15s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-bdr)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t4)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            <IcoTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ DEVELOPER ════ */}
          {activeTab === 'dev' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--amber-bg)', border: '1px solid var(--amber-bdr)',
              }}>
                <span style={{ color: 'var(--amber)', marginTop: 1 }}><IcoInfo /></span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--amber)' }}>
                    {sq ? 'Zona e zhvilluesit' : 'Developer area'}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
                    {sq ? 'Ky seksion është vetëm për konfigurim teknik.' : 'This section is for technical configuration only.'}
                  </p>
                </div>
              </div>

              {[
                {
                  icon: <IcoFile />,
                  title: sq ? 'Master Template' : 'Master Template',
                  lines: ['templates/asycuda-master-template.xml', 'templates/asycuda-item-template.xml'],
                },
                {
                  icon: <IcoKey />,
                  title: 'API Keys',
                  lines: ['OPENAI_API_KEY — .env.local'],
                },
                {
                  icon: <IcoInfo />,
                  title: sq ? 'Versioni' : 'Version',
                  lines: ['DUDI AI Generator v1.0.0'],
                },
              ].map(item => (
                <div key={item.title} style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--t4)' }}>{item.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</span>
                  </div>
                  {item.lines.map(line => (
                    <p key={line} style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t4)', fontFamily: 'monospace' }}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 24px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: 'var(--surface-2)',
        }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ height: 40 }}>
            {t(lang, 'buttons.cancel')}
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ height: 40, paddingLeft: 24, paddingRight: 24 }}>
            {t(lang, 'buttons.save')}
          </button>
        </div>
      </div>

      {/* ── TARIK full search modal (rendered on top of Settings) ── */}
      {showTarikSearch && (
        <TariffSearch
          lang={lang}
          onClose={() => setShowTarikSearch(false)}
        />
      )}
    </div>
  )
}
