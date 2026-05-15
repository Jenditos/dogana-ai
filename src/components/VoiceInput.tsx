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

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-2xl p-6 text-center space-y-4">
        <div className="text-5xl">{recording ? '🎙️' : '🎤'}</div>
        <p className="text-gray-600 text-sm">
          {lang === 'sq'
            ? 'Flisni shqip, gjermanisht ose anglisht. Për shembull: "Importuesi është FALURA SH.P.K., kontejneri CAIU7808456"'
            : 'Speak in Albanian, German or English. Example: "Importer is FALURA SH.P.K., container CAIU7808456"'}
        </p>

        <div className="flex justify-center gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-2xl text-lg"
            >
              🎤 {t(lang, 'buttons.voice')}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-2xl text-lg animate-pulse"
            >
              ⏹ Ndalo
            </button>
          )}
        </div>

        {transcript && (
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Teksti i njohur:</p>
            <textarea
              className="w-full border border-purple-200 rounded-xl p-3 text-sm bg-white"
              rows={3}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
            />
          </div>
        )}

        {transcript && !done && (
          <button
            onClick={processTranscript}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-2xl"
          >
            {loading ? '⏳ Duke procesuar...' : '✓ Ekstrakto të dhënat'}
          </button>
        )}

        {done && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-3">
            <p className="text-green-800 font-medium">{t(lang, 'messages.voiceExtracted')}</p>
          </div>
        )}
      </div>

      {/* Manual text input fallback */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-600 mb-2">📝 Ose shkruani manualisht:</p>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm"
          rows={3}
          placeholder={lang === 'sq' ? 'Shkruani informacionin e zhdoganimit...' : 'Write customs declaration info...'}
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
        />
        {transcript && (
          <button
            onClick={processTranscript}
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-xl text-sm"
          >
            {loading ? '⏳' : '✓'} Ekstrakto
          </button>
        )}
      </div>
    </div>
  )
}
