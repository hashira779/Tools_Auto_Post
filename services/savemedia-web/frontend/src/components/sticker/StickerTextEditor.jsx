import { useState, useEffect, useRef, useCallback } from 'react'

const KHMER_MEME_PRESETS = [
  { text: 'សើចឡើងរឹងថ្គាម 😂', label: 'សើចឡើងរឹងថ្គាម' },
  { text: 'អត់យល់ទេ 🙄', label: 'អត់យល់ទេ' },
  { text: 'កុំមកចេះ 🤫', label: 'កុំមកចេះ' },
  { text: 'ឡូយមែនទែន 🔥', label: 'ឡូយមែនទែន' },
  { text: 'សុំទោសផង 🙏', label: 'សុំទោស' },
  { text: 'ហាសហា 🤣', label: 'ហាសហា' },
  { text: 'ទៅណាទៅ 🏃', label: 'ទៅណាទៅ' },
  { text: 'អរគុណច្រើន ❤️', label: 'អរគុណ' },
]

const ENGLISH_MEME_PRESETS = [
  { text: 'OMG! 😱', label: 'OMG!' },
  { text: 'WHAT?! 🤯', label: 'WHAT?!' },
  { text: 'LOL 😂', label: 'LOL' },
  { text: 'NOPE 🙅‍♂️', label: 'NOPE' },
  { text: 'DEAL WITH IT 😎', label: 'DEAL WITH IT' },
  { text: 'MISSION PASSED 🌟', label: 'MISSION PASSED' },
]

const FONTS = [
  { id: 'Koulen', name: 'Koulen (Khmer Meme)', family: '"Koulen", cursive, sans-serif' },
  { id: 'Kantumruy Pro', name: 'Kantumruy Pro', family: '"Kantumruy Pro", sans-serif' },
  { id: 'Battambang', name: 'Battambang Bold', family: '"Battambang", sans-serif' },
  { id: 'Impact', name: 'Impact / Meme', family: 'Impact, "Inter", sans-serif' },
]

const TEXT_STYLES = [
  { id: 'meme', name: 'Meme Stroke', desc: 'White with bold black outline' },
  { id: 'gold', name: 'Gold Glow', desc: 'Bright gold with dark outline' },
  { id: 'bubble', name: 'Comic Bubble', desc: 'White badge background' },
  { id: 'stamp', name: 'Red Stamp', desc: 'Vibrant red alert box' },
  { id: 'neon', name: 'Neon Cyan', desc: 'Glowing cyber text' },
]

const POSITIONS = [
  { id: 'bottom', name: 'Bottom' },
  { id: 'top', name: 'Top' },
  { id: 'center', name: 'Center' },
]

