'use client'
import { useState, useEffect, useRef } from 'react'
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
function StatCard({ value, label, color = 'blue' }: { value: string | number; label: string; color?: string }) {
  const colors: Record<string, [string, string]> = {
    blue:  ['var(--blue-50)',  'var(--blue)'],
    green: ['var(--green-bg)', 'var(--green)'],
    amber: ['var(--amber-bg)', 'var(--amber)'],
    red:   ['var(--red-bg)',   'var(--red)'],
    gray:  ['var(--surface-3)','var(--t3)'],
  }
  const [bg, fg] = colors[color] || colors.gray
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '18px 20px',
      boxShadow: 'var(--sh-xs)', flex: '1 1 0', minWidth: 0,
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: fg, lineHeight: 1 }}>{value}</div>
      <div style={{
        marginTop: 4, fontSize: 11.5, fontWeight: 600,
        color: 'var(--t4)', letterSpacing: '.04em', textTransform: 'uppercase',
      }}>{label}</div>
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

export default function Home() {
  const [lang, setLang]               = useState<Language>('sq')
  const [step, setStep]               = useState<Step>('upload')
  const [activeAction, setActiveAction] = useState<'upload' | 'voice' | 'camera' | null>('upload')
  const [loading, setLoading]         = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings]       = useState<AppSettings>(DEFAULT_SETTINGS)
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([])
  const [finalStatus, setFinalStatus] = useState<string>('')

  const [header, setHeader]           = useState<Partial<HeaderData>>({})
  const [items, setItems]             = useState<InvoiceItem[]>([])
  const [positions, setPositions]     = useState<AsycudaPosition[]>([])
  const [missingFields, setMissingFields] = useState<MissingField[]>([])

  const cameraRef = useRef<HTMLInputElement>(null)

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
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      const res  = await fetch('/api/extract', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      setHeader(data.header || {})
      setItems(data.items || [])
      setPositions(data.positions || [])
      setMissingFields(data.missingFields || [])
      setStep('review')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gabim gjatë leximit')
    } finally { setLoading(false) }
  }

  const handleVoiceExtracted = (data: Partial<HeaderData>) => {
    setHeader(prev => ({ ...prev, ...data }))
    setStep('review')
  }

  const missingCount = missingFields.filter(m => m.status === 'missing').length
  const reviewCount  = items.filter(i => i.status === 'review').length
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
                  onClick={() => { setActiveAction('camera'); cameraRef.current?.click() }}
                />
                <ActionCard
                  icon={<IcoMic />}
                  title={sq ? 'Fol me zë' : 'Speak'}
                  desc={sq ? 'Shto ose korrigjo të dhënat me komandë zanore.' : 'Add or correct data with voice command.'}
                  active={activeAction === 'voice'}
                  onClick={() => setActiveAction(a => a === 'voice' ? null : 'voice')}
                />
              </div>

              {/* Hidden camera input */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFilesUpload([e.target.files[0]]) }} />
            </div>

            {/* Upload zone (conditional) */}
            {activeAction === 'upload' && (
              <div className="a-slide-down" style={{ marginBottom: 20 }}>
                <UploadZone lang={lang} onFiles={handleFilesUpload} loading={loading} />
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
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }} className="a-fade-in">
                <StatCard value={items.length}    label={sq ? 'Artikuj të lexuar' : 'Items extracted'} color="blue" />
                <StatCard value={positions.length} label={sq ? 'Pozicione ASYCUDA' : 'ASYCUDA positions'} color="green" />
                <StatCard value={missingCount}    label={sq ? 'Fusha mungojnë' : 'Missing fields'} color={missingCount > 0 ? 'red' : 'green'} />
                <StatCard value={reviewCount}     label={sq ? 'Për kontroll' : 'Needs review'} color={reviewCount > 0 ? 'amber' : 'green'} />
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

            {/* Invoice rows card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: 'var(--t1)' }}>
                    {t(lang, 'labels.invoiceRows')}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t4)' }}>{items.length} {sq ? 'artikuj' : 'items'}</p>
                </div>
              </div>
              <ItemsTable lang={lang} items={items} onChange={setItems} />
            </div>

            {/* ASYCUDA positions card */}
            {positions.length > 0 && (
              <div className="card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: 'var(--t1)' }}>
                    {t(lang, 'labels.asycudaPositions')}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t4)' }}>{positions.length} {sq ? 'pozicione' : 'positions'}</p>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {['Poz.', t(lang,'table.tariffCode'), t(lang,'table.descSq'), t(lang,'table.qty'), t(lang,'table.totalValue'), t(lang,'table.grossWeight'), t(lang,'table.packages'), t(lang,'table.customsRate'), t(lang,'table.vatRate'), t(lang,'table.status')].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(pos => (
                        <tr key={pos.positionNo} style={{
                          background: pos.status === 'missing' ? 'var(--red-bg)' : pos.status === 'review' ? 'var(--amber-bg)' : 'inherit'
                        }}>
                          <td><span style={{ fontWeight: 700, color: 'var(--blue)' }}>{pos.positionNo}</span></td>
                          <td><code style={{ fontSize: 12, background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 5, color: 'var(--t2)' }}>{pos.tariffCode || <span style={{ color: 'var(--red)' }}>⚠</span>}</code></td>
                          <td style={{ maxWidth: 200, whiteSpace: 'normal' }}>{pos.descriptionSq}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.totalQty} {pos.unit}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{pos.totalValue.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pos.grossWeight.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>{pos.packages}</td>
                          <td style={{ textAlign: 'right' }}>{pos.customsRate}%</td>
                          <td style={{ textAlign: 'right' }}>{pos.vatRate}%</td>
                          <td><span className={posBadge(pos.status)}>{t(lang, `status.${pos.status}`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

      {/* ── Settings modal ───────────────────────────────────── */}
      {showSettings && (
        <Settings lang={lang} settings={settings} tariffRules={tariffRules}
          onSettingsChange={handleSettingsChange} onTariffRulesChange={setTariffRules}
          onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
