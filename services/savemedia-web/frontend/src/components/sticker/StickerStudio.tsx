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
  const [activeTab, setActiveTab] = useState('image') // 'image', 'adjust', 'text', 'export'


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
  if (!sourceImage) {
    return (
      <div className="w-full max-w-[1200px] mx-auto pb-10">
        <StickerUploader onUpload={handleUpload} />
      </div>
    )
  }

  const TABS = [
    { id: 'image', label: 'Image', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> },
    { id: 'adjust', label: 'Adjust', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
    { id: 'text', label: 'Text', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
    { id: 'export', label: 'Export', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
  ]

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-24 lg:pb-0 flex flex-col lg:flex-row min-h-[600px] lg:h-[calc(100vh-120px)] lg:max-h-[900px] lg:overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl relative">
      
      {/* ── Desktop Left Nav / Mobile Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-[var(--color-border)] z-50 lg:relative lg:w-[100px] lg:h-full lg:border-t-0 lg:border-r lg:bg-transparent lg:backdrop-blur-none flex lg:flex-col justify-around lg:justify-start gap-2 p-2 lg:p-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none flex flex-col items-center justify-center gap-1.5 p-2 lg:py-5 rounded-2xl transition-colors duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[var(--color-primary-500)] text-white shadow-lg lg:shadow-[0_10px_30px_rgba(134,59,255,0.4)] scale-105' 
                  : 'text-[var(--color-text-3)] hover:text-[var(--color-primary-500)] hover:bg-[rgba(134,59,255,0.1)]'
              }`}
            >
              <div className="w-5 h-5 lg:w-7 lg:h-7">{tab.icon}</div>
              <span className={`text-[10px] lg:text-[11px] font-bold tracking-wider ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active Panel Settings ── */}
      <div className="w-full lg:w-[350px] shrink-0 h-auto lg:h-full lg:overflow-y-auto p-5 lg:p-6 lg:border-r border-[var(--color-border)] order-2 lg:order-none">
        
        {/* Universal Top Actions */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-full bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] flex items-center justify-center">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div>
               <h3 className="text-[13px] font-bold text-[var(--color-text)]">Source Active</h3>
             </div>
           </div>
           <button onClick={handleReset} className="text-[11px] font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 px-3 py-1.5 rounded-lg transition-colors">
             New Image
           </button>
        </div>

        {/* Dynamic Content based on Tab */}
        <div className="animate-fade-in space-y-6">
          {activeTab === 'image' && (
            <>
              <div className="card-elevated p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-[var(--color-text)] flex items-center gap-2">
                    ✨ AI Eraser
                  </h3>
                  <button
                    onClick={handleToggleBg}
                    disabled={processingStyle}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-ring ${
                      removeBg ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-surface-4)]'
                    } ${processingStyle ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface-1)] shadow ring-0 transition duration-200 ease-in-out ${removeBg ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--color-text-3)] leading-relaxed">Runs completely offline via WebAssembly. No data leaves your device.</p>
              </div>
              <StickerStyleSelector 
                selectedStyle={selectedStyle} 
                onSelectStyle={handleStyleGenerate} 
                processing={processingStyle}
                loadingProgress={loadingProgress}
                error={styleError}
              />
            </>
          )}

          {activeTab === 'adjust' && (
            <StickerAdjustments adjustments={adjustments} setAdjustments={setAdjustments} />
          )}

          {activeTab === 'text' && (
            <StickerTextEditor textConfig={textConfig} onTextConfigChange={setTextConfig} />
          )}

          {activeTab === 'export' && (
            <>
              <StickerEmojiPicker selected={emoji} onSelect={setEmoji} />
              <StickerTelegramPublish 
                emoji={emoji} onPublish={handlePublishToTelegram}
                onDownloadPNG={handleDownloadPNG} onDownloadWebP={handleDownloadWebP} onReset={handleReset}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Center Stage (Canvas Preview) ── */}
      <div className="flex-1 min-w-0 flex flex-col relative order-1 lg:order-none bg-[var(--color-surface-2)] lg:rounded-r-3xl">
        <div className="absolute inset-0 flex items-center justify-center p-4 lg:p-10 pointer-events-none overflow-hidden">
          {/* Subtle grid for professional feel */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(var(--color-text) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="w-full max-w-[600px] aspect-square relative shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden pointer-events-auto bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEAFifOToJMoQ/xnwYfL0k42mho2mgmE0FwyjuWBY5IJhNMk0U0EAKU8/41ZqG6oAAAAASUVORK5CYII=')]">
             <StickerCanvas 
                ref={canvasRef}
                baseStickerData={baseStickerData}
                adjustments={adjustments}
                textConfig={textConfig}
             />
          </div>
        </div>
        
        {/* Top Floating Badge */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[var(--color-surface)]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--color-border)] shadow-lg flex items-center gap-2 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-400)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-primary-500)]"></span>
          </span>
          <span className="text-[11px] font-bold text-[var(--color-text)] tracking-wider">LIVE PREVIEW</span>
        </div>
      </div>

    </div>
  )
}
