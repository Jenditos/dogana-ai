'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { Language } from '@/types'
import { t } from '@/lib/i18n'

interface Props {
  lang: Language
  onFiles: (files: File[]) => void
  loading: boolean
}

export default function UploadZone({ lang, onFiles, loading }: Props) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    disabled: loading,
  })

  const handleSubmit = () => {
    if (files.length > 0) onFiles(files)
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="text-6xl mb-4">📄</div>
        <p className="text-xl font-medium text-gray-700">
          {isDragActive ? '📂 Lësho dokumentet...' : t(lang, 'messages.dropFiles')}
        </p>
        <p className="text-sm text-gray-500 mt-2">{t(lang, 'messages.supportedFormats')}</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{file.type.includes('pdf') ? '📋' : '🖼️'}</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="text-red-400 hover:text-red-600 text-lg"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
        >
          {loading ? '⏳ ' + t(lang, 'messages.extracting') : '🔍 ' + t(lang, 'buttons.review')}
        </button>

        <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-2xl text-lg cursor-pointer transition-colors">
          📷 {t(lang, 'buttons.photo')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) {
                setFiles(prev => [...prev, e.target.files![0]].slice(0, 10))
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}