export default function StickerTextEditor({ baseStickerData, onStickerUpdated }) {
  const [text, setText] = useState('')
  const [font, setFont] = useState('Koulen')
  const [style, setStyle] = useState('meme')
  const [position, setPosition] = useState('bottom')
  const [fontSize, setFontSize] = useState(38)
  const [isRendering, setIsRendering] = useState(false)

  const canvasRef = useRef(null)
  const imageObjRef = useRef(null)

  // Load the base image once
  useEffect(() => {
    if (!baseStickerData?.data_b64) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `data:image/webp;base64,${baseStickerData.data_b64}`
    img.onload = () => {
      imageObjRef.current = img
      renderCanvas()
    }
  }, [baseStickerData])

  // Re-render when text/font/style/position changes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageObjRef.current
    if (!canvas || !img) return

    setIsRendering(true)
    const ctx = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 512

    // Clear transparent canvas
    ctx.clearRect(0, 0, 512, 512)

    // Draw base sticker image
    ctx.drawImage(img, 0, 0, 512, 512)

    // If no text, export base image directly
    if (!text.trim()) {
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsRendering(false)
          return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
          const b64 = reader.result.split(',')[1]
          onStickerUpdated?.({
            ...baseStickerData,
            data_b64: b64,
            has_custom_text: false,
          })
          setIsRendering(false)
        }
        reader.readAsDataURL(blob)
      }, 'image/webp', 0.95)
      return
    }

    // Render Text
    const selectedFontObj = FONTS.find((f) => f.id === font) || FONTS[0]
    ctx.font = `bold ${fontSize}px ${selectedFontObj.family}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Determine Y coordinate
    let y = 450
    if (position === 'top') y = 65
    if (position === 'center') y = 256

    const textToDraw = text.trim()
    const textMetrics = ctx.measureText(textToDraw)
    const textWidth = textMetrics.width
    const paddingX = 18
    const paddingY = 10
    const badgeHeight = fontSize + paddingY * 2
    const badgeWidth = textWidth + paddingX * 2

    // Style Specific Rendering
    if (style === 'bubble') {
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 4
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.roundRect(256 - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 14)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle = '#0f172a'
      ctx.fillText(textToDraw, 256, y)
    } else if (style === 'stamp') {
      ctx.save()
      ctx.fillStyle = '#dc2626'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.roundRect(256 - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 10)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.fillText(textToDraw, 256, y)
    } else if (style === 'gold') {
      ctx.save()
      ctx.strokeStyle = '#451a03'
      ctx.lineWidth = Math.max(5, fontSize / 7)
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 14
      ctx.strokeText(textToDraw, 256, y)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(textToDraw, 256, y)
      ctx.restore()
    } else if (style === 'neon') {
      ctx.save()
      ctx.strokeStyle = '#083344'
      ctx.lineWidth = Math.max(6, fontSize / 6)
      ctx.lineJoin = 'round'
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 16
      ctx.strokeText(textToDraw, 256, y)
      ctx.fillStyle = '#22d3ee'
      ctx.fillText(textToDraw, 256, y)
      ctx.restore()
    } else {
      // Classic Meme Stroke
      ctx.save()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = Math.max(6, fontSize / 6)
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 8
      ctx.strokeText(textToDraw, 256, y)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(textToDraw, 256, y)
      ctx.restore()
    }

    // Convert Canvas to WebP Blob and update state
    canvas.toBlob((blob) => {
      if (!blob) {
        setIsRendering(false)
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = reader.result.split(',')[1]
        onStickerUpdated?.({
          ...baseStickerData,
          data_b64: b64,
          has_custom_text: true,
          custom_text: textToDraw,
        })
        setIsRendering(false)
      }
      reader.readAsDataURL(blob)
    }, 'image/webp', 0.95)
  }, [text, font, style, position, fontSize, baseStickerData, onStickerUpdated])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas()
    }, 80)
    return () => clearTimeout(timer)
  }, [renderCanvas])

  return (
    <div className="card p-5 sm:p-6 mb-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" width={512} height={512} />

      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
          Add Text & Memes
        </h3>
        {text && (
          <button
            onClick={() => setText('')}
            className="text-[11px] text-[var(--color-error)] hover:text-red-400 font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-error-dim)] transition-colors cursor-pointer"
          >
            Clear Text
          </button>
        )}
      </div>

      {/* Khmer Presets */}
      <div className="mb-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2 px-1">
          Khmer Memes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KHMER_MEME_PRESETS.map((p) => (
            <button
              key={p.text}
              onClick={() => setText(p.text)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border focus-ring ${
                text === p.text
                  ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* English Presets */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2 px-1">
          English Memes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ENGLISH_MEME_PRESETS.map((p) => (
            <button
              key={p.text}
              onClick={() => setText(p.text)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border focus-ring ${
                text === p.text
                  ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text */}
      <div className="mb-6">
        <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-2 px-1">
          Custom Text (Khmer, English, Emojis)
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. សើចឡើងរឹងថ្គាម, LOL, OMG..."
          className="input-field w-full px-4 py-3 text-[14px]"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)]">
        {/* Style */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="input-field w-full px-3 py-2 text-[12px] cursor-pointer"
          >
            {TEXT_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Font */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Font</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="input-field w-full px-3 py-2 text-[12px] cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Position</label>
          <div className="flex gap-1 h-[34px]">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`flex-1 rounded-lg text-[11px] font-medium transition-colors border cursor-pointer focus-ring ${
                  position === p.id
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-border-2)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-3)] hover:text-[var(--color-text)] border-[var(--color-border)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
