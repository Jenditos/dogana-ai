'use client'
import { useEffect, useRef, useState } from 'react'
import type { Language } from '@/types'

interface Props {
  lang: Language
  onCapture: (file: File) => void
  onClose: () => void
}

const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoFlip = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
)
const IcoCapture = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoRetake = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IcoSpinner = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="a-spin" style={{ color: 'var(--t4)' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

export default function CameraCapture({ lang, onCapture, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [ready,       setReady]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [facingMode,  setFacingMode]  = useState<'environment' | 'user'>('environment')
  const [captured,    setCaptured]    = useState<string | null>(null) // base64 preview
  const [capturedFile,setCapturedFile]= useState<File | null>(null)

  const sq = lang === 'sq'

  /* ── Start / restart camera ── */
  const startCamera = async (facing: 'environment' | 'user') => {
    setError(null)
    setReady(false)
    setCaptured(null)
    setCapturedFile(null)

    // Stop any existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop())

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setReady(true)
        }
      }
    } catch (err: unknown) {
      const e = err as DOMException
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError(sq
          ? 'Qasja në kamerë u refuzua. Lejo kamerën në cilësimet e shfletuesit.'
          : 'Camera access denied. Allow camera in browser settings.')
      } else if (e.name === 'NotFoundError') {
        setError(sq
          ? 'Asnjë kamerë nuk u gjet në këtë pajisje.'
          : 'No camera found on this device.')
      } else {
        setError(sq
          ? `Gabim kamera: ${e.message}`
          : `Camera error: ${e.message}`)
      }
    }
  }

  /* ── Mount / cleanup ── */
  useEffect(() => {
    queueMicrotask(() => startCamera(facingMode))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Capture frame ── */
  const capture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
    }, 'image/jpeg', 0.92)
  }

  /* ── Retake ── */
  const retake = () => {
    setCaptured(null)
    setCapturedFile(null)
    startCamera(facingMode)
  }

  /* ── Flip camera ── */
  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  /* ── Confirm ── */
  const confirm = () => {
    if (capturedFile) {
      onCapture(capturedFile)
      onClose()
    }
  }

  /* ── Close ── */
  const close = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) close() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div className="a-scale-in" style={{
        width: '100%', maxWidth: 680,
        background: '#0F172A', borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 25px 60px rgba(0,0,0,.5)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#F8FAFC' }}>
            {sq ? 'Bëj foto dokumentit' : 'Take document photo'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ready && !captured && (
              <button onClick={flipCamera} title={sq ? 'Ktheje kamerën' : 'Flip camera'} style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid rgba(255,255,255,.15)',
                background: 'rgba(255,255,255,.08)', color: '#94A3B8',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.16)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#94A3B8'; }}
              >
                <IcoFlip />
              </button>
            )}
            <button onClick={close} style={{
              width: 36, height: 36, borderRadius: 9,
              border: '1px solid rgba(255,255,255,.15)',
              background: 'rgba(255,255,255,.08)', color: '#94A3B8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.3)'; e.currentTarget.style.color = '#FCA5A5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <IcoClose />
            </button>
          </div>
        </div>

        {/* ── Viewfinder area ── */}
        <div style={{ position: 'relative', background: '#000', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Error state */}
          {error && (
            <div style={{ padding: '32px 24px', textAlign: 'center', maxWidth: 380 }}>
              <div style={{ color: '#F87171', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <IcoAlert />
              </div>
              <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
              <button onClick={() => startCamera(facingMode)} style={{
                padding: '9px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                color: '#F8FAFC', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
              }}>
                {sq ? 'Provo përsëri' : 'Try again'}
              </button>
            </div>
          )}

          {/* Loading state */}
          {!error && !ready && !captured && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 40 }}>
              <IcoSpinner />
              <p style={{ margin: 0, color: '#64748B', fontSize: 13.5 }}>
                {sq ? 'Duke hapur kamerën...' : 'Opening camera...'}
              </p>
            </div>
          )}

          {/* Live video */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%', maxHeight: 460,
              objectFit: 'cover', display: captured || error ? 'none' : 'block',
            }}
          />

          {/* Captured preview */}
          {captured && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={captured}
              alt="captured"
              style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block' }}
            />
          )}

          {/* Corner guides (live only) */}
          {ready && !captured && (
            <>
              {[['0 0 auto auto', '0 0 0 0'], ['auto 0 0 auto', '0 0 0 0'], ['0 auto auto 0', '0 0 0 0'], ['auto auto 0 0', '0 0 0 0']].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top:    i < 2 ? 16 : undefined, bottom: i >= 2 ? 16 : undefined,
                  left:   i % 2 === 0 ? 16 : undefined, right: i % 2 === 1 ? 16 : undefined,
                  width: 24, height: 24,
                  borderTop:    i < 2 ? '2.5px solid rgba(255,255,255,.6)' : 'none',
                  borderBottom: i >= 2 ? '2.5px solid rgba(255,255,255,.6)' : 'none',
                  borderLeft:   i % 2 === 0 ? '2.5px solid rgba(255,255,255,.6)' : 'none',
                  borderRight:  i % 2 === 1 ? '2.5px solid rgba(255,255,255,.6)' : 'none',
                  borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                }} />
              ))}
            </>
          )}

          {/* Hidden canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* ── Bottom controls ── */}
        <div style={{
          padding: '18px 20px',
          borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          {!captured ? (
            /* Capture button */
            <button
              onClick={capture}
              disabled={!ready}
              style={{
                width: 68, height: 68, borderRadius: '50%', border: 'none',
                background: ready ? '#fff' : 'rgba(255,255,255,.2)',
                color: ready ? '#0F172A' : 'rgba(255,255,255,.3)',
                cursor: ready ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: ready ? '0 0 0 4px rgba(255,255,255,.2)' : 'none',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { if (ready) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 0 6px rgba(255,255,255,.25)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ready ? '0 0 0 4px rgba(255,255,255,.2)' : 'none'; }}
              title={sq ? 'Fotografo' : 'Capture'}
            >
              <IcoCapture />
            </button>
          ) : (
            /* Retake + Confirm */
            <>
              <button onClick={retake} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,.2)',
                background: 'rgba(255,255,255,.08)', color: '#CBD5E1',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.14)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#CBD5E1'; }}
              >
                <IcoRetake /> {sq ? 'Rifoto' : 'Retake'}
              </button>
              <button onClick={confirm} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 28px', borderRadius: 12,
                border: 'none', background: 'var(--blue)', color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s',
                boxShadow: '0 2px 12px rgba(27,80,216,.4)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.transform = 'none'; }}
              >
                <IcoCheck /> {sq ? 'Përdor foton' : 'Use photo'}
              </button>
            </>
          )}
        </div>

        {/* Hint */}
        <p style={{ margin: 0, padding: '0 20px 14px', fontSize: 11.5, color: '#475569', textAlign: 'center' }}>
          {sq ? 'Vendos dokumentin sheshtas dhe fotografoje qartë.' : 'Place the document flat and photograph it clearly.'}
        </p>
      </div>
    </div>
  )
}
