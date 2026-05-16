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
import CameraCapture from '@/components/CameraCapture'
import ProcessingCard, { type ProcessingState, type FileProcessState } from '@/components/ProcessingCard'

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
  const [procState, setProcState]     = useState<ProcessingState | null>(null)
  const progressTimerRef              = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // ── Progress timer: simulates smooth progress during API call ──
  const advanceProgress = (targetPct: number, stepIdx: number) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(() => {
      setProcState(prev => {
        if (!prev) return prev
        const current = prev.progress
        if (current >= targetPct) {
          clearInterval(progressTimerRef.current!)
          return prev
        }
        // Slow down as we approach target
        const gap  = targetPct - current
        const step = Math.max(0.3, gap * 0.04)
        return { ...prev, progress: Math.min(targetPct, current + step), currentStepIndex: stepIdx }
      })
    }, 400)
  }

  const handleFilesUpload = async (files: File[]) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setExtractError(null)
    setLoading(true)

    const fileStates: FileProcessState[] = files.map(f => ({
      name: f.name, type: f.type, size: f.size, status: 'pending',
    }))

    // Step 0 → 1: Upload + format check (instant)
    setProcState({
      isProcessing: true, currentStepIndex: 0, progress: 10,
      files: fileStates,
    })
    await new Promise(r => setTimeout(r, 300))
    setProcState(prev => prev ? { ...prev, currentStepIndex: 1, progress: 20 } : prev)
    await new Promise(r => setTimeout(r, 300))

    // Step 2 → 3: Mark files as "reading", start slow progress toward 50%
    setProcState(prev => prev ? {
      ...prev,
      currentStepIndex: 2, progress: 35,
      files: fileStates.map(f => ({ ...f, status: 'reading' })),
    } : prev)
    advanceProgress(50, 3)  // crawl toward 50% (extracting text)

    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))

      // Advance to AI analysis phase while fetch runs
      setTimeout(() => advanceProgress(72, 4), 3000)   // ~3s in: AI analysis
      setTimeout(() => advanceProgress(86, 4), 30000)  // ~30s in: still AI

      const res  = await fetch('/api/extract', { method: 'POST', body: fd })
      const data = await res.json()

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)

      if (!res.ok) throw new Error(data.error || 'Extraction failed')

      // Step 5 → 6: Creating tables & validating
      setProcState(prev => prev ? { ...prev, currentStepIndex: 5, progress: 88 } : prev)
      await new Promise(r => setTimeout(r, 400))
      setProcState(prev => prev ? { ...prev, currentStepIndex: 6, progress: 95 } : prev)
      await new Promise(r => setTimeout(r, 400))

      const headerData   = data.header || {}
      const itemsData    = data.items || []
      const posData      = data.positions || []
      const missingData  = data.missingFields || []

      setHeader(headerData)
      setItems(itemsData)
      setPositions(posData)
      setMissingFields(missingData)

      const missingCnt = missingData.filter((m: { status: string }) => m.status === 'missing').length
      const reviewCnt  = itemsData.filter((i: { status: string }) => i.status === 'review').length

      // Step 7: Done
      setProcState({
        isProcessing: false, currentStepIndex: 7, progress: 100,
        files: fileStates.map(f => ({ ...f, status: 'success' })),
        success: {
          items: itemsData.length,
          positions: posData.length,
          missing: missingCnt,
          review: reviewCnt,
        },
      })

    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      const technical = err instanceof Error ? err.message : String(err)
      console.error('[Upload] extraction failed:', technical)
      setProcState(prev => ({
        isProcessing: false, currentStepIndex: prev?.currentStepIndex || 2,
        progress: prev?.progress || 35,
        files: fileStates.map(f => ({ ...f, status: 'error' })),
        error: {
          sq: 'Dokumenti nuk mund të lexohej. Ju lutem provoni përsëri ose ngarkoni një format tjetër.',
          en: 'The document could not be read. Please try again or upload a different format.',
          technical,
        },
      }))
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleProcessingRetry = () => {
    setProcState(null)
    setExtractError(null)
  }

  const handleProcessingContinue = () => {
    setProcState(null)
    setStep('review')
  }

  const handleVoiceExtracted = (data: Partial<HeaderData>) => {
    setHeader(prev => ({ ...prev, ...data }))
    setStep('review')
  }

  const sq = lang === 'sq'

  // ── Count fields vs. rows (must be consistent across UI) ──
  // missingFieldCount: total number of missing field occurrences
  const missingFieldCount = missingFields.filter(m => m.status === 'missing').length
  // missingRowCount: number of ROWS that have at least one missing field
  const packingListFound  = items.some(i => i.grossWeight > 0)
  const missingRowCount   = items.filter(item => {
    if (!item.tariffCode) return true
    if (!item.qty || item.qty === 0) return true
    if (!item.totalValue || item.totalValue === 0) return true
    if (packingListFound && (!item.grossWeight || item.grossWeight === 0)) return true
    return false
  }).length
  // reviewCount: items with a proposed tariff code that needs confirmation
  const reviewCount  = items.filter(i => i.status === 'review' && i.tariffCode).length
  const okCount      = items.filter(i => i.status === 'ok' || i.status === 'confirmed').length
  // For backward compat (stepper badge)
  const missingCount = missingRowCount

  // ── Group missing fields by type for the error box ──
  const missingByType = {
    tariffCode:  missingFields.filter(m => m.field.toLowerCase().includes('tarifor')).length,
    grossWeight: missingFields.filter(m => m.field.toLowerCase().includes('pesha')).length,
    qty:         missingFields.filter(m => m.field.toLowerCase().includes('sasi')).length,
    value:       missingFields.filter(m => m.field.toLowerCase().includes('vler')).length,
    header:      missingFields.filter(m => !m.item).length,
  }

  // ── Diff warnings: form total vs. row sums ──
  const sumWeight  = items.reduce((s, i) => s + i.grossWeight, 0)
  const sumPkgs    = items.reduce((s, i) => s + i.packages, 0)
  const weightDiff = header.totalGrossWeight && Math.abs((header.totalGrossWeight || 0) - sumWeight) > 0.5
  const pkgDiff    = header.totalPackages    && Math.abs((header.totalPackages    || 0) - sumPkgs)   > 0

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

            {/* Upload zone (shown when not processing) */}
            {activeAction === 'upload' && !procState && (
              <div className="a-slide-down" style={{ marginBottom: 20 }}>
                <UploadZone lang={lang} onFiles={handleFilesUpload} loading={loading} loadingStep={loadingStep} />
              </div>
            )}

            {/* Processing card (replaces upload zone + alert during processing) */}
            {procState && (
              <div className="a-fade-in" style={{ marginBottom: 20 }}>
                <ProcessingCard
                  lang={lang}
                  state={procState}
                  onRetry={handleProcessingRetry}
                  onContinue={handleProcessingContinue}
                />
              </div>
            )}

            {/* Legacy error card fallback */}
            {extractError && !procState && (
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

            {/* ── Stats row — fields vs. rows clearly labeled ── */}
            {items.length > 0 && (
              <div className="a-fade-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <StatCard value={items.length}     label={sq ? 'rreshta fature'       : 'invoice rows'}         subtitle={sq ? 'nga dokumenti'             : 'from document'}            color="blue" />
                <StatCard value={positions.length} label={sq ? 'pozicione ASYCUDA'    : 'ASYCUDA positions'}    subtitle={sq ? 'grupe sipas kodit tarifor'  : 'grouped by tariff code'}    color="green" />
                <StatCard value={missingRowCount}  label={sq ? 'rreshta me mungesa'   : 'rows with missing'}    subtitle={sq ? 'plotëso para eksportit'    : 'fill before export'}         color={missingRowCount > 0 ? 'red' : 'green'} />
                <StatCard value={reviewCount}      label={sq ? 'kode për kontroll'    : 'codes to review'}      subtitle={sq ? 'propozuar, duhet konfirmuar': 'proposed, needs confirm'}    color={reviewCount > 0 ? 'amber' : 'green'} />
              </div>
            )}

            {/* ── Color legend ── */}
            {items.length > 0 && (missingRowCount > 0 || reviewCount > 0) && (
              <div style={{
                display: 'flex', gap: 18, flexWrap: 'wrap', padding: '9px 14px', borderRadius: 10,
                background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--t3)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                  <strong style={{ color: 'var(--t2)' }}>{sq ? 'E kuqe' : 'Red'}</strong>
                  {sq ? ' — plotëso para se të vazhdosh.' : ' — fill before you can continue.'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                  <strong style={{ color: 'var(--t2)' }}>{sq ? 'Portokalli' : 'Orange'}</strong>
                  {sq ? ' — kontrollo dhe konfirmo.' : ' — check and confirm.'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  <strong style={{ color: 'var(--t2)' }}>{sq ? 'Gjelbër' : 'Green'}</strong>
                  {sq ? ' — gati.' : ' — ready.'}
                </span>
              </div>
            )}

            {/* ── Grouped error box (no long item lists) ── */}
            {missingRowCount > 0 && (
              <div style={{
                background: 'var(--red-bg)', border: '1.5px solid var(--red-bdr)', borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: 'var(--red)', marginTop: 1, flexShrink: 0 }}><IcoAlert /></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: 'var(--red)' }}>
                      {sq ? 'Nuk mund të vazhdosh ende' : 'Cannot continue yet'}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--red)' }}>
                      {sq
                        ? `Janë gjetur ${missingFieldCount} fusha që mungojnë në ${missingRowCount} rreshta.`
                        : `Found ${missingFieldCount} missing fields in ${missingRowCount} rows.`}
                    </p>
                    {/* Grouped by type */}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {missingByType.tariffCode > 0  && <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(220,38,38,.12)', color:'var(--red)', fontSize:12, fontWeight:700, border:'1px solid var(--red-bdr)' }}>{missingByType.tariffCode} {sq ? 'kode tarifore' : 'tariff codes'}</span>}
                      {missingByType.grossWeight > 0 && <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(220,38,38,.12)', color:'var(--red)', fontSize:12, fontWeight:700, border:'1px solid var(--red-bdr)' }}>{missingByType.grossWeight} {sq ? 'pesha bruto' : 'gross weights'}</span>}
                      {missingByType.qty > 0          && <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(220,38,38,.12)', color:'var(--red)', fontSize:12, fontWeight:700, border:'1px solid var(--red-bdr)' }}>{missingByType.qty} {sq ? 'sasi' : 'quantities'}</span>}
                      {missingByType.value > 0        && <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(220,38,38,.12)', color:'var(--red)', fontSize:12, fontWeight:700, border:'1px solid var(--red-bdr)' }}>{missingByType.value} {sq ? 'vlera' : 'values'}</span>}
                      {missingByType.header > 0       && <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(220,38,38,.12)', color:'var(--red)', fontSize:12, fontWeight:700, border:'1px solid var(--red-bdr)' }}>{missingByType.header} {sq ? 'të dhëna dokumenti' : 'document fields'}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Diff warnings: form total ≠ row sums ── */}
            {(weightDiff || pkgDiff) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {weightDiff && header.totalGrossWeight && (
                  <div style={{ background: 'var(--amber-bg)', border: '1.5px solid var(--amber-bdr)', borderRadius: 14, padding: '14px 18px' }}>
                    <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:13, color:'var(--amber)' }}>
                      {sq ? 'Pesha totale nuk përputhet me totalin e rreshtave.' : 'Total weight does not match the sum of rows.'}
                    </p>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12.5, color:'var(--t2)' }}>
                      <span>{sq ? 'Në formular' : 'In form'}: <strong>{header.totalGrossWeight} kg</strong></span>
                      <span>{sq ? 'Nga rreshtat' : 'From rows'}: <strong>{sumWeight.toFixed(2)} kg</strong></span>
                      <span style={{ color:'var(--amber)', fontWeight:700 }}>Δ {Math.abs((header.totalGrossWeight || 0) - sumWeight).toFixed(2)} kg</span>
                    </div>
                    <div style={{ marginTop:10, display:'flex', gap:8 }}>
                      <button onClick={() => setHeader(h => ({...h, totalGrossWeight: parseFloat(sumWeight.toFixed(2))}))} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--amber-bdr)', background:'var(--surface)', color:'var(--amber)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {sq ? 'Përdor nga rreshtat' : 'Use from rows'} ({sumWeight.toFixed(2)})
                      </button>
                      <button onClick={() => {}} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--t4)', fontSize:12, cursor:'pointer' }}>
                        {sq ? 'Mbaj manualen' : 'Keep manual'} ({header.totalGrossWeight})
                      </button>
                    </div>
                  </div>
                )}
                {pkgDiff && header.totalPackages && (
                  <div style={{ background: 'var(--amber-bg)', border: '1.5px solid var(--amber-bdr)', borderRadius: 14, padding: '14px 18px' }}>
                    <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:13, color:'var(--amber)' }}>
                      {sq ? 'Paketime totale nuk përputhen me totalin e rreshtave.' : 'Total packages do not match the sum of rows.'}
                    </p>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12.5, color:'var(--t2)' }}>
                      <span>{sq ? 'Në formular' : 'In form'}: <strong>{header.totalPackages}</strong></span>
                      <span>{sq ? 'Nga rreshtat' : 'From rows'}: <strong>{sumPkgs}</strong></span>
                      <span style={{ color:'var(--amber)', fontWeight:700 }}>Δ {Math.abs((header.totalPackages || 0) - sumPkgs)}</span>
                    </div>
                    <div style={{ marginTop:10, display:'flex', gap:8 }}>
                      <button onClick={() => setHeader(h => ({...h, totalPackages: sumPkgs}))} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--amber-bdr)', background:'var(--surface)', color:'var(--amber)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {sq ? 'Përdor nga rreshtat' : 'Use from rows'} ({sumPkgs})
                      </button>
                      <button onClick={() => {}} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--t4)', fontSize:12, cursor:'pointer' }}>
                        {sq ? 'Mbaj manualen' : 'Keep manual'} ({header.totalPackages})
                      </button>
                    </div>
                  </div>
                )}
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

                  {/* Collapsible ASYCUDA table — full scroll support */}
                  {showAsycuda && (
                    <div className="card a-slide-down" style={{ padding: 0, overflow: 'hidden' }}>

                      {/* Scroll hint */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderBottom: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                        fontSize: 11.5, color: 'var(--t4)', userSelect: 'none',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/>
                        </svg>
                        {sq
                          ? 'Rrëshqit tabelën majtas/djathtas për të parë të gjitha kolonat.'
                          : 'Scroll the table left/right to see all columns.'}
                        <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                          {positions.length} {sq ? 'pozicione' : 'positions'}
                        </span>
                      </div>

                      {/*
                        Scroll wrapper:
                        - overflow-x: auto  → horizontal scroll
                        - overflow-y: auto  → vertical scroll
                        - max-height: 580px → bound height so page doesn't stretch
                        Table inside is min-width: 900px to force horizontal scroll
                      */}
                      <div style={{
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: 580,
                        WebkitOverflowScrolling: 'touch', // smooth on iOS
                      }}>
                        <table style={{
                          width: '100%',
                          minWidth: 940,         // forces horizontal scroll when needed
                          borderCollapse: 'collapse',
                          tableLayout: 'fixed',
                          fontSize: 13,
                        }}>
                          {/* Column widths */}
                          <colgroup>
                            <col style={{ width: 52 }}  />  {/* Poz. — sticky */}
                            <col style={{ width: 126 }} />  {/* Kodi tarifor — sticky */}
                            <col style={{ width: 200 }} />  {/* Pershkrimi shqip */}
                            <col style={{ width: 90 }}  />  {/* Sasia */}
                            <col style={{ width: 96 }}  />  {/* Vlera totale */}
                            <col style={{ width: 96 }}  />  {/* Pesha bruto */}
                            <col style={{ width: 80 }}  />  {/* Paketime */}
                            <col style={{ width: 76 }}  />  {/* Dogana % */}
                            <col style={{ width: 68 }}  />  {/* TVSH % */}
                            <col style={{ width: 90 }}  />  {/* Statusi */}
                            <col style={{ width: 80 }}  />  {/* Burimet */}
                          </colgroup>

                          {/* ── Sticky header ── */}
                          <thead>
                            <tr>
                              {/* Sticky col 1 — intersection of sticky header + sticky col */}
                              <th style={{
                                position: 'sticky', top: 0, left: 0, zIndex: 4,
                                background: 'var(--surface-2)',
                                borderRight: '2px solid var(--border)',
                                padding: '10px 12px', textAlign: 'left',
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.06em', color: 'var(--t4)',
                                boxShadow: '2px 0 4px rgba(0,0,0,.04)',
                              }}>Poz.</th>
                              {/* Sticky col 2 */}
                              <th style={{
                                position: 'sticky', top: 0, left: 52, zIndex: 4,
                                background: 'var(--surface-2)',
                                borderRight: '2px solid var(--border-2)',
                                padding: '10px 12px', textAlign: 'left',
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '.06em', color: 'var(--t4)',
                                boxShadow: '3px 0 8px rgba(0,0,0,.06)',
                              }}>{t(lang,'table.tariffCode')}</th>
                              {/* Normal headers */}
                              {[
                                t(lang,'table.descSq'),
                                t(lang,'table.qty'),
                                t(lang,'table.totalValue'),
                                t(lang,'table.grossWeight'),
                                t(lang,'table.packages'),
                                t(lang,'table.customsRate'),
                                t(lang,'table.vatRate'),
                                t(lang,'table.status'),
                                '',
                              ].map((h, i) => (
                                <th key={i} style={{
                                  position: 'sticky', top: 0, zIndex: 3,
                                  background: 'var(--surface-2)',
                                  padding: '10px 12px',
                                  textAlign: i >= 1 && i <= 5 ? 'right' : 'left',
                                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                  letterSpacing: '.06em', color: 'var(--t4)',
                                  whiteSpace: 'nowrap',
                                  borderBottom: '1px solid var(--border)',
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>

                          {/* ── Body ── */}
                          <tbody>
                            {positions.map((pos, rowIdx) => {
                              const key     = pos.tariffCode || `NO_CODE_${pos.positionNo}`
                              const sources = sourceMap[key] || []
                              const merged  = sources.length > 1
                              const isOpen  = expandedPos === pos.positionNo
                              const rowBg   = pos.status === 'missing' ? 'var(--red-bg)'
                                            : pos.status === 'review'  ? 'rgba(217,119,6,.06)'
                                            : rowIdx % 2 === 0         ? 'var(--surface)' : 'var(--surface-2)'

                              return (
                                <>
                                  <tr key={pos.positionNo}
                                    style={{ background: rowBg, transition: 'background .15s' }}
                                    onMouseEnter={e => { if (pos.status === 'ok') (e.currentTarget as HTMLTableRowElement).style.background = 'var(--blue-50)' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg }}
                                  >
                                    {/* Sticky col 1 — Poz. */}
                                    <td style={{
                                      position: 'sticky', left: 0, zIndex: 2,
                                      background: rowBg,
                                      borderRight: '2px solid var(--border)',
                                      padding: '9px 12px',
                                      boxShadow: '2px 0 4px rgba(0,0,0,.04)',
                                    }}>
                                      <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--blue)' }}>{pos.positionNo}</span>
                                    </td>

                                    {/* Sticky col 2 — Kodi tarifor */}
                                    <td style={{
                                      position: 'sticky', left: 52, zIndex: 2,
                                      background: rowBg,
                                      borderRight: '2px solid var(--border-2)',
                                      padding: '9px 12px',
                                      boxShadow: '3px 0 8px rgba(0,0,0,.06)',
                                    }}>
                                      {pos.tariffCode ? (
                                        <code style={{
                                          fontSize: 12, fontWeight: 600,
                                          background: 'var(--surface-3)',
                                          padding: '2px 7px', borderRadius: 5,
                                          color: 'var(--t1)',
                                          fontFamily: 'monospace',
                                          letterSpacing: '.03em',
                                          whiteSpace: 'nowrap',
                                        }}>
                                          {pos.tariffCode.slice(0,4)} {pos.tariffCode.slice(4,8)} {pos.tariffCode.slice(8)}
                                        </code>
                                      ) : (
                                        <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>— Mungon</span>
                                      )}
                                    </td>

                                    {/* Description */}
                                    <td style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                                      <div style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.35 }}>
                                        {pos.descriptionSq}
                                      </div>
                                      {merged && (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 3,
                                          marginTop: 3, padding: '1px 7px', borderRadius: 99,
                                          fontSize: 10.5, fontWeight: 700,
                                          background: 'var(--blue-100)', color: 'var(--blue)',
                                          border: '1px solid var(--blue-200)',
                                        }}>
                                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                                          {sq ? `${sources.length} rreshta` : `${sources.length} rows`}
                                        </span>
                                      )}
                                    </td>

                                    {/* Numeric columns */}
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                                      {pos.totalQty.toLocaleString()} {pos.unit}
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 12.5, color: 'var(--t1)', whiteSpace: 'nowrap' }}>
                                      {pos.totalValue.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12.5, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                                      {pos.grossWeight.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12.5, color: 'var(--t2)' }}>
                                      {pos.packages}
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12.5, color: 'var(--t2)' }}>
                                      {pos.customsRate}%
                                    </td>
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 12.5, color: 'var(--t2)' }}>
                                      {pos.vatRate}%
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: '9px 12px' }}>
                                      <span className={posBadge(pos.status)}>
                                        {t(lang, `status.${pos.status}`)}
                                      </span>
                                    </td>

                                    {/* Sources button */}
                                    <td style={{ padding: '9px 8px' }}>
                                      <button
                                        onClick={() => setExpandedPos(isOpen ? null : pos.positionNo)}
                                        style={{
                                          padding: '4px 10px', borderRadius: 7,
                                          border: `1px solid ${isOpen ? 'var(--blue-200)' : 'var(--border)'}`,
                                          background: isOpen ? 'var(--blue-50)' : 'var(--surface-3)',
                                          color: isOpen ? 'var(--blue)' : 'var(--t4)',
                                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                          whiteSpace: 'nowrap', transition: 'all .15s',
                                          display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                      >
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                                          <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                        {sq ? 'Burimi' : 'Source'}
                                      </button>
                                    </td>
                                  </tr>

                                  {/* Expanded source rows */}
                                  {isOpen && sources.length > 0 && (
                                    <tr key={`src-${pos.positionNo}`}>
                                      <td colSpan={11} style={{ padding: 0, background: 'var(--blue-50)' }}>
                                        <div style={{ padding: '12px 16px 12px 178px', borderTop: '1px solid var(--blue-200)' }}>
                                          <p style={{
                                            margin: '0 0 8px', fontSize: 10.5, fontWeight: 700,
                                            color: 'var(--blue)', letterSpacing: '.05em', textTransform: 'uppercase',
                                          }}>
                                            {sq ? `Rreshtat burimorë (${sources.length})` : `Source rows (${sources.length})`}
                                          </p>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {sources.map(src => (
                                              <div key={src.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 14,
                                                padding: '7px 12px', background: '#fff',
                                                borderRadius: 8, border: '1px solid var(--blue-200)',
                                                fontSize: 12.5,
                                              }}>
                                                <code style={{ color: 'var(--t4)', fontSize: 11, flexShrink: 0 }}>{src.itemNo}</code>
                                                <span style={{ flex: 1, color: 'var(--t2)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                  {src.descriptionEn}
                                                </span>
                                                <span style={{ color: 'var(--t3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{src.qty.toLocaleString()} {src.unit}</span>
                                                <span style={{ color: 'var(--t1)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{src.totalValue.toFixed(2)}</span>
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

                          {/* ── Totals footer ── */}
                          <tfoot>
                            <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--border-2)' }}>
                              <td style={{
                                position: 'sticky', left: 0, zIndex: 2,
                                background: 'var(--surface-2)',
                                padding: '10px 12px', fontWeight: 700, fontSize: 12, color: 'var(--t2)',
                                borderRight: '2px solid var(--border)',
                              }}>—</td>
                              <td style={{
                                position: 'sticky', left: 52, zIndex: 2,
                                background: 'var(--surface-2)',
                                padding: '10px 12px', fontWeight: 700, fontSize: 11, color: 'var(--t3)',
                                borderRight: '2px solid var(--border-2)',
                                textTransform: 'uppercase', letterSpacing: '.04em',
                              }}>TOTAL</td>
                              <td style={{ padding: '10px 12px' }}></td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                                {positions.reduce((s, p) => s + p.totalQty, 0).toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: 'var(--t1)' }}>
                                {positions.reduce((s, p) => s + p.totalValue, 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                                {positions.reduce((s, p) => s + p.grossWeight, 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                                {positions.reduce((s, p) => s + p.packages, 0)}
                              </td>
                              <td colSpan={4}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Next button — blocked when mandatory fields are missing */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button
                onClick={() => missingRowCount > 0 ? undefined : setStep('generate')}
                disabled={missingRowCount > 0}
                className="btn btn-primary"
                style={{
                  height: 50, padding: '0 32px', fontSize: 15, gap: 10,
                  opacity: missingRowCount > 0 ? .45 : 1,
                  cursor: missingRowCount > 0 ? 'not-allowed' : 'pointer',
                }}
                title={missingRowCount > 0 ? (sq ? `Plotëso ${missingRowCount} rreshtat e kuqe para se të vazhdosh.` : `Fill ${missingRowCount} red rows before continuing.`) : undefined}
              >
                {sq ? 'Vazhdo' : 'Continue'} <IcoArrowRight />
              </button>
              {missingRowCount > 0 && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                  {sq
                    ? `Plotëso ${missingRowCount} rreshtat me mungesa për të vazhduar.`
                    : `Fill ${missingRowCount} rows with missing data to continue.`}
                </p>
              )}
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
