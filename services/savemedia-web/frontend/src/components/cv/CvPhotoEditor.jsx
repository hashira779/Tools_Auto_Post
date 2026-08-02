import { useState, useRef, useEffect, useCallback } from 'react'

const BACKGROUND_COLORS = [
  { id: 'blue', name: '🔵 Cambodian Blue (#0072C6)', color: '#0072C6', official: true },
  { id: 'white', name: '⚪ Studio White (#FFFFFF)', color: '#FFFFFF', official: true },
  { id: 'grey', name: '🔘 Neutral Grey (#94A3B8)', color: '#94A3B8', official: false },
  { id: 'red', name: '🔴 Passport Red (#DC2626)', color: '#DC2626', official: false },
]

const PHOTO_SIZES = [
  { id: '4x6', label: '4×6 cm', desc: 'Job CV & Official (ស្តង់ដារការងារ)', width: 472, height: 709, ratio: '4:6' },
  { id: '3x4', label: '3×4 cm', desc: 'Student ID & License (កាតសិស្ស)', width: 354, height: 472, ratio: '3:4' },
  { id: '2x2', label: '2×2 inch', desc: 'Passport & Visa (ទិដ្ឋាការ)', width: 600, height: 600, ratio: '1:1' },
]

export default function CvPhotoEditor({ selectedTemplate, onBack }) {
  const [userImage, setUserImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [bgColor, setBgColor] = useState(selectedTemplate?.bg || '#0072C6')
  const [photoSize, setPhotoSize] = useState('4x6')
  const [zoom, setZoom] = useState(1.0)
  const [offsetY, setOffsetY] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [readyDownload, setReadyDownload] = useState(null)

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Draw the processed ID photo onto the canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const selectedSizeObj = PHOTO_SIZES.find((s) => s.id === photoSize) || PHOTO_SIZES[0]
    canvas.width = selectedSizeObj.width
    canvas.height = selectedSizeObj.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Fill Selected Official Background Color
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // If user uploaded image
    if (imagePreview) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imagePreview
      img.onload = () => {
        const aspect = img.width / img.height
        const targetAspect = canvas.width / canvas.height

        let drawW = canvas.width * zoom
        let drawH = (canvas.width / aspect) * zoom

        if (aspect < targetAspect) {
          drawH = canvas.height * zoom
          drawW = (canvas.height * aspect) * zoom
        }

        const drawX = (canvas.width - drawW) / 2
        const drawY = (canvas.height - drawH) / 2 + offsetY

        ctx.drawImage(img, drawX, drawY, drawW, drawH)

        // Generate high-res image
        setReadyDownload(canvas.toDataURL('image/png'))
      }
    } else {
      // Default placeholder silhouette
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height * 0.38, canvas.width * 0.22, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(canvas.width / 2, canvas.height * 0.85, canvas.width * 0.45, canvas.height * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      setReadyDownload(canvas.toDataURL('image/png'))
    }
  }, [bgColor, photoSize, zoom, offsetY, imagePreview])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const handleDownloadSingle = () => {
    if (!readyDownload) return
    const link = document.createElement('a')
    link.href = readyDownload
    link.download = `CV_Photo_${photoSize}_${Date.now()}.png`
    link.click()
  }

  return (
    <div className="w-full max-w-[860px] animate-slide-up mb-10">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-1 cursor-pointer transition-colors"
          >
            ← ត្រឡប់ទៅជ្រើសរើសឈុត (Back to Templates)
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>📷</span> {selectedTemplate?.title || 'AI CV 4×6 Photo Editor'}
          </h2>
        </div>

        <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
          300 DPI Export
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas & Preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="p-3 bg-slate-950 rounded-2xl shadow-2xl border border-white/15 w-full flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden shadow-inner flex items-center justify-center bg-slate-900 border border-white/10 max-h-[380px] w-full aspect-[4/6]">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            {/* Dimension Badge */}
            <div className="mt-3 text-center">
              <span className="text-xs font-semibold text-slate-300">
                {PHOTO_SIZES.find((s) => s.id === photoSize)?.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Upload */}
        <div className="md:col-span-7 space-y-5">
          {/* Step 1: Upload Photo */}
          <div className="glass-card p-5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. ជ្រើសរើសរូបថតផ្ទាល់ខ្លួន (Upload Photo)</span>
              {imagePreview && (
                <button
                  onClick={() => {
                    setUserImage(null)
                    setImagePreview(null)
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[10px] lowercase font-normal"
                >
                  ✕ ដករូបចេញ
                </button>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-white/20 hover:border-indigo-500 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-slate-300 hover:text-white"
            >
              <span className="text-2xl">📸</span>
              <span className="text-xs font-semibold">
                {imagePreview ? 'ប្តូររូបថតផ្សេង (Change Photo)' : 'ចុចដើម្បី Upload រូបថត ឬ Selfie'}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Supports JPG, PNG, WebP (Max 15MB)
              </span>
            </button>
          </div>

          {/* Step 2: Background Selector */}
          <div className="glass-card p-5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              2. ពណ៌ផ្ទៃខាងក្រោយ (Background Color)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_COLORS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBgColor(b.color)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    bgColor === b.color
                      ? 'bg-indigo-600/30 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-white/10'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="truncate">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Size Standard Selector */}
          <div className="glass-card p-5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              3. ទំហំរូបថត (Photo Size Standard)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PHOTO_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPhotoSize(s.id)}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    photoSize === s.id
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-white/10'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">{s.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Fine-Tuning Controls (Zoom & Position) */}
          {imagePreview && (
            <div className="glass-card p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                ⚙️ លៃតម្រូវប្លង់ (Adjust Framing)
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>
                  <div className="flex justify-between mb-1 text-[11px] text-slate-400">
                    <span>Zoom</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px] text-slate-400">
                    <span>Position Y</span>
                    <span>{offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="5"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadSingle}
              className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>ទាញយករូបថត 4×6 HD (Download Single)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
