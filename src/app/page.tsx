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
import CameraCapture from '@/components/CameraCapture'

/* ─── SVG Icons ──────────────────────────────────────────────── */
const IcoUpload = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)
const IcoCamera = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const IcoMic = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 8 6.5 12 13.5 4"/>
  </svg>
)
const IcoArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="8" x2="13" y2="8"/><polyline points="9 4 13 8 9 12"/>
  </svg>
)
const IcoSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IcoFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoSpinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin" style={{ opacity: .8 }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

/* ─── Step Indicator ─────────────────────────────────────────── */
type Step = 'upload' | 'review' | 'generate'

function StepIndicator({ step, lang, missingCount, onClick }: {
  step: Step; lang: Language; missingCount: number; onClick: (s: Step) => void
}) {
  const steps: { key: Step; label: string }[] = [
    { key: 'upload',   label: lang === 'sq' ? 'Ngarko' : 'Upload' },
    { key: 'review',   label: lang === 'sq' ? 'Kontrollo' : 'Review' },
    { key: 'generate', label: lang === 'sq' ? 'Gjenero XML' : 'Generate XML' },
  ]
  const idx = steps.findIndex(s => s.key === step)

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center gap-0">
        {steps.map((s, i) => {
          const done   = i < idx
          const active = i === idx
          return (
            <div key={s.key} className="flex items-center">
              {i > 0 && (
                <div style={{
                  width: 60, height: 1,
                  background: done ? 'var(--blue)' : 'var(--border-2)',
                  transition: 'background .3s',
                  marginBottom: 20
                }} />
              )}
              <button
                onClick={() => onClick(s.key)}
                className="flex flex-col items-center gap-1.5"
                style={{ cursor: 'pointer', border: 'none', background: 'none', padding: '0 12px' }}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                  transition: 'all .25s var(--ease-out)',
                  background: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--surface)',
                  color: done || active ? '#fff' : 'var(--t4)',
                  border: done || active ? 'none' : '2px solid var(--border-2)',
                  boxShadow: active ? '0 0 0 4px var(--blue-100)' : 'none',
                }}>
                  {done ? <IcoCheck /> : i + 1}
                  {s.key === 'review' && missingCount > 0 && !done && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--red)', color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{missingCount > 9 ? '9+' : missingCount}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 11.5, fontWeight: 600, letterSpacing: '.01em',
                  color: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--t4)',
                  transition: 'color .25s',
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Action Card ────────────────────────────────────────────── */
function ActionCard({ icon, title, desc, active, onClick }: {
  icon: React.ReactNode; title: string; desc: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        width: '100%', padding: '18px 20px',
        background: active ? 'var(--blue-50)' : 'var(--surface)',
        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: 16, cursor: 'pointer', textAlign: 'left',
        transition: 'all .18s var(--ease-out)',
        boxShadow: active ? '0 0 0 3px var(--blue-100)' : 'var(--sh-xs)',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget
          el.style.borderColor = 'var(--blue-200)'
          el.style.boxShadow = 'var(--sh-md)'
          el.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget
          el.style.borderColor = 'var(--border)'
          el.style.boxShadow = 'var(--sh-xs)'
          el.style.transform = 'translateY(0)'
        }
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--blue)' : 'var(--surface-3)',
        color: active ? '#fff' : 'var(--t3)',
        transition: 'all .18s',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 650, fontSize: 14.5, color: 'var(--t1)', lineHeight: 1.3 }}>
          {title}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.4 }}>
          {desc}
        </p>
      </div>
      <div style={{ color: active ? 'var(--blue)' : 'var(--t4)', flexShrink: 0, transition: 'color .18s' }}>
        <IcoArrowRight />
      </div>
    </button>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ value, label, subtitle, color = 'blue' }: {
  value: string | number
  label: string
  subtitle?: string
  color?: string
}) {
  const colors: Record<string, [string, string, string]> = {
    blue:  ['var(--blue-50)',  'var(--blue)',  'var(--blue-200)'],
    green: ['var(--green-bg)', 'var(--green)', 'var(--green-bdr)'],
    amber: ['var(--amber-bg)', 'var(--amber)', 'var(--amber-bdr)'],
    red:   ['var(--red-bg)',   'var(--red)',   'var(--red-bdr)'],
    gray:  ['var(--surface-3)','var(--t3)',    'var(--border)'],
  }
  const [bg, fg, bdr] = colors[color] || colors.gray
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${color === 'gray' ? 'var(--border)' : bdr}`,
      borderRadius: 16, padding: '16px 18px',
      boxShadow: 'var(--sh-xs)', flex: '1 1 0', minWidth: 140,
      borderTop: `3px solid ${fg}`,
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: fg, lineHeight: 1 }}>{value}</div>
      <div style={{
        marginTop: 5, fontSize: 11, fontWeight: 700,
        color: 'var(--t2)', letterSpacing: '.05em', textTransform: 'uppercase',
        lineHeight: 1.3,
      }}>{label}</div>
      {subtitle && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--t4)', lineHeight: 1.4 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

/* ─── Trust Chip ─────────────────────────────────────────────── */
function TrustChip({ label }: { label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 99,
      background: 'var(--surface)', border: '1px solid var(--border)',
      fontSize: 12, fontWeight: 500, color: 'var(--t3)',
      boxShadow: 'var(--sh-xs)',
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        background: 'var(--green-bg)', color: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IcoCheck />
      </span>
      {label}
    </div>
  )
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'sq', useAsciiForAsycuda: true,
  declarantCode: '', declarantName: '',
  officeCode: '2048', officeName: 'DURRËS KONTIENER',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  ok: 'badge badge-green', missing: 'badge badge-red',
  review: 'badge badge-amber', ready: 'badge badge-green', draft: 'badge badge-gray',
}

/* ── Extraction Error Card — replaces alert() ────────────────── */
function ExtractErrorCard({
  lang, message, technical, onRetry,
}: { lang: Language; message: string; technical?: string; onRetry: () => void }) {
  const [showTech, setShowTech] = useState(false)
  const sq = lang === 'sq'
  return (
    <div style={{
      background: 'var(--red-bg)', border: '1px solid var(--red-bdr)',
      borderRadius: 14, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--red)', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onRetry} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 9, border: '1px solid var(--red-bdr)',
          background: '#fff', color: 'var(--red)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          {sq ? 'Provo përsëri' : 'Try again'}
        </button>
        {technical && (
          <button onClick={() => setShowTech(v => !v)} style={{
            padding: '7px 14px', borderRadius: 9, border: '1px solid var(--red-bdr)',
            background: 'transparent', color: 'var(--red)', fontSize: 12.5, cursor: 'pointer',
          }}>
            {showTech ? (sq ? 'Fshih detajet' : 'Hide details') : (sq ? 'Detaje teknike' : 'Technical details')}
          </button>
        )}
      </div>
      {showTech && technical && (
        <pre style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 8,
          background: 'rgba(220,38,38,.08)', color: 'var(--red)',
          fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{technical}</pre>
      )}
    </div>
  )
}

export default function Home() {
  const [lang, setLang]               = useState<Language>('sq')
  const [step, setStep]               = useState<Step>('upload')
  const [activeAction, setActiveAction] = useState<'upload' | 'voice' | 'camera' | null>('upload')
  const [showCamera, setShowCamera]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [extractError, setExtractError] = useState<{ msg: string; tech?: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAsycuda, setShowAsycuda] = useState(false)          // collapsed by default
  const [expandedPos, setExpandedPos] = useState<number | null>(null) // source rows per position
  const [settings, setSettings]       = useState<AppSettings>(DEFAULT_SETTINGS)
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([])
  const [finalStatus, setFinalStatus] = useState<string>('')

  const [header, setHeader]           = useState<Partial<HeaderData>>({})
  const [items, setItems]             = useState<InvoiceItem[]>([])
  const [positions, setPositions]     = useState<AsycudaPosition[]>([])
  const [missingFields, setMissingFields] = useState<MissingField[]>([])

  // cameraRef removed — using CameraCapture modal instead

  useEffect(() => {
    const savedLang = getLanguage()
    const savedSettings = localStorage.getItem('dudi_settings')
    if (savedLang) setLang(savedLang)
    if (savedSettings) {
      try {
        const p = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...p, language: savedLang })
      } catch {}
    }
    setTariffRules(getTariffRules())
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      setPositions(groupToAsycudaPositions(items))
      setMissingFields(getMissingFields(header as HeaderData, items))
    }
  }, [items, header])

  const handleSettingsChange = (s: AppSettings) => {
    setSettings(s); setLang(s.language)
    localStorage.setItem('dudi_settings', JSON.stringify(s))
  }

  const handleFilesUpload = async (files: File[]) => {
    setLoading(true)
    setExtractError(null)
    setLoadingStep(sq ? 'Duke ngarkuar dokumentet...' : 'Uploading documents...')
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))

      setLoadingStep(sq ? 'Duke lexuar dokumentet...' : 'Reading documents...')
      const res  = await fetch('/api/extract', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Extraction failed')

      setLoadingStep(sq ? 'Duke nxjerrë të dhënat...' : 'Extracting data...')
      setHeader(data.header || {})
      setItems(data.items || [])
      setPositions(data.positions || [])
      setMissingFields(data.missingFields || [])
      setStep('review')
    } catch (err) {
      const technical = err instanceof Error ? err.message : String(err)
      console.error('[Upload] extraction failed:', technical)
      setExtractError({
        msg: lang === 'sq'
          ? 'Dokumenti nuk mund të lexohej. Ju lutem provoni përsëri ose ngarkoni një format tjetër.'
          : 'The document could not be read. Please try again or upload a different format.',
        tech: technical,
      })
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleVoiceExtracted = (data: Partial<HeaderData>) => {
    setHeader(prev => ({ ...prev, ...data }))
    setStep('review')
  }

  // 'missing' = field is completely empty — must be filled before export
  // 'review'  = field has a value (auto-suggested) — needs human confirmation
  // A field cannot be both: review items have a tariffCode, missing items don't
  const missingCount = missingFields.filter(m => m.status === 'missing').length
  const reviewCount  = items.filter(i => i.status === 'review').length   // has code, needs confirm
  const okCount      = items.filter(i => i.status === 'ok').length
  const sq = lang === 'sq'

  /* ── trust chips data ── */
  const trustChips = sq
    ? ['Strukturë ASYCUDA', 'Kontroll i shumave', 'Përshkrim shqip', 'Eksport XML, CSV, Excel']
    : ['ASYCUDA Structure', 'Sum validation', 'Albanian description', 'Export XML, CSV, Excel']

  /* ── Positions table badge ── */
  const posBadge = (status: string) => {
    if (status === 'ok' || status === 'ready') return 'badge badge-green'
    if (status === 'review') return 'badge badge-amber'
    if (status === 'missing') return 'badge badge-red'
    return 'badge badge-gray'
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #1B50D8 0%, #4B7BF5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(27,80,216,.35)',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1 }}>D</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--t1)', letterSpacing: '-.01em', lineHeight: 1.2 }}>
                DUDI AI Generator
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)', letterSpacing: '.01em' }}>
                {sq ? 'Krijo XML për ASYCUDA' : 'Create XML for ASYCUDA'}
              </p>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'var(--green-bg)', border: '1px solid var(--green-bdr)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} className="a-blink" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{sq ? 'Sistemi gati' : 'System ready'}</span>
            </div>
            {finalStatus && (
              <span className={STATUS_BADGE_CLASS[finalStatus] || 'badge badge-gray'}>
                {t(lang, `status.${finalStatus}`)}
              </span>
            )}
            <button onClick={() => setShowSettings(true)} className="btn btn-ghost" style={{ height: 38, padding: '0 14px', gap: 7 }}>
              <IcoSettings />
              <span>{sq ? 'Konfigurimet' : 'Settings'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Step Indicator ──────────────────────────────────── */}
      <StepIndicator step={step} lang={lang} missingCount={missingCount} onClick={setStep} />

      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ══════════ STEP 1: Upload ══════════ */}
        {step === 'upload' && (
          <div style={{ maxWidth: 620, margin: '0 auto' }} className="a-fade-up">

            {/* Hero card */}
            <div className="card" style={{ padding: '36px 40px 32px', marginBottom: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.02em', lineHeight: 1.2 }}>
                  {sq ? 'Krijo DUDI XML për ASYCUDA' : 'Create DUDI XML for ASYCUDA'}
                </h1>
                <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--t3)', lineHeight: 1.6 }}>
                  {sq
                    ? 'Ngarko faturën, packing list, CMR ose EUR.1. Sistemi i lexon automatikisht dhe përgatit XML për ASYCUDA.'
                    : 'Upload invoice, packing list, CMR or EUR.1. The system reads them automatically and prepares the ASYCUDA XML.'}
                </p>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '0 0 24px' }} />

              {/* Action cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ActionCard
                  icon={<IcoUpload />}
                  title={sq ? 'Ngarko dokumente' : 'Upload documents'}
                  desc={sq ? 'Ngarko PDF, foto ose dokumente doganore.' : 'Upload PDF, photos or customs documents.'}
                  active={activeAction === 'upload'}
                  onClick={() => setActiveAction(a => a === 'upload' ? null : 'upload')}
                />
                <ActionCard
                  icon={<IcoCamera />}
                  title={sq ? 'Bëj foto' : 'Take photo'}
                  desc={sq ? 'Fotografo dokumentet direkt nga pajisja.' : 'Photograph documents directly from your device.'}
                  active={activeAction === 'camera'}
                  onClick={() => { setActiveAction('camera'); setShowCamera(true) }}
                />
                <ActionCard
                  icon={<IcoMic />}
                  title={sq ? 'Fol me zë' : 'Speak'}
                  desc={sq ? 'Shto ose korrigjo të dhënat me komandë zanore.' : 'Add or correct data with voice command.'}
                  active={activeAction === 'voice'}
                  onClick={() => setActiveAction(a => a === 'voice' ? null : 'voice')}
                />
              </div>

              {/* Camera modal trigger — handled by CameraCapture component */}
            </div>

            {/* Upload zone (conditional) */}
            {activeAction === 'upload' && (
              <div className="a-slide-down" style={{ marginBottom: 20 }}>
                <UploadZone lang={lang} onFiles={handleFilesUpload} loading={loading} loadingStep={loadingStep} />
              </div>
            )}

            {/* ── Extraction Error Card (replaces alert()) ─────── */}
            {extractError && (
              <div className="a-fade-in" style={{ marginBottom: 20 }}>
                <ExtractErrorCard
                  lang={lang}
                  message={extractError.msg}
                  technical={extractError.tech}
                  onRetry={() => setExtractError(null)}
                />
              </div>
            )}

            {/* Voice input (conditional) */}
            {activeAction === 'voice' && (
              <div className="card a-slide-down" style={{ padding: 28, marginBottom: 20 }}>
                <VoiceInput lang={lang} onExtracted={handleVoiceExtracted} />
              </div>
            )}

            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {trustChips.map(chip => <TrustChip key={chip} label={chip} />)}
            </div>
          </div>
        )}

        {/* ══════════ STEP 2: Review ══════════ */}
        {step === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="a-fade-up">

            {/* Stats row */}
            {items.length > 0 && (
              <div className="a-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <StatCard
                    value={items.length}
                    label={sq ? 'Artikuj të lexuar' : 'Items read'}
                    subtitle={sq ? 'Nga dokumenti' : 'From document'}
                    color="blue"
                  />
                  <StatCard
                    value={positions.length}
                    label={sq ? 'Pozicione ASYCUDA' : 'ASYCUDA positions'}
                    subtitle={sq ? 'Grupe sipas kodit tarifor' : 'Grouped by tariff code'}
                    color="green"
                  />
                  <StatCard
                    value={missingCount}
                    label={sq ? 'Të dhëna mungojnë' : 'Data missing'}
                    subtitle={sq ? 'Duhet të plotësohen para eksportit' : 'Must be filled before export'}
                    color={missingCount > 0 ? 'red' : 'green'}
                  />
                  <StatCard
                    value={reviewCount}
                    label={sq ? 'Të dhëna për kontroll' : 'Data to review'}
                    subtitle={sq ? 'Janë gjetur, por duhet verifikuar' : 'Found, but should be verified'}
                    color={reviewCount > 0 ? 'amber' : 'green'}
                  />
                </div>

                {/* Legend — always shown when there's something to explain */}
                {(missingCount > 0 || reviewCount > 0) && (
                  <div style={{
                    display: 'flex', gap: 20, flexWrap: 'wrap',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--t3)', lineHeight: 1.5,
                  }}>
                    {missingCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                        <strong style={{ color: 'var(--t2)' }}>{sq ? '"Mungon"' : '"Missing"'}</strong>
                        {sq ? ' = fusha është bosh dhe obligative.' : ' = field is empty and required.'}
                      </span>
                    )}
                    {reviewCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                        <strong style={{ color: 'var(--t2)' }}>{sq ? '"Për kontroll"' : '"Review"'}</strong>
                        {sq ? ' = vlera është propozuar automatikisht, por duhet verifikuar.' : ' = value was auto-suggested, please verify.'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info banner */}
            {items.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
                background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 14,
              }}>
                <span style={{ color: 'var(--blue)', marginTop: 1, flexShrink: 0 }}><IcoInfo /></span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: 'var(--blue)' }}>
                    {t(lang, 'messages.extracted')}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
                    {t(lang, 'messages.checkRed')}
                  </p>
                </div>
              </div>
            )}

            {/* Missing fields alert */}
            {missingCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
                background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 14,
              }}>
                <span style={{ color: 'var(--red)', marginTop: 1, flexShrink: 0 }}><IcoAlert /></span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: 'var(--red)' }}>
                    {t(lang, 'messages.missingData')} ({missingCount})
                  </p>
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {missingFields.filter(m => m.status === 'missing').slice(0, 5).map((m, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', flexShrink: 0 }} />
                        {m.problem}
                      </li>
                    ))}
                    {missingCount > 5 && <li style={{ fontSize: 12, color: 'var(--t3)' }}>+ {missingCount - 5} {sq ? 'të tjera' : 'more'}</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Header data card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                  <IcoFile />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: 'var(--t1)' }}>
                    {sq ? 'Të dhënat e dokumentit' : 'Document data'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--t4)' }}>
                    {sq ? 'Kontrolloni dhe korrigjoni nëse nevojitet' : 'Review and correct if needed'}
                  </p>
                </div>
              </div>
              <HeaderForm lang={lang} data={header} onChange={setHeader} />
            </div>

            {/* ── STEP A: Invoice rows (primary, editable) ─────────── */}
            <div className="card" style={{ padding: 28 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: 'var(--t1)' }}>
                        {sq ? 'Rreshtat e faturës' : 'Invoice rows'}
                      </h3>
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: 'var(--blue-50)', color: 'var(--blue)', fontSize: 12, fontWeight: 700, border: '1px solid var(--blue-200)' }}>
                        {items.length}
                      </span>
                      <span style={{
                        padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: 'rgba(5,150,105,.08)', color: 'var(--green)',
                        border: '1px solid var(--green-bdr)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {sq ? 'E modifikueshme' : 'Editable'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--t4)' }}>
                      {sq
                        ? 'Kontrollo të dhënat e lexuara nga fatura. Këto janë rreshtat origjinalë të dokumentit.'
                        : 'Review data extracted from the invoice. These are the original document rows.'}
                    </p>
                  </div>
                </div>
              </div>
              <ItemsTable lang={lang} items={items} onChange={setItems} />
            </div>

            {/* ── STEP B: ASYCUDA positions (derived, read-only) ───── */}
            {positions.length > 0 && (() => {
              // Stats for the summary card
              const mergedCount   = items.length - positions.length
              const totalVal      = positions.reduce((s, p) => s + p.totalValue, 0)
              const totalWgt      = positions.reduce((s, p) => s + p.grossWeight, 0)
              const allOk         = positions.every(p => p.status === 'ok' || p.status === 'ready')
              const hasUncertain  = positions.some(p => p.status === 'review')

              // Map tariff code → source items
              const sourceMap: Record<string, typeof items> = {}
              for (const item of items) {
                const key = item.tariffCode || `NO_CODE_${item.id}`
                if (!sourceMap[key]) sourceMap[key] = []
                sourceMap[key].push(item)
              }

              return (
                <div>
                  {/* Summary card — always visible */}
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: '18px 22px', marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                            </svg>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>
                            {sq ? 'Pozicionet ASYCUDA' : 'ASYCUDA Positions'}
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--t3)', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--border)' }}>
                            {sq ? 'Vetëm lexim' : 'Read-only'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--t4)', maxWidth: 480, lineHeight: 1.5 }}>
                          {sq
                            ? 'Këto pozicione krijohen automatikisht nga rreshtat e faturës dhe përdoren për XML. Nëse ndrysho rreshtat, këto ricaktohen vetë.'
                            : 'These positions are automatically calculated from invoice rows and used for the XML. Editing rows above recalculates this instantly.'}
                        </p>
                      </div>
                      {/* Status indicator */}
                      <div style={{
                        padding: '8px 14px', borderRadius: 10,
                        background: allOk ? 'var(--green-bg)' : hasUncertain ? 'var(--amber-bg)' : 'var(--red-bg)',
                        border: `1px solid ${allOk ? 'var(--green-bdr)' : hasUncertain ? 'var(--amber-bdr)' : 'var(--red-bdr)'}`,
                        fontSize: 12.5, fontWeight: 700,
                        color: allOk ? 'var(--green)' : hasUncertain ? 'var(--amber)' : 'var(--red)',
                        flexShrink: 0, textAlign: 'center',
                      }}>
                        {allOk
                          ? (sq ? 'Gati për XML' : 'Ready for XML')
                          : hasUncertain
                            ? (sq ? 'Disa kode tariforë për kontroll' : 'Some tariff codes need review')
                            : (sq ? 'Kode tariforë mungojnë' : 'Tariff codes missing')}
                      </div>
                    </div>

                    {/* 4-number summary */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                      {[
                        { label: sq ? 'Rreshta fature' : 'Invoice rows',     value: items.length,                   color: 'var(--blue)' },
                        { label: sq ? 'Pozicione ASYCUDA' : 'ASYCUDA pos.',  value: positions.length,               color: 'var(--green)' },
                        { label: sq ? 'Rreshta të bashkuara' : 'Rows merged', value: mergedCount > 0 ? mergedCount : '—', color: 'var(--amber)' },
                        { label: sq ? 'Vlera totale' : 'Total value',         value: totalVal.toFixed(2),            color: 'var(--t2)' },
                        { label: sq ? 'Pesha totale (kg)' : 'Total weight',   value: totalWgt.toFixed(2),            color: 'var(--t2)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--t4)', fontWeight: 600, letterSpacing: '.03em', marginTop: 3, textTransform: 'uppercase' }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={() => setShowAsycuda(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        marginTop: 14, padding: '8px 14px', borderRadius: 9,
                        border: '1px solid var(--border)', background: 'var(--surface-2)',
                        color: 'var(--t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-200)'; e.currentTarget.style.color = 'var(--blue)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: showAsycuda ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      {showAsycuda
                        ? (sq ? 'Fshih pozicionet ASYCUDA' : 'Hide ASYCUDA positions')
                        : (sq ? 'Shfaq pozicionet ASYCUDA' : 'Show ASYCUDA positions')}
                    </button>
                  </div>

                  {/* Collapsible ASYCUDA table */}
                  {showAsycuda && (
                    <div className="card a-slide-down" style={{ padding: 0, overflow: 'hidden' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Poz.</th>
                            <th>{t(lang,'table.tariffCode')}</th>
                            <th>{t(lang,'table.descSq')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.qty')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.totalValue')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.grossWeight')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.packages')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.customsRate')}</th>
                            <th style={{ textAlign: 'right' }}>{t(lang,'table.vatRate')}</th>
                            <th>{t(lang,'table.status')}</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map(pos => {
                            const key     = pos.tariffCode || `NO_CODE_${pos.positionNo}`
                            const sources = sourceMap[key] || []
                            const merged  = sources.length > 1
                            const isOpen  = expandedPos === pos.positionNo

                            return (
                              <>
                                <tr key={pos.positionNo} style={{
                                  background: pos.status === 'missing' ? 'var(--red-bg)' : pos.status === 'review' ? 'var(--amber-bg)' : 'inherit',
                                }}>
                                  <td><span style={{ fontWeight: 700, color: 'var(--blue)' }}>{pos.positionNo}</span></td>
                                  <td>
                                    <code style={{ fontSize: 12, background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 5, color: 'var(--t2)' }}>
                                      {pos.tariffCode || <span style={{ color: 'var(--red)' }}>—</span>}
                                    </code>
                                  </td>
                                  <td style={{ maxWidth: 200, whiteSpace: 'normal' }}>
                                    <div>{pos.descriptionSq}</div>
                                    {merged && (
                                      <span style={{
                                        display: 'inline-block', marginTop: 3,
                                        padding: '1px 7px', borderRadius: 99, fontSize: 10.5, fontWeight: 700,
                                        background: 'var(--blue-100)', color: 'var(--blue)', border: '1px solid var(--blue-200)',
                                      }}>
                                        {sq ? `I bashkuar nga ${sources.length} rreshta` : `Merged from ${sources.length} rows`}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.totalQty} {pos.unit}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pos.totalValue.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.grossWeight.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right' }}>{pos.packages}</td>
                                  <td style={{ textAlign: 'right' }}>{pos.customsRate}%</td>
                                  <td style={{ textAlign: 'right' }}>{pos.vatRate}%</td>
                                  <td><span className={posBadge(pos.status)}>{t(lang, `status.${pos.status}`)}</span></td>
                                  <td>
                                    <button
                                      onClick={() => setExpandedPos(isOpen ? null : pos.positionNo)}
                                      style={{
                                        padding: '4px 9px', borderRadius: 7, border: '1px solid var(--border)',
                                        background: isOpen ? 'var(--blue-50)' : 'var(--surface-3)',
                                        color: isOpen ? 'var(--blue)' : 'var(--t4)',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {isOpen ? '▲' : '▼'} {sq ? 'Burimet' : 'Sources'}
                                    </button>
                                  </td>
                                </tr>
                                {/* Source rows expansion */}
                                {isOpen && sources.length > 0 && (
                                  <tr key={`src-${pos.positionNo}`}>
                                    <td colSpan={11} style={{ padding: 0, background: 'var(--blue-50)' }}>
                                      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--blue-200)' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                                          {sq ? `Rreshtat burimorë (${sources.length})` : `Source rows (${sources.length})`}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          {sources.map(src => (
                                            <div key={src.id} style={{
                                              display: 'flex', alignItems: 'center', gap: 12, padding: '7px 12px',
                                              background: '#fff', borderRadius: 8, border: '1px solid var(--blue-200)',
                                              fontSize: 12.5,
                                            }}>
                                              <code style={{ color: 'var(--t4)', fontSize: 11 }}>{src.itemNo}</code>
                                              <span style={{ flex: 1, color: 'var(--t2)', fontWeight: 500 }}>{src.descriptionEn}</span>
                                              <span style={{ color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{src.qty} {src.unit}</span>
                                              <span style={{ color: 'var(--t1)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{src.totalValue.toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Next button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button onClick={() => setStep('generate')} className="btn btn-primary" style={{ height: 50, padding: '0 32px', fontSize: 15, gap: 10 }}>
                {sq ? 'Vazhdo' : 'Continue'} <IcoArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: Generate ══════════ */}
        {step === 'generate' && (
          <div className="a-fade-up">
            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
                    {sq ? 'Gjenero XML dhe Shkarko' : 'Generate XML and Download'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t4)' }}>
                    {sq ? 'Strukturë bazuar 100% në template ASYCUDA' : '100% based on the ASYCUDA template structure'}
                  </p>
                </div>
              </div>
              <ExportPanel lang={lang} header={header} items={items} positions={positions} missingFields={missingFields} settings={settings} onStatusChange={setFinalStatus} />
            </div>
          </div>
        )}

      </main>

      {/* ── Camera modal ─────────────────────────────────────── */}
      {showCamera && (
        <CameraCapture
          lang={lang}
          onCapture={file => { handleFilesUpload([file]); setActiveAction(null) }}
          onClose={() => { setShowCamera(false); setActiveAction(null) }}
        />
      )}

      {/* ── Settings modal ───────────────────────────────────── */}
      {showSettings && (
        <Settings lang={lang} settings={settings} tariffRules={tariffRules}
          onSettingsChange={handleSettingsChange} onTariffRulesChange={setTariffRules}
          onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
