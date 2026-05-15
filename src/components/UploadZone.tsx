'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { Language } from '@/types'

interface Props {
  lang: Language
  onFiles: (files: File[]) => void
  loading: boolean
}

const UploadCloudIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const FileIcon = ({ isPdf }: { isPdf: boolean }) => isPdf ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .65s linear infinite' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

export default function UploadZone({ lang, onFiles, loading }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const sq = lang === 'sq'

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 10,
    disabled: loading,
  })

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const formatBytes = (b: number) => b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / 1024 / 1024).toFixed(1)} MB`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          position: 'relative',
          padding: '36px 24px',
          borderRadius: 16,
          border: `2px dashed ${isDragActive ? 'var(--blue)' : 'var(--border-2)'}`,
          background: isDragActive ? 'var(--blue-50)' : 'var(--surface-2)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? .55 : 1,
          transition: 'all .2s',
          textAlign: 'center',
        }}
        onMouseEnter={e => { if (!loading && !isDragActive) { const el = e.currentTarget; el.style.borderColor = 'var(--blue-200)'; el.style.background = 'var(--blue-50)'; }}}
        onMouseLeave={e => { if (!isDragActive) { const el = e.currentTarget; el.style.borderColor = 'var(--border-2)'; el.style.background = 'var(--surface-2)'; }}}
      >
        <input {...getInputProps()} />

        <div style={{ color: isDragActive ? 'var(--blue)' : 'var(--t4)', display: 'flex', justifyContent: 'center', marginBottom: 14, transition: 'color .2s transform .2s', transform: isDragActive ? 'translateY(-4px)' : 'none' }}>
          <UploadCloudIcon />
        </div>

        {isDragActive ? (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>
            {sq ? 'Lësho dokumentet...' : 'Drop files here...'}
          </p>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--t2)' }}>
              {sq ? 'Tërhiq dokumentet këtu' : 'Drag documents here'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t4)' }}>
              {sq ? 'ose ' : 'or '}
              <span style={{ color: 'var(--blue)', fontWeight: 600 }}>
                {sq ? 'kliko për të ngarkuar' : 'click to upload'}
              </span>
            </p>
          </>
        )}

        {/* Format chips */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {['PDF', 'JPG', 'PNG', 'WEBP'].map(fmt => (
            <span key={fmt} className="chip" style={{ fontSize: 11, padding: '3px 9px' }}>{fmt}</span>
          ))}
          <span style={{ fontSize: 11.5, color: 'var(--t4)', alignSelf: 'center', marginLeft: 4 }}>
            · {sq ? 'Maks. 10 skedarë' : 'Max 10 files'}
          </span>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((file, idx) => {
            const isPdf = file.type === 'application/pdf'
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                background: 'var(--surface)', borderRadius: 12,
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${isPdf ? 'var(--blue)' : 'var(--green)'}`,
                boxShadow: 'var(--sh-xs)',
                animation: 'fadeUp .25s var(--ease-out) both',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: isPdf ? 'var(--blue-50)' : 'var(--green-bg)',
                  color: isPdf ? 'var(--blue)' : 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileIcon isPdf={isPdf} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--t4)' }}>
                    {formatBytes(file.size)}
                  </p>
                </div>
                <span className="badge badge-green" style={{ flexShrink: 0 }}>
                  {sq ? 'Gati' : 'Ready'}
                </span>
                <button onClick={() => removeFile(idx)} style={{
                  width: 28, height: 28, borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--surface-3)',
                  color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, transition: 'all .15s', flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-bdr)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--t4)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={() => files.length > 0 && onFiles(files)}
        disabled={files.length === 0 || loading}
        className="btn btn-primary"
        style={{ width: '100%', height: 52, fontSize: 15, fontWeight: 700, borderRadius: 14, gap: 10 }}
      >
        {loading ? (
          <><SpinnerIcon /> {sq ? 'Duke lexuar dokumentet...' : 'Reading documents...'}</>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {files.length > 0
              ? `${sq ? 'Lexo' : 'Analyse'} ${files.length} ${sq ? (files.length === 1 ? 'dokument' : 'dokumente') : (files.length === 1 ? 'document' : 'documents')}`
              : sq ? 'Ngarko dokumentet fillimisht' : 'Upload documents first'}
          </>
        )}
      </button>

      {files.length === 0 && !loading && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--t4)', textAlign: 'center' }}>
          {sq ? 'Së pari ngarko një dokument për të vazhduar.' : 'Upload at least one document to continue.'}
        </p>
      )}
    </div>
  )
}
