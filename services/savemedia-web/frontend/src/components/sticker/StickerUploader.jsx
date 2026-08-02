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
    <div className="glass-card p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
          <span>📸</span> Step 1: Upload Image
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
          Drop any photo or design to convert it into a Telegram sticker
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 select-none ${
          dragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-white/10 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900/50'
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

        <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center text-3xl border border-white/10 mb-3 shadow-inner">
          {dragOver ? '📥' : '🖼️'}
        </div>

        <p className="text-base sm:text-lg font-bold text-white mb-1">
          {dragOver ? 'Drop image here' : 'Click or Drag & Drop image'}
        </p>
        <p className="text-xs text-slate-400 mb-4">
          PNG, JPG, WebP, GIF (Max 10 MB)
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-semibold text-slate-200 transition-colors">
          <span>📁</span> Browse Local File
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
        {[
          { icon: '📐', title: 'Auto 512×512', desc: 'Telegram Ready' },
          { icon: '🎨', title: '5 FX Styles', desc: 'Outlines & Cartoon' },
          { icon: '⚡', title: 'Pure WebP', desc: 'Super Lightweight' },
          { icon: '🚀', title: '1-Click Export', desc: 'Instant Telegram Link' },
        ].map((f) => (
          <div
            key={f.title}
            className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center"
          >
            <div className="text-lg mb-0.5">{f.icon}</div>
            <div className="text-xs font-bold text-slate-200">{f.title}</div>
            <div className="text-[10px] text-slate-400">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
