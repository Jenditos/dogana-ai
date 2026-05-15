'use client'
import { useState, useRef } from 'react'
import type { Language, HeaderData } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  onExtracted: (data: Partial<HeaderData>) => void
}

export default function VoiceInput({ lang, onExtracted }: Props) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      alert('Shfletuesi juaj nuk mbështet hyrjen me zë. Ju lutem shkruani tekstin manualisht.')
      return
    }

    const SR = win.webkitSpeechRecognition || win.SpeechRecognition
    const recognition = new SR()
    recognition.lang = lang === 'sq' ? 'sq-AL' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setTranscript(text)
    }

    recognition.onend = () => setRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
    setDone(false)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const processTranscript = async () => {
    if (!transcript) return
    setLoading(true)
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = await res.json()
      if (data.header) {
        onExtracted(data.header)
        setDone(true)
      }
    } catch {
      alert('Gabim gjatë procesimit të zërit')
    } finally {
      setLoading(false)
    }
  }

  const IcoMic = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
  const IcoStop = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3"/>
    </svg>
  )
  const IcoSpinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="a-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
  const IcoCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
  const IcoEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Voice area */}
      <div style={{
        background: recording ? 'rgba(220,38,38,.04)' : 'var(--surface-2)',
        border: `1.5px solid ${recording ? 'var(--red-bdr)' : 'var(--border)'}`,
        borderRadius: 16, padding: '28px 24px', textAlign: 'center',
        transition: 'all .2s',
      }}>
        {/* Mic icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
          background: recording ? 'var(--red-bg)' : 'var(--blue-50)',
          color: recording ? 'var(--red)' : 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: recording ? '0 0 0 8px rgba(220,38,38,.08)' : '0 0 0 6px var(--blue-100)',
          transition: 'all .3s',
        }} className={recording ? 'a-blink' : ''}>
          <IcoMic />
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
          {recording
            ? (lang === 'sq' ? 'Duke dëgjuar...' : 'Listening...')
            : (lang === 'sq' ? 'Fol me zë' : 'Speak')}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5 }}>
          {lang === 'sq'
            ? 'Shqip, gjermanisht ose anglisht. P.sh: "Importuesi është FALURA SH.P.K., kontejneri CAIU7808456"'
            : 'Albanian, German or English. E.g. "Importer is FALURA SH.P.K., container CAIU7808456"'}
        </p>

        {!recording ? (
          <button onClick={startRecording} className="btn btn-primary" style={{ height: 44, padding: '0 28px', gap: 8 }}>
            <IcoMic />
            {t(lang, 'buttons.voice')}
          </button>
        ) : (
          <button onClick={stopRecording} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 44, padding: '0 28px', borderRadius: 12, border: 'none',
            background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            <IcoStop />
            {lang === 'sq' ? 'Ndalo' : 'Stop'}
          </button>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 16 }} className="a-fade-in">
          <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcoEdit /> {lang === 'sq' ? 'Teksti i njohur' : 'Recognized text'}
          </p>
          <textarea
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', color: 'var(--t1)',
              fontSize: 13.5, resize: 'vertical', outline: 'none',
            }}
            rows={3}
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          {!done && (
            <button onClick={processTranscript} disabled={loading} className="btn btn-primary" style={{ marginTop: 10, height: 40, gap: 7 }}>
              {loading ? <><IcoSpinner />{lang === 'sq' ? 'Duke procesuar...' : 'Processing...'}</> : <><IcoCheck />{lang === 'sq' ? 'Ekstrakto të dhënat' : 'Extract data'}</>}
            </button>
          )}
          {done && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
              <IcoCheck />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t(lang, 'messages.voiceExtracted')}</span>
            </div>
          )}
        </div>
      )}

      {/* Manual fallback */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <IcoEdit /> {lang === 'sq' ? 'Ose shkruani manualisht' : 'Or type manually'}
        </p>
        <textarea
          style={{
            width: '100%', padding: '10px 12px',
            border: '1.5px solid var(--border)', borderRadius: 10,
            background: 'var(--surface)', color: 'var(--t1)',
            fontSize: 13.5, resize: 'vertical', outline: 'none',
          }}
          rows={3}
          placeholder={lang === 'sq' ? 'Shkruani informacionin e zhdoganimit...' : 'Write customs declaration info...'}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          onFocus={e => { e.target.style.borderColor = 'var(--blue)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        {transcript && (
          <button onClick={processTranscript} disabled={loading} className="btn btn-primary" style={{ marginTop: 10, height: 38, fontSize: 13, gap: 6 }}>
            {loading ? <IcoSpinner /> : <IcoCheck />}
            {lang === 'sq' ? 'Ekstrakto' : 'Extract'}
          </button>
        )}
      </div>
    </div>
  )
}
