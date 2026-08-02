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
    <div className="card-playful p-6 sm:p-10 transition-all duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
          <span>📸</span> Step 1: Upload Your Image
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Drop any photo or graphic here to convert it into a Telegram sticker
        </p>
      </div>

      <div
        className={`border-3 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 select-none ${
          dragOver
            ? 'border-purple-500 bg-purple-50 scale-[1.01] shadow-inner'
            : 'border-purple-200 bg-purple-50/40 hover:border-purple-400 hover:bg-purple-50/70 hover:shadow-md'
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

        <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center text-4xl shadow-[0_8px_20px_rgba(147,51,234,0.12)] border border-purple-100 mb-4 transition-transform duration-300 hover:scale-110">
          {dragOver ? '📥' : '🖼️'}
        </div>

        <p className="text-lg font-black text-gray-800 mb-1">
          {dragOver ? 'Drop it right here!' : 'Click or Drag & Drop your image'}
        </p>
        <p className="text-xs sm:text-sm text-gray-400 font-semibold mb-5">
          Supports transparent PNG, JPG, WebP, GIF (Max 10 MB)
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl shadow-xs border border-purple-100 text-xs font-extrabold text-purple-700 hover:bg-purple-50 transition-colors">
          <span>📁</span> Browse Local Files
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        {[
          { icon: '📐', title: 'Auto 512×512', desc: 'Fits Telegram spec' },
          { icon: '🎨', title: '5 Fun Styles', desc: 'Outlines & cartoon' },
          { icon: '⚡', title: 'Instant WebP', desc: 'Ultra lightweight' },
          { icon: '🤖', title: 'Direct Bot Link', desc: 'No manual bots' },
        ].map((f) => (
          <div
            key={f.title}
            className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-center"
          >
            <div className="text-xl mb-1">{f.icon}</div>
            <div className="text-xs font-black text-gray-800">{f.title}</div>
            <div className="text-[11px] font-semibold text-gray-400">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
