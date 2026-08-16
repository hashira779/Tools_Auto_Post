import { useState, useCallback, useRef } from 'react'

export default function StickerUploader({ onUpload }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback((files) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, GIF, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large! Maximum size is 10 MB.')
      return
    }
    onUpload(file)
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      <div className="mb-5 flex flex-col items-center text-center">
        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
          Step 1: Upload Image
        </h2>
        <p className="text-[12px] text-[var(--color-text-3)] mt-1 max-w-xs">
          Drop any photo to convert into a Telegram sticker
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 select-none ${
          dragOver
            ? 'border-[var(--color-primary-500)] bg-[rgba(134,59,255,0.06)] scale-[1.01]'
            : 'border-[var(--color-border-2)] hover:border-[var(--color-border-3)] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)]'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-12 h-12 mx-auto bg-[var(--color-surface-3)] rounded-xl flex items-center justify-center mb-4 border border-[var(--color-border)] shadow-sm">
          <svg className="w-5 h-5 text-[var(--color-text-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <p className="text-[14px] font-semibold text-[var(--color-text)] mb-1">
          {dragOver ? 'Drop image here' : 'Click or drag & drop image'}
        </p>
        <p className="text-[11px] text-[var(--color-text-4)] mb-5">
          PNG, JPG, WebP, GIF — Max 10 MB
        </p>

        <span className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium pointer-events-none">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Browse Files
        </span>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        {[
          { title: 'Auto 512×512', desc: 'Telegram Ready' },
          { title: '5 Styles', desc: 'Outlines & FX' },
          { title: 'WebP Format', desc: 'Lightweight' },
          { title: '1-Click Export', desc: 'To Telegram' },
        ].map((f) => (
          <div key={f.title} className="card-elevated px-3 py-2.5 text-center flex flex-col justify-center">
            <div className="text-[11px] font-semibold text-[var(--color-text)] leading-tight">{f.title}</div>
            <div className="text-[9px] text-[var(--color-text-4)] mt-0.5 uppercase tracking-wider">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
