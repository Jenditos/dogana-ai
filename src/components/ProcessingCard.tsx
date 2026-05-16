'use client'
import { useRef } from 'react'
import type { Language } from '@/types'

/* ── Types ───────────────────────────────────────────────────── */
export interface FileProcessState {
  name: string
  type: string
  size: number
  status: 'pending' | 'reading' | 'success' | 'error'
  error?: string
}

export interface ProcessingState {
  isProcessing: boolean
  currentStepIndex: number   // 0-7
  progress: number           // 0-100
  files: FileProcessState[]
  error?: { sq: string; en: string; technical: string }
  success?: { items: number; positions: number; missing: number; review: number }
}

interface Props {
  lang: Language
  state: ProcessingState
  onRetry: () => void
  onContinue: () => void
}

function formatProgress(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '0%'
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`
}

/* ── Steps definition ────────────────────────────────────────── */
const STEPS = {
  sq: [
    'Dokumenti u ngarkua',
    'Formati i dokumentit u kontrollua',
    'Duke lexuar dokumentin',
    'Duke nxjerrë tekstin nga PDF',
    'Duke analizuar të dhënat me AI',
    'Duke krijuar tabelat',
    'Duke kontrolluar të dhënat',
    'Gati për kontroll',
  ],
  en: [
    'Document uploaded',
    'Document format checked',
    'Reading document',
    'Extracting text from PDF',
    'Analyzing data with AI',
    'Creating tables',
    'Validating data',
    'Ready for review',
  ],
}

/* ── Inline SVGs ─────────────────────────────────────────────── */
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoSpinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)
const IcoFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoSuccess = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IcoRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
)
const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function isPdf(name: string, type: string): boolean {
  return type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')
}

/* ─────────────────────────────────────────────────────────────
   ProcessingCard component
   ───────────────────────────────────────────────────────────── */
export default function ProcessingCard({ lang, state, onRetry, onContinue }: Props) {
  const sq       = lang === 'sq'
  const steps    = STEPS[lang] || STEPS.sq
  const showTechRef = useRef(false)

  const { isProcessing, currentStepIndex, progress, files, error, success } = state

  /* ── Slow-down hint: show if processing step 4 for more than 15s ── */
  // (handled by parent via step timing)

  /* ── Render helpers ─────────────────────────────────────────── */
  const StepIcon = ({ idx }: { idx: number }) => {
    if (idx < currentStepIndex) return <span style={{ color: 'var(--green)' }}><IcoCheck /></span>
    if (idx === currentStepIndex && isProcessing) return <IcoSpinner />
    if (idx === currentStepIndex && success) return <span style={{ color: 'var(--green)' }}><IcoCheck /></span>
    return <span style={{ color: 'var(--t4)' }}><IcoCircle /></span>
  }

  /* ─── Error state ─────────────────────────────────────────── */
  if (error) {
    return (
      <div className="card a-scale-in" style={{ padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--red-bg)', color: 'var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <IcoAlert />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
            {sq ? 'Dokumenti nuk mund të lexohej' : 'Document could not be read'}
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 400, marginInline: 'auto' }}>
            {sq ? error.sq : error.en}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRetry} className="btn btn-primary" style={{ height: 42, gap: 7 }}>
            <IcoRefresh /> {sq ? 'Provo përsëri' : 'Try again'}
          </button>
          <button
            onClick={() => { showTechRef.current = !showTechRef.current; document.getElementById('tech-details')?.classList.toggle('hidden') }}
            className="btn btn-ghost" style={{ height: 42 }}
          >
            {sq ? 'Detaje teknike' : 'Technical details'}
          </button>
        </div>

        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 12, color: 'var(--t4)', cursor: 'pointer', userSelect: 'none' }}>
            {sq ? 'Detaje teknike' : 'Technical details'}
          </summary>
          <pre style={{
            marginTop: 8, padding: '10px 12px', borderRadius: 8,
            background: 'var(--surface-3)', color: 'var(--t3)',
            fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>{error.technical}</pre>
        </details>
      </div>
    )
  }

  /* ─── Success state ───────────────────────────────────────── */
  if (success) {
    return (
      <div className="card a-scale-in" style={{ padding: 28 }}>
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--green-bg)', color: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 0 0 8px rgba(5,150,105,.08)',
          }}>
            <IcoSuccess />
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: 'var(--t1)' }}>
            {sq ? 'Dokumentet u analizuan me sukses' : 'Documents analyzed successfully'}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--t4)' }}>
            {sq ? 'Të dhënat janë gati për kontroll dhe eksport.' : 'Data is ready for review and export.'}
          </p>
        </div>

        {/* Summary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22,
        }}>
          {[
            { value: success.items,     label: sq ? 'Artikuj të lexuar'    : 'Items read',         color: 'var(--blue)' },
            { value: success.positions, label: sq ? 'Pozicione ASYCUDA'    : 'ASYCUDA positions',  color: 'var(--green)' },
            { value: success.missing,   label: sq ? 'Të dhëna mungojnë'    : 'Missing data',       color: success.missing > 0 ? 'var(--red)' : 'var(--green)' },
            { value: success.review,    label: sq ? 'Të dhëna për kontroll': 'Data to review',     color: success.review > 0 ? 'var(--amber)' : 'var(--green)' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.3 }}>{label}</span>
            </div>
          ))}
        </div>

        <button onClick={onContinue} className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: 15, gap: 10 }}>
          {sq ? 'Vazhdo te kontrolli i të dhënave' : 'Continue to data review'} <IcoArrow />
        </button>
      </div>
    )
  }

  /* ─── Processing state ────────────────────────────────────── */
  const currentLabel = steps[currentStepIndex] || steps[0]
  const isLongWait   = currentStepIndex >= 3 && currentStepIndex <= 4

  return (
    <div className="card a-fade-in" style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <IcoSpinner size={18} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
            {sq ? 'Përpunimi i dokumenteve' : 'Processing documents'}
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--t3)' }}>
          {sq
            ? 'Ju lutem prisni, dokumentet po analizohen automatikisht.'
            : 'Please wait, the documents are being analyzed automatically.'}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)' }}>{currentLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
            {formatProgress(progress)}
          </span>
        </div>
        <div style={{
          height: 8, background: 'var(--surface-3)', borderRadius: 99,
          overflow: 'hidden', border: '1px solid var(--border)',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: `linear-gradient(90deg, var(--blue) 0%, #4B7BF5 100%)`,
            borderRadius: 99,
            transition: 'width .6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(27,80,216,.4)',
          }} />
        </div>
      </div>

      {/* Long wait hint */}
      {isLongWait && (
        <p style={{
          margin: '6px 0 14px', fontSize: 12, color: 'var(--t4)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {sq ? 'Kjo mund të zgjasë 1–3 minuta.' : 'This may take 1–3 minutes.'}
          {progress >= 60 && progress < 85 && (
            <span style={{ marginLeft: 4, color: 'var(--t4)', fontStyle: 'italic' }}>
              {sq ? 'Dokumente të mëdha kërkojnë pak më shumë kohë.' : 'Large documents take a bit longer.'}
            </span>
          )}
        </p>
      )}

      {/* Step checklist */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((label, idx) => {
            const done    = idx < currentStepIndex || !!success
            const active  = idx === currentStepIndex && isProcessing
            const pending = idx > currentStepIndex

            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: pending ? .45 : 1,
                transition: 'opacity .3s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--green-bg)' : active ? 'var(--blue-50)' : 'var(--surface-3)',
                  color: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--t4)',
                  border: `1px solid ${done ? 'var(--green-bdr)' : active ? 'var(--blue-200)' : 'var(--border)'}`,
                  transition: 'all .25s',
                }}>
                  <StepIcon idx={idx} />
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : done ? 500 : 400,
                  color: done ? 'var(--t2)' : active ? 'var(--blue)' : 'var(--t4)',
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-file status */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((file, idx) => {
            const pdf     = isPdf(file.name, file.type)
            const statusColor = file.status === 'success' ? 'var(--green)'
              : file.status === 'error' ? 'var(--red)'
              : file.status === 'reading' ? 'var(--blue)'
              : 'var(--t4)'
            const statusLabel = {
              pending: sq ? 'Në pritje' : 'Pending',
              reading: sq ? 'Duke u lexuar' : 'Reading',
              success: sq ? 'U lexua' : 'Read',
              error:   sq ? 'Gabim' : 'Error',
            }[file.status] || ''

            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
                borderLeft: `3px solid ${pdf ? 'var(--blue)' : 'var(--green)'}`,
              }}>
                <span style={{ color: pdf ? 'var(--blue)' : 'var(--green)', flexShrink: 0 }}>
                  <IcoFile />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)' }}>
                    {pdf ? 'PDF' : sq ? 'Imazh' : 'Image'} · {formatBytes(file.size)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {file.status === 'reading' && <IcoSpinner size={12} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
