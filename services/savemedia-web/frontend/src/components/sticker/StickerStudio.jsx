import { useState, useRef } from 'react'

import StickerUploader from './StickerUploader'
import StickerStyleSelector from './StickerStyleSelector'
import StickerTextEditor from './StickerTextEditor'
import StickerAdjustments from './StickerAdjustments'
import StickerEmojiPicker from './StickerEmojiPicker'
import StickerTelegramPublish from './StickerTelegramPublish'
import StickerCanvas from './StickerCanvas'

export default function StickerStudio() {
  const canvasRef = useRef(null)

  // ── Global State ──────────────────────────────────────────
  const [sourceImage, setSourceImage] = useState(null)
  
  // API response: the raw processed sticker
  const [baseStickerData, setBaseStickerData] = useState(null)
  const [processingStyle, setProcessingStyle] = useState(false)
  const [styleError, setStyleError] = useState(null)

  const [selectedStyle, setSelectedStyle] = useState('original')
  
  // NEW: Background Removal State
  const [removeBg, setRemoveBg] = useState(false)
  
  // Adjustments (Frontend filters)
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  })

  // Text Config
  const [textConfig, setTextConfig] = useState({
    text: '',
    font: 'Koulen',
    style: 'meme',
    position: 'bottom',
    fontSize: 48,
  })

  const [emoji, setEmoji] = useState('😂')

  const [loadingProgress, setLoadingProgress] = useState('')

  // ── Handlers ──────────────────────────────────────────────

  const handleUpload = async (file) => {
    setSourceImage(file)
    // Auto-apply "original" style via API to crop/scale to 512x512
    handleStyleGenerate('original', file, removeBg)
  }

  const handleStyleGenerate = async (styleId, overrideFile = null, shouldRemoveBg = removeBg) => {
    const fileToProcess = overrideFile || sourceImage
    if (!fileToProcess) return

    setSelectedStyle(styleId)
    setRemoveBg(shouldRemoveBg)
    setProcessingStyle(true)
    setStyleError(null)
    setLoadingProgress(shouldRemoveBg ? 'Initializing AI Engine...' : 'Processing...')

    try {
      let finalBlob = fileToProcess;

      if (shouldRemoveBg) {
        // Dynamically import to keep initial bundle size small
        const { removeBackground } = await import('@imgly/background-removal')
        
        finalBlob = await removeBackground(fileToProcess, {
          progress: (key, current, total) => {
             if (key.startsWith('fetch')) {
               const percentage = Math.round((current / total) * 100) || 0
               setLoadingProgress(`Downloading AI Brain (${percentage}%)...`)
             } else if (key.startsWith('compute')) {
               setLoadingProgress('Analyzing pixels...')
             }
          }
        });
      }

      // Convert Blob to Base64 for the canvas
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1]
        setBaseStickerData({ data_b64: base64data, style: styleId })
        setProcessingStyle(false)
        setLoadingProgress('')
      }
      reader.readAsDataURL(finalBlob)

    } catch (e) {
      console.error(e)
      setStyleError(e.message || 'Failed to process image.')
      setProcessingStyle(false)
      setLoadingProgress('')
    }
  }

  const handleToggleBg = () => {
    handleStyleGenerate(selectedStyle, sourceImage, !removeBg)
  }

  const handlePublishToTelegram = async (publishConfig) => {
    if (!canvasRef.current) throw new Error("Canvas not ready")
    const b64 = await canvasRef.current.exportBase64()
    if (!b64) throw new Error("Failed to export image")

    const formData = new FormData()
    formData.append('sticker_b64', b64)
    formData.append('emoji', publishConfig.emoji)

    if (publishConfig.userId) formData.append('user_id', publishConfig.userId)
    if (publishConfig.packName) formData.append('short_name', publishConfig.packName)
    if (publishConfig.title) formData.append('title', publishConfig.title)

    const res = await fetch('/api/telegram/create-pack', {
      method: 'POST',
      body: formData,
    })

    const text = await res.text()
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Server returned error (${res.status}). Please try again.`)
    }

    if (!res.ok) {
      throw new Error(data.detail || 'Failed to create Telegram sticker pack.')
    }

    return data
  }

  const handleDownloadPNG = async () => {
    if (!canvasRef.current) return
    const blob = await canvasRef.current.exportPNG()
    if (!blob) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sticker_${Date.now()}.png`
    link.click()
  }

  const handleDownloadWebP = async () => {
    if (!canvasRef.current) return
    const blob = await canvasRef.current.exportWebP()
    if (!blob) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sticker_${Date.now()}.webp`
    link.click()
  }

  const handleReset = () => {
    setSourceImage(null)
    setBaseStickerData(null)
    setSelectedStyle('original')
    setRemoveBg(false)
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 })
    setTextConfig({ text: '', font: 'Koulen', style: 'meme', position: 'bottom', fontSize: 48 })
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1200px] mx-auto pb-10 flex flex-col-reverse lg:flex-row gap-6">
      
      {/* ── Left Sidebar (Tools) ── */}
      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col space-y-0 h-auto lg:h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar pr-1 mt-6 lg:mt-0">
        
        {!sourceImage ? (
          <StickerUploader onUpload={handleUpload} />
        ) : (
          <>
            {/* 1. Re-upload option (small) */}
            <div className="card p-4 mb-4 flex items-center justify-between animate-fade-in border-l-4 border-l-[var(--color-primary-500)]">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] flex items-center justify-center">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                 </div>
                 <div>
                   <h3 className="text-[13px] font-bold text-[var(--color-text)]">Source Image Loaded</h3>
                   <button onClick={handleReset} className="text-[11px] text-[var(--color-text-3)] hover:text-[var(--color-error)] transition-colors">Change Image</button>
                 </div>
               </div>
            </div>

            {/* AI Background Removal Toggle */}
            <div className="card p-4 mb-4 animate-fade-in flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-[var(--color-text)] flex items-center gap-2">
                  ✨ AI Background Eraser
                </h3>
                <p className="text-[11px] text-[var(--color-text-4)] mt-0.5">
                  Runs offline directly on your device
                </p>
              </div>
              <button
                onClick={handleToggleBg}
                disabled={processingStyle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-ring ${
                  removeBg ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-surface-4)]'
                } ${processingStyle ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    removeBg ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Image Style (Backend) */}
            <StickerStyleSelector 
              selectedStyle={selectedStyle} 
              onSelectStyle={handleStyleGenerate} 
              processing={processingStyle}
              loadingProgress={loadingProgress}
              error={styleError}
            />

            {/* 3. Image Adjustments (Frontend Filters) */}
            <StickerAdjustments 
              adjustments={adjustments} 
              setAdjustments={setAdjustments} 
            />

            {/* 4. Text & Memes */}
            <StickerTextEditor 
              textConfig={textConfig} 
              onTextConfigChange={setTextConfig} 
            />

            {/* 5. Emoji & Export */}
            <StickerEmojiPicker 
              selected={emoji} 
              onSelect={setEmoji} 
            />

            <StickerTelegramPublish 
              emoji={emoji}
              onPublish={handlePublishToTelegram}
              onDownloadPNG={handleDownloadPNG}
              onDownloadWebP={handleDownloadWebP}
              onReset={handleReset}
            />
          </>
        )}
      </div>

      {/* ── Right Main Area (Canvas Preview) ── */}
      <div className="flex-1 min-w-0 flex flex-col items-center">
        <div className="w-full max-w-[600px] sticky top-20 lg:top-24 z-10 bg-[var(--color-background)] pt-4 pb-4 lg:pt-0 lg:pb-0 shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:shadow-none">
           <div className="mb-3 flex justify-between items-end px-1">
             <h2 className="text-lg font-bold text-[var(--color-text)]">Live Preview</h2>
             <span className="badge">512×512</span>
           </div>
           
           <StickerCanvas 
              ref={canvasRef}
              baseStickerData={baseStickerData}
              adjustments={adjustments}
              textConfig={textConfig}
           />
           
           {sourceImage && (
             <p className="text-center text-[11px] text-[var(--color-text-4)] mt-4">
               Updates in real-time. What you see is exactly what will be exported.
             </p>
           )}
        </div>
      </div>
    </div>
  )
}
