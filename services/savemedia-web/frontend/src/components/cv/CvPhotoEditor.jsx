import { useState, useRef } from 'react'

const BACKGROUND_COLORS = [
  { id: 'blue', name: '🔵 Cambodian Blue (#0072C6)', color: '#0072C6' },
  { id: 'white', name: '⚪ Studio White (#FFFFFF)', color: '#FFFFFF' },
  { id: 'grey', name: '🔘 Neutral Grey (#94A3B8)', color: '#94A3B8' },
  { id: 'red', name: '🔴 Passport Red (#DC2626)', color: '#DC2626' },
]

const PHOTO_SIZES = [
  { id: '4x6', label: '4×6 cm', desc: 'Job CV & Official (ស្តង់ដារការងារ)' },
  { id: '3x4', label: '3×4 cm', desc: 'Student ID & License (កាតសិស្ស)' },
  { id: '2x2', label: '2×2 inch', desc: 'Passport & Visa (ទិដ្ឋាការ)' },
]

export default function CvPhotoEditor({ selectedTemplate, onBack }) {
  const [userFile, setUserFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [bgColor, setBgColor] = useState(selectedTemplate?.bg || '#0072C6')
  const [photoSize, setPhotoSize] = useState('4x6')
  const [brightness, setBrightness] = useState(1.0)
  const [contrast, setContrast] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserFile(file)
      setImagePreview(URL.createObjectURL(file))
      setResultImage(null)
      setErrorMsg(null)
      // Auto-trigger AI processing
      processWithPythonAI(file, bgColor, photoSize, brightness, contrast)
    }
  }

  const processWithPythonAI = async (
    fileToProcess = userFile,
    bg = bgColor,
    size = photoSize,
    bright = brightness,
    cont = contrast
  ) => {
    if (!fileToProcess) return

    setIsProcessing(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', fileToProcess)
      formData.append('template_id', selectedTemplate?.id || 'men-suit-blue')
      formData.append('bg_color', bg)
      formData.append('size', size)
      formData.append('brightness', bright.toString())
      formData.append('contrast', cont.toString())

      const res = await fetch('/api/cv/generate-base64', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Python microservice error')
      }

      const data = await res.json()
      if (data.success && data.data_url) {
        setResultImage(data.data_url)
      } else {
        throw new Error('No image returned from AI backend')
      }
    } catch (err) {
      console.error('Python AI processing error:', err)
      setErrorMsg('Failed to process with Python AI: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadHD = () => {
    if (!resultImage) return
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `CV_Photo_${photoSize}_${selectedTemplate?.id || 'suit'}_${Date.now()}.jpg`
    link.click()
  }

  return (
    <div className="w-full max-w-[860px] animate-fade-in mb-10 select-none">
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
            <span>👔</span> {selectedTemplate?.title || 'AI CV 4×6 Photo Studio'}
          </h2>
        </div>

        <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Python AI Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Result & Live AI Preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="p-3 bg-slate-950 rounded-2xl shadow-2xl border border-white/15 w-full flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden shadow-inner flex items-center justify-center bg-slate-900 border border-white/10 max-h-[380px] w-full aspect-[4/6]">
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <div className="text-xs font-bold text-white">🤖 Python AI Processing...</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Detecting face &amp; blending onto {selectedTemplate?.suitType?.replace('_', ' ') || 'suit'}
                  </div>
                </div>
              )}

              {resultImage ? (
                <img
                  src={resultImage}
                  alt="AI CV Generated Result"
                  className="w-full h-full object-contain"
                />
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="User Upload Preview"
                  className="w-full h-full object-contain opacity-60"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-500 text-xs">
                  <span className="text-4xl mb-2">👤</span>
                  <span>Upload selfie to start AI</span>
                </div>
              )}
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
                    setUserFile(null)
                    setImagePreview(null)
                    setResultImage(null)
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-normal"
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
              className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500 bg-slate-900/50 hover:bg-slate-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-slate-300 hover:text-white"
            >
              <span className="text-2xl">📸</span>
              <span className="text-xs font-semibold">
                {imagePreview ? 'ប្តូររូបថតផ្សេង (Change Photo)' : 'ចុចដើម្បី Upload រូបថត ឬ Selfie'}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Supports JPG, PNG, WebP
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
                  onClick={() => {
                    setBgColor(b.color)
                    if (userFile) processWithPythonAI(userFile, b.color, photoSize, brightness, contrast)
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    bgColor === b.color
                      ? 'bg-cyan-600/30 text-white border-cyan-400 shadow-md'
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
                  onClick={() => {
                    setPhotoSize(s.id)
                    if (userFile) processWithPythonAI(userFile, bgColor, s.id, brightness, contrast)
                  }}
                  className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    photoSize === s.id
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-white/10'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">{s.desc.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadHD}
              disabled={!resultImage || isProcessing}
              className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>ទាញយករូបថត 4×6 HD (Download Final Photo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
