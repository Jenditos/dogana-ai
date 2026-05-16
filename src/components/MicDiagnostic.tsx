'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Language } from '@/types'

interface Props { lang: Language; onClose: () => void }

interface DeviceInfo {
  deviceId: string
  label: string
  isPreferred: boolean
  isAvoided: boolean
}

type TestStep = 'idle' | 'devices' | 'audio' | 'speech' | 'done'

const AVOID_TERMS = ['iphone', 'continuity', 'airpod', 'bluetooth', 'android', 'samsung']

/* ── SVGs ── */
const IcoClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoWarn  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoSpin  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>

type Result = 'pending' | 'ok' | 'warn' | 'fail'

interface CheckResult { label: string; status: Result; detail: string }

export default function MicDiagnostic({ lang, onClose }: Props) {
  const sq = lang === 'sq'

  const [step,      setStep]      = useState<TestStep>('idle')
  const [volume,    setVolume]    = useState(0)   // 0–1
  const [peakVol,   setPeakVol]   = useState(0)
  const [devices,   setDevices]   = useState<DeviceInfo[]>([])
  const [selDevice, setSelDevice] = useState<string>('')
  const [srText,    setSrText]    = useState('')
  const [,          setSrStatus]  = useState<Result>('pending')
  const [checks,    setChecks]    = useState<CheckResult[]>([])
  const [running,   setRunning]   = useState(false)

  const streamRef  = useRef<MediaStream | null>(null)
  const audioCtxRef= useRef<AudioContext | null>(null)
  const rafRef     = useRef<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const srRef      = useRef<any>(null)

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try { srRef.current?.stop() } catch {}
    try { audioCtxRef.current?.close() } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  /* cleanup on unmount */
  useEffect(() => () => { cleanup() }, [])

  const addCheck = (c: CheckResult) => setChecks(prev => [...prev, c])

  /* ── STEP 1: enumerate devices ──────────────────────────────── */
  const runDeviceCheck = useCallback(async (): Promise<DeviceInfo[]> => {
    addCheck({ label: sq ? 'Shfletuesi' : 'Browser', status: 'pending', detail: '' })
    if (!navigator.mediaDevices?.getUserMedia) {
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: sq ? 'getUserMedia nuk mbështetet' : 'getUserMedia not supported'} : c))
      return []
    }
    setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'ok', detail:'getUserMedia OK'} : c))

    // Permission check
    addCheck({ label: sq ? 'Leje mikrofoni' : 'Mic permission', status: 'pending', detail: '' })
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ audio: true })
      tmp.getTracks().forEach(t => t.stop())
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'ok', detail: sq ? 'Leja u dha' : 'Permission granted'} : c))
    } catch (e: unknown) {
      const err = e as DOMException
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: err.name+': '+err.message} : c))
      return []
    }

    // List devices
    addCheck({ label: sq ? 'Pajisjet audio' : 'Audio devices', status: 'pending', detail: '' })
    const all = await navigator.mediaDevices.enumerateDevices()
    const mics = all.filter(d => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
    const devList: DeviceInfo[] = mics.map(d => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone (${d.deviceId.slice(0,8)})`,
      isAvoided: AVOID_TERMS.some(t => d.label.toLowerCase().includes(t)),
      isPreferred: !AVOID_TERMS.some(t => d.label.toLowerCase().includes(t)),
    }))
    const preferred = devList.find(d => d.isPreferred) ?? devList[0]
    if (preferred) setSelDevice(preferred.deviceId)
    setDevices(devList)
    setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {
      ...c,
      status: devList.length ? 'ok' : 'fail',
      detail: devList.length
        ? `${devList.length} ${sq ? 'pajisje u gjetën' : 'device(s) found'}`
        : sq ? 'Asnjë mikrofon u gjet' : 'No microphone found',
    } : c))
    return devList
  }, [sq])

  /* ── STEP 2: audio level test ───────────────────────────────── */
  const runAudioTest = useCallback(async (deviceId: string) => {
    addCheck({ label: sq ? 'Niveli audio (5 sek)' : 'Audio level (5 sec)', status: 'pending', detail: sq ? 'Fol ose bëj zë...' : 'Speak or make a sound...' })

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: false }
          : { echoCancellation: true, noiseSuppression: false },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const track = stream.getAudioTracks()[0]
      const settings = track.getSettings()
      console.log(`[MicDiag] Track: "${track.label}" | deviceId: ${settings.deviceId}`)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const ctx      = new AudioCtx()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)

      let maxPeak = 0
      let frames  = 0
      const totalFrames = 5 * 60 // ~5 seconds at 60fps

      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += (v - 128) ** 2
        const rms = Math.sqrt(sum / buf.length) / 128
        setVolume(Math.min(1, rms * 4))
        if (rms > maxPeak) { maxPeak = rms; setPeakVol(Math.min(1, rms * 4)) }
        frames++
        if (frames < totalFrames) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          // Done — evaluate
          cancelAnimationFrame(rafRef.current!)
          cleanup()
          setVolume(0)
          const heard = maxPeak > 0.01
          setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {
            ...c,
            status: heard ? 'ok' : 'warn',
            detail: heard
              ? `${sq ? 'Zëri u dëgjua' : 'Audio detected'} (peak ${(maxPeak*100).toFixed(1)}%)`
              : sq ? 'Asnjë zë nuk u dëgjua — mikrofoni mund të jetë i heshtur' : 'No audio detected — microphone may be muted',
          } : c))
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (e: unknown) {
      const err = e as DOMException
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: err.name+': '+err.message} : c))
    }
  }, [sq])

  /* ── STEP 3: SpeechRecognition test ─────────────────────────── */
  const runSRTest = useCallback(() => {
    addCheck({ label: sq ? 'SpeechRecognition' : 'SpeechRecognition', status: 'pending', detail: sq ? 'Thuaj diçka...' : 'Say something...' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SR  = win.webkitSpeechRecognition || win.SpeechRecognition
    if (!SR) {
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: sq ? 'SpeechRecognition nuk mbështetet' : 'SpeechRecognition not supported'} : c))
      setSrStatus('fail')
      return
    }

    const recognition = new SR()
    srRef.current = recognition
    recognition.lang = lang === 'sq' ? 'sq-AL' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let gotResult = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      gotResult = true
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setSrText(text)
    }
    recognition.onend = () => {
      setSrStatus(gotResult ? 'ok' : 'warn')
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {
        ...c,
        status: gotResult ? 'ok' : 'warn',
        detail: gotResult
          ? `${sq ? 'U njoh' : 'Recognized'}: "${srText || '...'}"`
          : sq ? 'Asnjë fjalim u njoh (30 sekonda)' : 'No speech recognized (30 seconds)',
      } : c))
      setStep('done')
      setRunning(false)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setSrStatus('fail')
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: `error: ${e.error}`} : c))
      setStep('done'); setRunning(false)
    }

    setTimeout(() => {
      if (!gotResult) { try { recognition.stop() } catch {} }
    }, 10000)

    try { recognition.start() } catch (e) {
      setChecks(prev => prev.map((c,i) => i===prev.length-1 ? {...c, status:'fail', detail: String(e)} : c))
      setStep('done'); setRunning(false)
    }
  }, [lang, sq, srText])

  /* ── Run full diagnostic ─────────────────────────────────────── */
  const runDiagnostic = useCallback(async () => {
    cleanup()
    setChecks([])
    setDevices([])
    setVolume(0); setPeakVol(0)
    setSrText(''); setSrStatus('pending')
    setRunning(true)
    setStep('devices')

    const devList = await runDeviceCheck()
    if (!devList.length) { setStep('done'); setRunning(false); return }

    const preferred = devList.find(d => d.isPreferred) ?? devList[0]
    const useId = selDevice || preferred.deviceId

    setStep('audio')
    await runAudioTest(useId)

    // Wait for audio test to complete (5 sec timer inside runAudioTest)
    // SR test starts after audio test finishes (via a setTimeout)
    setTimeout(() => {
      setStep('speech')
      runSRTest()
    }, 5500)
  }, [runDeviceCheck, runAudioTest, runSRTest, selDevice])

  /* ── Result icon ─────────────────────────────────────────────── */
  const ResultIcon = ({ status }: { status: Result }) => {
    if (status === 'pending') return <IcoSpin />
    if (status === 'ok')      return <span style={{ color: 'var(--green)' }}><IcoCheck /></span>
    if (status === 'warn')    return <span style={{ color: 'var(--amber)' }}><IcoWarn /></span>
    return <span style={{ color: 'var(--red)' }}><IcoX /></span>
  }

  const allDone = step === 'done'
  const allOk   = checks.every(c => c.status === 'ok')
  const hasFail = checks.some(c => c.status === 'fail')

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div className="a-scale-in" style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)', borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-xl)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
              {sq ? 'Diagnoza e mikrofonit' : 'Microphone diagnostic'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--t4)' }}>
              {sq ? 'Testo mikrofonin hap pas hapi' : 'Test your microphone step by step'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t3)' }}
          ><IcoClose /></button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', maxHeight: '70vh' }}>

          {/* Device selector */}
          {devices.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t4)', display: 'block', marginBottom: 6 }}>
                {sq ? 'Zgjidhni mikrofonin për test' : 'Select microphone to test'}
              </label>
              <select
                value={selDevice}
                onChange={e => setSelDevice(e.target.value)}
                disabled={running}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--t1)', fontSize: 13.5, outline: 'none', cursor: running ? 'not-allowed' : 'pointer' }}
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.isAvoided ? `⚠ ${d.label}` : d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Volume meter (shown during audio test) */}
          {step === 'audio' && (
            <div className="a-fade-in">
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>
                {sq ? 'Fol ose bëj zë — shiko nëse shiriti lëviz' : 'Speak or make a sound — watch the bar move'}
              </p>
              {/* Bar */}
              <div style={{ height: 28, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(volume * 100)}%`,
                  background: volume > 0.6 ? 'var(--green)' : volume > 0.2 ? 'var(--blue)' : 'var(--border-2)',
                  borderRadius: 99,
                  transition: 'width .06s linear, background .2s',
                }} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--t4)' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--t4)' }}>
                Peak: {Math.round(peakVol * 100)}%
                {peakVol < 0.05 ? ` — ${sq ? 'asnjë zë akoma' : 'no audio yet'}` : peakVol > 0.2 ? ` ✓ ${sq ? 'mikrofoni punon!' : 'microphone working!'}` : ''}
              </p>
            </div>
          )}

          {/* SR live text */}
          {step === 'speech' && (
            <div className="a-fade-in" style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11.5, fontWeight: 600, color: 'var(--blue)' }}>
                {sq ? 'Thuaj diçka shqip ose anglisht (10 sekonda)...' : 'Say something in Albanian or English (10 seconds)...'}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--t1)', minHeight: 22, fontStyle: srText ? 'normal' : 'italic' }}>
                {srText || (sq ? 'duke pritur fjalimin...' : 'waiting for speech...')}
              </p>
            </div>
          )}

          {/* Checklist */}
          {checks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checks.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                  background: c.status === 'ok' ? 'var(--green-bg)' : c.status === 'fail' ? 'var(--red-bg)' : c.status === 'warn' ? 'var(--amber-bg)' : 'var(--surface-2)',
                  border: `1px solid ${c.status === 'ok' ? 'var(--green-bdr)' : c.status === 'fail' ? 'var(--red-bdr)' : c.status === 'warn' ? 'var(--amber-bdr)' : 'var(--border)'}`,
                  borderRadius: 10,
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}><ResultIcon status={c.status} /></span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{c.label}</p>
                    {c.detail && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--t3)', fontFamily: c.detail.includes(':') ? 'monospace' : 'inherit' }}>{c.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Final verdict */}
          {allDone && (
            <div style={{
              padding: '14px 16px', borderRadius: 12, textAlign: 'center',
              background: hasFail ? 'var(--red-bg)' : allOk ? 'var(--green-bg)' : 'var(--amber-bg)',
              border: `1px solid ${hasFail ? 'var(--red-bdr)' : allOk ? 'var(--green-bdr)' : 'var(--amber-bdr)'}`,
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: hasFail ? 'var(--red)' : allOk ? 'var(--green)' : 'var(--amber)' }}>
                {hasFail
                  ? (sq ? 'Problem me mikrofonin — shih detajet' : 'Microphone problem — see details above')
                  : allOk
                    ? (sq ? 'Mikrofoni punon normalisht!' : 'Microphone works correctly!')
                    : (sq ? 'Mikrofoni punon por me disa kufizime' : 'Microphone works but with some limitations')}
              </p>
              {hasFail && (
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
                  {sq ? 'Kontrollo: System Preferences → Security & Privacy → Microphone. Sigurohu që shfletuesi ka leje.' : 'Check: System Preferences → Security & Privacy → Microphone. Ensure the browser has permission.'}
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={runDiagnostic}
              disabled={running}
              style={{
                flex: 1, height: 44, borderRadius: 11, border: 'none',
                background: running ? 'var(--blue-100)' : 'var(--blue)',
                color: running ? 'var(--blue)' : '#fff',
                fontWeight: 700, fontSize: 14, cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .2s',
              }}
            >
              {running ? <><IcoSpin />{sq ? 'Duke testuar...' : 'Testing...'}</> : (allDone ? (sq ? 'Testo përsëri' : 'Test again') : (sq ? 'Fillo testin' : 'Start test'))}
            </button>
            {allDone && (
              <button onClick={onClose} style={{
                height: 44, padding: '0 18px', borderRadius: 11,
                border: '1px solid var(--border)', background: 'var(--surface-3)',
                color: 'var(--t2)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
              }}>
                {sq ? 'Mbyll' : 'Close'}
              </button>
            )}
          </div>

          {/* Instructions if failed */}
          {hasFail && (
            <details style={{ fontSize: 12.5, color: 'var(--t3)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
                {sq ? 'Si të rregullosh' : 'How to fix'}
              </summary>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>{sq ? 'System Preferences → Security & Privacy → Microphone → aktivizo shfletuesin' : 'System Preferences → Security & Privacy → Microphone → enable your browser'}</li>
                <li>{sq ? 'Mbyll dhe rihap shfletuesin' : 'Quit and reopen the browser'}</li>
                <li>{sq ? 'Provo me Chrome ose Safari nëse problem vazhdon' : 'Try Chrome or Safari if the problem continues'}</li>
                <li>{sq ? 'Kontrollo nëse ndonjë program tjetër e bllokon mikrofonin' : 'Check if another app is blocking the microphone'}</li>
              </ol>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
