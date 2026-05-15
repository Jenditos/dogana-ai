'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Language, HeaderData } from '@/types'
import { t } from '@/lib/i18n'

/* ── Types ───────────────────────────────────────────────────── */
type VoiceState = 'idle' | 'requesting' | 'listening' | 'processing' | 'done' | 'error'
interface AudioDevice { deviceId: string; label: string }

interface Props {
  lang: Language
  onExtracted: (data: Partial<HeaderData>) => void
}

/* ── Avoid picking these mics automatically ──────────────────── */
const AVOID_TERMS = ['iphone', 'continuity', 'airpod', 'bluetooth', 'android', 'samsung']
function isAvoidedMic(label: string) {
  return AVOID_TERMS.some(t => label.toLowerCase().includes(t))
}
function pickPreferred(devices: AudioDevice[]): AudioDevice | null {
  if (!devices.length) return null
  return devices.find(d => !isAvoidedMic(d.label)) ?? devices[0]
}

/* ── SpeechRecognition language map ─────────────────────────── */
const SR_LANG: Record<string, string> = { sq: 'sq-AL', de: 'de-DE', en: 'en-US' }

/* ── SVG Icons (no emoji) ────────────────────────────────────── */
const IcoMic = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IcoStop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
  </svg>
)
const IcoCheck = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoSpinner = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoDevice = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
)

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */
export default function VoiceInput({ lang, onExtracted }: Props) {
  const [voiceState,       setVoiceState]       = useState<VoiceState>('idle')
  const [devices,          setDevices]          = useState<AudioDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [transcript,       setTranscript]       = useState('')
  const [interimText,      setInterimText]      = useState('')
  const [errorMsg,         setErrorMsg]         = useState('')
  const [devicesLoaded,    setDevicesLoaded]    = useState(false)

  /* Refs — avoid stale closures inside SR callbacks */
  const isListeningRef  = useRef(false)
  const recognitionRef  = useRef<unknown>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const restartTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptRef   = useRef('')   // mirrors transcript state, readable inside callbacks

  const sq = lang === 'sq'

  /* ── Enumerate audio input devices ──────────────────────────── */
  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const all  = await navigator.mediaDevices.enumerateDevices()
      const mics = all
        .filter(d => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone (${d.deviceId.slice(0, 8)})` }))

      console.log('[Voice] devices:', mics.map(d => `"${d.label}" [${d.deviceId.slice(0, 10)}]`).join(', '))
      setDevices(mics)
      setDevicesLoaded(true)

      setSelectedDeviceId(prev => {
        if (prev && mics.find(d => d.deviceId === prev)) return prev
        const preferred = pickPreferred(mics)
        if (preferred) console.log('[Voice] Auto-selected:', preferred.label)
        return preferred?.deviceId ?? ''
      })
    } catch (e) {
      console.warn('[Voice] enumerateDevices error:', e)
    }
  }, [])

  /* ── Mount / unmount ─────────────────────────────────────────── */
  useEffect(() => {
    // Request mic briefly just to unlock device labels in the browser
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(s => { s.getTracks().forEach(t => t.stop()); enumerateDevices() })
      .catch(() => enumerateDevices())

    const onChange = () => { console.log('[Voice] devicechange'); enumerateDevices() }
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange)
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange)
      destroyAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Destroy all active resources ───────────────────────────── */
  const destroyAll = () => {
    isListeningRef.current = false
    if (restartTimer.current) { clearTimeout(restartTimer.current); restartTimer.current = null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (recognitionRef.current as any)?.stop() } catch {}
    recognitionRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setInterimText('')
  }

  /* ── Spawn a fresh SpeechRecognition instance ────────────────── */
  // Called on first start AND on every auto-restart
  const spawnRecognition = useCallback(() => {
    if (!isListeningRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SR  = win.webkitSpeechRecognition || win.SpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognitionRef.current = recognition

    recognition.lang            = SR_LANG[lang] ?? 'en-US'
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => console.log('[Voice] SR started, lang:', recognition.lang)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let finalChunk = ''
      let interim    = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) finalChunk += text
        else                      interim    += text
      }
      if (finalChunk) {
        const sep = transcriptRef.current ? ' ' : ''
        transcriptRef.current += sep + finalChunk.trim()
        setTranscript(transcriptRef.current)
      }
      setInterimText(interim)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      console.warn('[Voice] SR error:', e.error)
      // "no-speech" is not fatal — onend fires next and we restart
      if (e.error === 'no-speech') return
      if (e.error === 'audio-capture') {
        destroyAll()
        setErrorMsg(sq
          ? 'Mikrofoni nuk mund të kapet. Kontrollo cilësimet e sistemit.'
          : 'Microphone cannot be captured. Check system settings.')
        setVoiceState('error')
      }
      if (e.error === 'not-allowed') {
        destroyAll()
        setErrorMsg(sq ? 'Qasja u refuzua.' : 'Access denied.')
        setVoiceState('error')
      }
    }

    /* ── KEY FIX: auto-restart as long as user hasn't pressed Stop ── */
    recognition.onend = () => {
      console.log('[Voice] SR ended | isListening:', isListeningRef.current)
      setInterimText('')
      if (isListeningRef.current) {
        restartTimer.current = setTimeout(spawnRecognition, 200)
      }
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('[Voice] recognition.start() failed:', err)
      // Retry after a brief pause
      restartTimer.current = setTimeout(spawnRecognition, 400)
    }
  }, [lang, sq]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Start (user-initiated) ──────────────────────────────────── */
  const startListening = async () => {
    setErrorMsg('')
    setVoiceState('requesting')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      setErrorMsg(sq
        ? 'Shfletuesi nuk mbështet njohjen e zërit. Shkruaj tekstin manualisht.'
        : 'Browser does not support speech recognition. Type text manually.')
      setVoiceState('error')
      return
    }

    // Acquire the stream from the selected device.
    // Keeping the stream alive "locks" audio routing in Chrome,
    // making SpeechRecognition more likely to use the same device.
    try {
      const audioConstraints: MediaTrackConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        : { echoCancellation: true, noiseSuppression: true, autoGainControl: true }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      streamRef.current = stream

      const track = stream.getAudioTracks()[0]
      console.log(`[Voice] Using mic: "${track.label}" | deviceId: ${track.getSettings().deviceId ?? 'unknown'}`)

      // Detect hardware disconnect mid-session
      track.addEventListener('ended', () => {
        if (!isListeningRef.current) return
        console.warn('[Voice] Audio track ended unexpectedly')
        destroyAll()
        setErrorMsg(sq
          ? 'Mikrofoni u shkëput. Ju lutem zgjidhni mikrofonin e MacBook.'
          : 'Microphone disconnected. Please select the MacBook microphone.')
        setVoiceState('error')
        enumerateDevices()
      })
    } catch (err: unknown) {
      const e = err as DOMException
      console.error('[Voice] getUserMedia failed:', e.name, e.message)
      const msg =
        e.name === 'NotAllowedError'    ? (sq ? 'Qasja u refuzua. Lejo mikrofonin në cilësimet e shfletuesit.' : 'Access denied. Allow microphone in browser settings.') :
        e.name === 'NotFoundError'      ? (sq ? 'Asnjë mikrofon nuk u gjet.' : 'No microphone found.') :
        e.name === 'OverconstrainedError' ? (sq ? 'Mikrofoni i zgjedhur nuk është i disponueshëm. Zgjidh tjetrin.' : 'Selected mic unavailable. Choose another.') :
        `${sq ? 'Gabim' : 'Error'}: ${e.message}`
      setErrorMsg(msg)
      setVoiceState('error')
      return
    }

    isListeningRef.current = true
    transcriptRef.current  = transcript
    setVoiceState('listening')
    spawnRecognition()
  }

  /* ── Stop (user-initiated) ───────────────────────────────────── */
  const handleStop = () => {
    destroyAll()
    setVoiceState('idle')
  }

  /* ── Send transcript to AI ───────────────────────────────────── */
  const processTranscript = async () => {
    if (!transcript.trim()) return
    setVoiceState('processing')
    try {
      const res  = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()
      if (data.header) { onExtracted(data.header); setVoiceState('done') }
      else throw new Error(data.error || 'No data returned')
    } catch (err: unknown) {
      const e = err as Error
      setErrorMsg(e.message || (sq ? 'Gabim gjatë procesimit.' : 'Processing error.'))
      setVoiceState('error')
    }
  }

  /* ── Reset ───────────────────────────────────────────────────── */
  const reset = () => {
    setTranscript(''); transcriptRef.current = ''
    setInterimText(''); setErrorMsg('')
    setVoiceState('idle')
  }

  /* ── Derived booleans ────────────────────────────────────────── */
  const isListening   = voiceState === 'listening'
  const isRequesting  = voiceState === 'requesting'
  const isProcessing  = voiceState === 'processing'
  const isDone        = voiceState === 'done'
  const isError       = voiceState === 'error'
  const isBusy        = isListening || isRequesting || isProcessing

  /* ── State label / color ─────────────────────────────────────── */
  const stateLabel = {
    idle:       sq ? 'Gati'          : 'Ready',
    requesting: sq ? 'Duke hapur...' : 'Opening...',
    listening:  sq ? 'Duke dëgjuar'  : 'Listening',
    processing: sq ? 'Duke procesuar': 'Processing',
    done:       sq ? 'Gatë'          : 'Done',
    error:      sq ? 'Gabim'         : 'Error',
  }[voiceState]

  const stateColor = {
    idle: 'var(--t4)', requesting: 'var(--blue)',
    listening: 'var(--red)', processing: 'var(--blue)',
    done: 'var(--green)', error: 'var(--red)',
  }[voiceState]

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Device selector ──────────────────────────────────────── */}
      {devicesLoaded && devices.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className="a-fade-in">
          <label style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--t4)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <IcoDevice />
            {sq ? 'Mikrofoni' : 'Microphone'}
          </label>
          <select
            value={selectedDeviceId}
            onChange={e => setSelectedDeviceId(e.target.value)}
            disabled={isBusy}
            style={{
              width: '100%', padding: '9px 12px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--t1)',
              fontSize: 13.5, outline: 'none', cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? .6 : 1,
            }}
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {isAvoidedMic(d.label) ? `⚠ ${d.label}` : d.label}
              </option>
            ))}
          </select>
          {selectedDeviceId && isAvoidedMic(devices.find(d => d.deviceId === selectedDeviceId)?.label ?? '') && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcoAlert />
              {sq ? 'iPhone/Continuity mikrofoni mund të shkëputet. Zgjidh mikrofonin e MacBook.' : 'iPhone/Continuity mic may disconnect. Prefer the MacBook microphone.'}
            </p>
          )}
        </div>
      )}

      {/* ── Main voice area ──────────────────────────────────────── */}
      <div style={{
        background: isListening ? 'rgba(220,38,38,.03)' : isError ? 'var(--red-bg)' : isDone ? 'var(--green-bg)' : 'var(--surface-2)',
        border: `1.5px solid ${isListening ? 'var(--red-bdr)' : isError ? 'var(--red-bdr)' : isDone ? 'var(--green-bdr)' : 'var(--border)'}`,
        borderRadius: 16, padding: '24px', textAlign: 'center',
        transition: 'all .25s',
      }}>

        {/* Mic button / state icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
          background: isListening ? 'var(--red-bg)' : isError ? 'var(--red-bg)' : isDone ? 'var(--green-bg)' : 'var(--blue-50)',
          color: isListening ? 'var(--red)' : isError ? 'var(--red)' : isDone ? 'var(--green)' : 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isListening ? '0 0 0 10px rgba(220,38,38,.07)' : '0 0 0 6px var(--blue-100)',
          transition: 'all .3s',
        }} className={isListening ? 'a-blink' : ''}>
          {isProcessing || isRequesting ? <IcoSpinner /> : isDone ? <IcoCheck size={28} /> : <IcoMic />}
        </div>

        {/* State badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: stateColor,
            display: 'inline-block',
          }} className={isListening ? 'a-blink' : ''} />
          <span style={{ fontSize: 12, fontWeight: 700, color: stateColor, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            {stateLabel}
          </span>
        </div>

        {/* Instruction */}
        {!isError && !isDone && (
          <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5 }}>
            {isListening
              ? (sq ? 'Flisni... Klikoni Ndalo kur të keni mbaruar.' : 'Speak... Click Stop when finished.')
              : isRequesting
                ? (sq ? 'Duke hapur mikrofonin...' : 'Opening microphone...')
                : (sq
                    ? 'Shqip, gjermanisht ose anglisht. P.sh: "Importuesi është FALURA SH.P.K., kontejneri CAIU7808456"'
                    : 'Albanian, German or English. E.g. "Importer is FALURA SH.P.K., container CAIU7808456"')}
          </p>
        )}

        {/* Error message */}
        {isError && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>
            {errorMsg}
          </p>
        )}

        {/* Done message */}
        {isDone && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            {t(lang, 'messages.voiceExtracted')}
          </p>
        )}

        {/* Interim text (live) */}
        {isListening && interimText && (
          <p style={{
            margin: '0 0 16px', fontSize: 13, color: 'var(--t4)',
            fontStyle: 'italic', lineHeight: 1.4,
            background: 'rgba(220,38,38,.05)', borderRadius: 8, padding: '6px 10px',
          }}>
            {interimText}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isBusy && !isDone && (
            <button onClick={startListening} className="btn btn-primary" style={{ height: 44, padding: '0 28px', gap: 8 }}>
              <IcoMic size={18} /> {t(lang, 'buttons.voice')}
            </button>
          )}
          {isListening && (
            <button onClick={handleStop} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 44, padding: '0 24px', borderRadius: 12, border: 'none',
              background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              <IcoStop /> {sq ? 'Ndalo' : 'Stop'}
            </button>
          )}
          {isError && (
            <button onClick={() => { setErrorMsg(''); setVoiceState('idle') }} className="btn btn-ghost" style={{ height: 40, gap: 6, fontSize: 13 }}>
              <IcoRefresh /> {sq ? 'Provo përsëri' : 'Try again'}
            </button>
          )}
          {isDone && (
            <button onClick={reset} className="btn btn-ghost" style={{ height: 40, gap: 6, fontSize: 13 }}>
              <IcoRefresh /> {sq ? 'Fillo nga e para' : 'Start over'}
            </button>
          )}
        </div>
      </div>

      {/* ── Transcript area ───────────────────────────────────────── */}
      {(transcript || isListening) && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16 }} className="a-fade-in">
          <p style={{
            margin: '0 0 8px', fontSize: 11, fontWeight: 700,
            letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <IcoEdit /> {sq ? 'Teksti i njohur' : 'Recognized text'}
          </p>
          <textarea
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--t1)',
              fontSize: 13.5, resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
            rows={3}
            value={transcript}
            onChange={e => { setTranscript(e.target.value); transcriptRef.current = e.target.value }}
            placeholder={isListening ? (sq ? 'Fjalimi do të shfaqet këtu...' : 'Speech will appear here...') : ''}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          {transcript && !isListening && !isDone && !isProcessing && (
            <button onClick={processTranscript} className="btn btn-primary" style={{ marginTop: 10, height: 40, gap: 7 }}>
              <IcoCheck /> {sq ? 'Ekstrakto të dhënat' : 'Extract data'}
            </button>
          )}
          {isProcessing && (
            <button disabled className="btn btn-primary" style={{ marginTop: 10, height: 40, gap: 7, opacity: .7 }}>
              <IcoSpinner /> {sq ? 'Duke procesuar...' : 'Processing...'}
            </button>
          )}
        </div>
      )}

      {/* ── Manual text fallback ──────────────────────────────────── */}
      {!isListening && !transcript && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{
            margin: '0 0 8px', fontSize: 11, fontWeight: 700,
            letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
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
            onChange={e => { setTranscript(e.target.value); transcriptRef.current = e.target.value }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          {transcript && (
            <button onClick={processTranscript} className="btn btn-primary" style={{ marginTop: 10, height: 38, fontSize: 13, gap: 6 }}>
              <IcoCheck /> {sq ? 'Ekstrakto' : 'Extract'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
