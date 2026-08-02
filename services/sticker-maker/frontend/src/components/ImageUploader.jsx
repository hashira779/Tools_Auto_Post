import { useState, useCallback, useRef } from 'react'

export default function ImageUploader({ onUpload }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = useCallback((files) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large! Maximum size is 10 MB.')
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
    <div className="glass rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        📸 Upload Your Image
      </h2>
      <p className="text-sm text-[--color-text-secondary] mb-6">
        Upload any image to turn it into a Telegram sticker
      </p>

      <div
        className={`upload-zone rounded-2xl p-12 sm:p-16 text-center ${dragOver ? 'drag-over' : ''}`}
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

        <div className="text-5xl mb-4">
          {dragOver ? '📥' : '🖼️'}
        </div>

        <p className="text-lg font-semibold text-[--color-text-primary] mb-2">
          {dragOver ? 'Drop it here!' : 'Drag & drop your image here'}
        </p>
        <p className="text-sm text-[--color-text-muted] mb-4">
          or click to browse
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-[--color-text-muted]">
          <span className="px-2 py-1 rounded-full bg-[--color-bg-secondary]">PNG</span>
          <span className="px-2 py-1 rounded-full bg-[--color-bg-secondary]">JPG</span>
          <span className="px-2 py-1 rounded-full bg-[--color-bg-secondary]">WebP</span>
          <span className="px-2 py-1 rounded-full bg-[--color-bg-secondary]">GIF</span>
          <span className="px-2 py-1 rounded-full bg-[--color-bg-secondary]">Max 10 MB</span>
        </div>
      </div>

      {/* Features list */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '✂️', text: 'Auto Resize' },
          { icon: '🎨', text: '5 Styles' },
          { icon: '📱', text: 'Telegram Ready' },
          { icon: '⚡', text: 'Instant' },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
