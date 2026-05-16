'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Language, HeaderData } from '@/types'
import { t } from '@/lib/i18n'

const MicDiagnostic = dynamic(() => import('./MicDiagnostic'), { ssr: false })

type State = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'extracting' | 'done' | 'error'
interface Device { deviceId: string; label: string }
interface Props { lang: Language; onExtracted: (d: Partial<HeaderData>) => void }

const AVOID = ['iphone', 'continuity', 'airpod', 'bluetooth', 'android', 'samsung']
const isAvoided = (label: string) => AVOID.some(t => label.toLowerCase().includes(t))
const preferred  = (devs: Device[]) => devs.find(d => !isAvoided(d.label)) ?? devs[0] ?? null

/* ── SVG icons ─────────────────────────────────────────────── */
const IcoMic   = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
const IcoStop  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
const IcoCheck = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoSpin  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
const IcoEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoDevice= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
const IcoBeaker= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v10l3 5H6l3-5z"/><line x1="9" y1="3" x2="9" y2="13"/><line x1="15" y1="3" x2="15" y2="13"/></svg>
const IcoRefresh=() => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
const IcoAlert = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

export default function VoiceInput({ lang, onExtracted }: Props) {
  const [state,        setState]        = useState<State>('idle')
  const [devices,      setDevices]      = useState<Device[]>([])
  const [selDevice,    setSelDevice]    = useState('')
  const [devicesReady, setDevicesReady] = useState(false)
  const [transcript,   setTranscript]   = useState('')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [timer,        setTimer]        = useState(0)
  const [volume,       setVolume]       = useState(0)
  const [showDiag,     setShowDiag]     = useState(false)

  const streamRef    = useRef<MediaStream | null>(null)
  const recorderRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const rafRef       = useRef<number>(0)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const sq = lang === 'sq'

  const enumerate = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all.filter(d => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Mic (${d.deviceId.slice(0,8)})` }))
      console.log('[Voice] devices:', mics.map(d => d.label).join(', '))
      setDevices(mics)
      setDevicesReady(true)
      setSelDevice(prev => {
        if (prev && mics.find(d => d.deviceId === prev)) return prev
        return preferred(mics)?.deviceId ?? ''
      })
    } catch (e) { console.warn('[Voice] enumerate:', e) }
  }

  /* ── Cleanup ──────────────────────────────────────────────── */
  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    cancelAnimationFrame(rafRef.current)
    try { recorderRef.current?.stop() } catch {}
    recorderRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    setVolume(0)
  }

  /* ── Enumerate devices ─────────────────────────────────────── */
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(s => { s.getTracks().forEach(t => t.stop()); enumerate() })
      .catch(() => enumerate())
    return () => cleanup()
  }, [])

  /* ── Start recording ──────────────────────────────────────── */
  const startRecording = async () => {
    setErrorMsg('')
    setState('requesting')

    try {
      const constraints: MediaStreamConstraints = {
        audio: selDevice
          ? { deviceId: { exact: selDevice }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const track = stream.getAudioTracks()[0]
      console.log(`[Voice] Using: "${track.label}" | id: ${track.getSettings().deviceId}`)

      // Volume meter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += (v - 128) ** 2
        setVolume(Math.min(1, Math.sqrt(sum / buf.length) / 128 * 5))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')  ? 'audio/mp4'
        : ''

      chunksRef.current = []
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => sendToWhisper()
      recorder.start(200) // collect chunks every 200ms

      // Timer
      setTimer(0)
      timerRef.current = setInterval(() => setTimer(p => p + 1), 1000)

      setState('recording')
    } catch (err: unknown) {
      const e = err as DOMException
      cleanup()
      setErrorMsg(
        e.name === 'NotAllowedError' ? (sq ? 'Qasja u refuzua. Lejo mikrofonin në shfletues.' : 'Access denied. Allow microphone in browser.') :
        e.name === 'NotFoundError'   ? (sq ? 'Asnjë mikrofon nuk u gjet.' : 'No microphone found.') :
        `${sq ? 'Gabim' : 'Error'}: ${e.message}`
      )
      setState('error')
    }
  }

  /* ── Stop recording ───────────────────────────────────────── */
  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    cancelAnimationFrame(rafRef.current)
    setVolume(0)
    setState('transcribing')
    recorderRef.current?.stop() // triggers onstop → sendToWhisper
    streamRef.current?.getTracks().forEach(t => t.stop())
    try { audioCtxRef.current?.close() } catch {}
  }

  /* ── Send audio to Whisper ────────────────────────────────── */
  const sendToWhisper = async () => {
    const chunks = chunksRef.current
    if (!chunks.length) {
      setErrorMsg(sq ? 'Nuk u regjistrua asgjë.' : 'Nothing was recorded.')
      setState('error')
      return
    }

    const mimeType = recorderRef.current?.mimeType || 'audio/webm'
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
    const blob = new Blob(chunks, { type: mimeType })
    const file = new File([blob], `voice.${ext}`, { type: mimeType })

    console.log(`[Voice] Sending ${(blob.size / 1024).toFixed(1)}KB audio to Whisper (${mimeType})`)

    const fd = new FormData()
    fd.append('audio', file)
    fd.append('lang', lang)

    try {
      const res  = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transcription failed')
      const text = (data.transcript || '').trim()
      setTranscript(text)
      setState(text ? 'idle' : 'error')
      if (!text) setErrorMsg(sq ? 'Whisper nuk njohu asnjë fjalim. Fol me zë dhe provo sërish.' : 'Whisper recognized no speech. Speak clearly and try again.')
    } catch (err: unknown) {
      const e = err as Error
      setErrorMsg(e.message)
      setState('error')
    }
  }

  /* ── Extract from transcript ──────────────────────────────── */
  const extractData = async () => {
    if (!transcript.trim()) return
    setState('extracting')
    try {
      const res  = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()
      if (data.header) { onExtracted(data.header); setState('done') }
      else throw new Error(data.error || 'No data')
    } catch (err: unknown) {
      const e = err as Error
      setErrorMsg(e.message)
      setState('error')
    }
  }

  const reset = () => { setTranscript(''); setErrorMsg(''); setState('idle'); setTimer(0) }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  const isRecording   = state === 'recording'
  const isTranscribing= state === 'transcribing'
  const isExtracting  = state === 'extracting'
  const isBusy        = state === 'requesting' || isRecording || isTranscribing || isExtracting
  const isDone        = state === 'done'
  const isError       = state === 'error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Device selector ──────────────────────────────────── */}
      {devicesReady && devices.length > 1 && !isBusy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className="a-fade-in">
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcoDevice /> {sq ? 'Mikrofoni' : 'Microphone'}
          </label>
          <select value={selDevice} onChange={e => setSelDevice(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', cursor: 'pointer' }}
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {isAvoided(d.label) ? `⚠ ${d.label}` : d.label}
              </option>
            ))}
          </select>
          {selDevice && isAvoided(devices.find(d => d.deviceId === selDevice)?.label ?? '') && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcoAlert /> {sq ? 'iPhone/Continuity mik mund të shkëputet.' : 'iPhone/Continuity mic may disconnect.'}
            </p>
          )}
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────── */}
      <div style={{
        background: isRecording ? 'rgba(220,38,38,.03)' : isError ? 'var(--red-bg)' : isDone ? 'var(--green-bg)' : 'var(--surface-2)',
        border: `1.5px solid ${isRecording ? 'var(--red-bdr)' : isError ? 'var(--red-bdr)' : isDone ? 'var(--green-bdr)' : 'var(--border)'}`,
        borderRadius: 16, padding: '24px', textAlign: 'center', transition: 'all .25s',
      }}>

        {/* Mic orb */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
          background: isRecording ? 'var(--red-bg)' : isDone ? 'var(--green-bg)' : isError ? 'var(--red-bg)' : 'var(--blue-50)',
          color: isRecording ? 'var(--red)' : isDone ? 'var(--green)' : isError ? 'var(--red)' : 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isRecording ? '0 0 0 10px rgba(220,38,38,.07)' : '0 0 0 6px var(--blue-100)',
          transition: 'all .3s',
        }} className={isRecording ? 'a-blink' : ''}>
          {isTranscribing || isExtracting || state === 'requesting' ? <IcoSpin /> : isDone ? <IcoCheck /> : <IcoMic />}
        </div>

        {/* Timer (during recording) */}
        {isRecording && (
          <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--red)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.05em' }}>
            {fmt(timer)}
          </p>
        )}

        {/* Volume bar (during recording) */}
        {isRecording && (
          <div style={{ height: 6, background: 'rgba(220,38,38,.12)', borderRadius: 99, margin: '0 20px 16px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(volume * 100)}%`, background: 'var(--red)', borderRadius: 99, transition: 'width .06s linear' }} />
          </div>
        )}

        {/* Status text */}
        {!isError && !isDone && (
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--t3)', lineHeight: 1.5 }}>
            {isRecording
              ? (sq ? 'Duke regjistruar... Kliko Ndalo kur të kesh mbaruar.' : 'Recording... Click Stop when finished.')
              : isTranscribing
                ? (sq ? 'Duke transkriptuar me Whisper AI...' : 'Transcribing with Whisper AI...')
              : isExtracting
                ? (sq ? 'Duke ekstraktuar të dhënat...' : 'Extracting data...')
              : state === 'requesting'
                ? (sq ? 'Duke hapur mikrofonin...' : 'Opening microphone...')
              : (sq
                  ? 'Fol shqip, gjermanisht ose anglisht. Regjistrohet me Whisper AI.'
                  : 'Speak Albanian, German or English. Recorded with Whisper AI.')}
          </p>
        )}

        {isError && <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>{errorMsg}</p>}
        {isDone  && <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>{t(lang, 'messages.voiceExtracted')}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isBusy && !isDone && (
            <button onClick={startRecording} className="btn btn-primary" style={{ height: 44, padding: '0 28px', gap: 8 }}>
              <IcoMic /> {sq ? 'Fillo regjistrim' : 'Start recording'}
            </button>
          )}
          {isRecording && (
            <button onClick={stopRecording} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 44, padding: '0 24px', borderRadius: 12, border: 'none',
              background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              <IcoStop /> {sq ? 'Ndalo' : 'Stop'}
            </button>
          )}
          {isError && (
            <button onClick={reset} className="btn btn-ghost" style={{ height: 40, gap: 6, fontSize: 13 }}>
              <IcoRefresh /> {sq ? 'Provo sërish' : 'Try again'}
            </button>
          )}
          {isDone && (
            <button onClick={reset} className="btn btn-ghost" style={{ height: 40, gap: 6, fontSize: 13 }}>
              <IcoRefresh /> {sq ? 'Regjistro sërish' : 'Record again'}
            </button>
          )}
        </div>
      </div>

      {/* ── Transcript / edit ────────────────────────────────── */}
      {transcript && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16 }} className="a-fade-in">
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcoEdit /> {sq ? 'Transkripti — kontrollo dhe korrigjo nëse duhet' : 'Transcript — check and correct if needed'}
          </p>
          <textarea
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--t1)',
              fontSize: 13.5, resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
            rows={4}
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          {!isDone && !isExtracting && (
            <button onClick={extractData} className="btn btn-primary" style={{ marginTop: 10, height: 40, gap: 7 }}>
              <IcoCheck /> {sq ? 'Ekstrakto të dhënat' : 'Extract data'}
            </button>
          )}
          {isExtracting && (
            <button disabled className="btn btn-primary" style={{ marginTop: 10, height: 40, gap: 7, opacity: .7 }}>
              <IcoSpin /> {sq ? 'Duke ekstraktuar...' : 'Extracting...'}
            </button>
          )}
        </div>
      )}

      {/* ── Manual fallback ──────────────────────────────────── */}
      {!isBusy && !transcript && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcoEdit /> {sq ? 'Ose shkruani manualisht' : 'Or type manually'}
          </p>
          <textarea
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--t1)',
              fontSize: 13.5, resize: 'vertical', outline: 'none',
            }}
            rows={3}
            placeholder={sq ? 'Shkruani informacionin e zhdoganimit...' : 'Write customs declaration info...'}
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          {transcript && (
            <button onClick={extractData} className="btn btn-primary" style={{ marginTop: 10, height: 38, fontSize: 13, gap: 6 }}>
              <IcoCheck /> {sq ? 'Ekstrakto' : 'Extract'}
            </button>
          )}
        </div>
      )}

      {/* ── Mic diagnostic button ────────────────────────────── */}
      {!isBusy && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setShowDiag(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--t4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t4)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <IcoBeaker /> {sq ? 'Testo mikrofonin' : 'Test microphone'}
          </button>
        </div>
      )}

      {showDiag && <MicDiagnostic lang={lang} onClose={() => setShowDiag(false)} />}
    </div>
  )
}
