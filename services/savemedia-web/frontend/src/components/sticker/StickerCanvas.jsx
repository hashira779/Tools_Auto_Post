import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react'
import { FONTS } from './StickerTextEditor'

const StickerCanvas = forwardRef(({ baseStickerData, adjustments, textConfig, onReady }, ref) => {
  const canvasRef = useRef(null)
  const imageObjRef = useRef(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  
  // Dragging State
  const [customPos, setCustomPos] = useState({ x: 256, y: null })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 })
  const [isHovering, setIsHovering] = useState(false)

  // Sync textConfig position changes from the parent to our internal custom position
  useEffect(() => {
    let newY = 450
    if (textConfig?.position === 'top') newY = 65
    if (textConfig?.position === 'center') newY = 256
    setCustomPos(prev => ({ ...prev, y: newY, x: 256 })) // Reset X to center on position change
  }, [textConfig?.position])

  // 1. Load image object when baseStickerData changes
  useEffect(() => {
    if (!baseStickerData?.data_b64) {
      imageObjRef.current = null
      setIsImageLoaded(false)
      renderCanvas()
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `data:image/webp;base64,${baseStickerData.data_b64}`
    img.onload = () => {
      imageObjRef.current = img
      setIsImageLoaded(true)
      renderCanvas()
      if (onReady) onReady()
    }
  }, [baseStickerData])

  // 2. Render Canvas Frame
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 512

    // Clear
    ctx.clearRect(0, 0, 512, 512)

    // Draw Image with Adjustments
    const img = imageObjRef.current
    if (img) {
      const { brightness = 100, contrast = 100, saturation = 100 } = adjustments || {}
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(img, 0, 0, 512, 512)
      ctx.filter = 'none' // Reset filter for text rendering
    }

    // Draw Text
    if (textConfig && textConfig.text?.trim()) {
      const { text, font, style, fontSize } = textConfig
      const selectedFontObj = FONTS.find((f) => f.id === font) || FONTS[0]
      
      ctx.font = `bold ${fontSize}px ${selectedFontObj.family}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Y Position
      const y = customPos.y !== null ? customPos.y : 450
      const x = customPos.x

      const textToDraw = text.trim()
      const textMetrics = ctx.measureText(textToDraw)
      const textWidth = textMetrics.width
      const paddingX = 18
      const paddingY = 10
      const badgeHeight = fontSize + paddingY * 2
      const badgeWidth = textWidth + paddingX * 2

      // Render Style
      if (style === 'bubble') {
        ctx.save()
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 4
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.roundRect(x - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 14)
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        ctx.fillStyle = '#0f172a'
        ctx.fillText(textToDraw, x, y)
      } else if (style === 'stamp') {
        ctx.save()
        ctx.fillStyle = '#dc2626'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.roundRect(x - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 10)
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        ctx.fillStyle = '#ffffff'
        ctx.fillText(textToDraw, x, y)
      } else if (style === 'gold') {
        ctx.save()
        ctx.strokeStyle = '#451a03'
        ctx.lineWidth = Math.max(5, fontSize / 7)
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 14
        ctx.strokeText(textToDraw, x, y)
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(textToDraw, x, y)
        ctx.restore()
      } else if (style === 'neon') {
        ctx.save()
        ctx.strokeStyle = '#083344'
        ctx.lineWidth = Math.max(6, fontSize / 6)
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#06b6d4'
        ctx.shadowBlur = 16
        ctx.strokeText(textToDraw, x, y)
        ctx.fillStyle = '#22d3ee'
        ctx.fillText(textToDraw, x, y)
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
        ctx.strokeText(textToDraw, x, y)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(textToDraw, x, y)
        ctx.restore()
      }
    }
  }, [adjustments, textConfig, customPos])

  // Call render when inputs change (requestAnimationFrame for buttery smooth sliders)
  useEffect(() => {
    let animationFrameId
    const renderLoop = () => {
      renderCanvas()
      animationFrameId = requestAnimationFrame(renderLoop)
    }
    renderLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [renderCanvas])

  // Pointer Handlers for Dragging
  const getMousePos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const getTextBounds = () => {
    if (!textConfig?.text?.trim()) return null
    const { text, fontSize, font } = textConfig
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    const selectedFontObj = FONTS.find((f) => f.id === font) || FONTS[0]
    ctx.font = `bold ${fontSize}px ${selectedFontObj.family}`
    const textWidth = ctx.measureText(text.trim()).width
    const paddingX = 18
    const paddingY = 10
    const badgeHeight = fontSize + paddingY * 2
    const badgeWidth = textWidth + paddingX * 2
    
    const y = customPos.y !== null ? customPos.y : 450
    const x = customPos.x
    
    return {
      left: x - badgeWidth / 2,
      right: x + badgeWidth / 2,
      top: y - badgeHeight / 2,
      bottom: y + badgeHeight / 2
    }
  }

  const handlePointerDown = (e) => {
    const bounds = getTextBounds()
    if (!bounds) return
    const pos = getMousePos(e)
    
    if (pos.x >= bounds.left && pos.x <= bounds.right && pos.y >= bounds.top && pos.y <= bounds.bottom) {
      setIsDragging(true)
      setDragOffset({ dx: pos.x - customPos.x, dy: pos.y - customPos.y })
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e) => {
    const pos = getMousePos(e)
    
    if (!isDragging) {
      const bounds = getTextBounds()
      if (bounds) {
        const hovering = (pos.x >= bounds.left && pos.x <= bounds.right && pos.y >= bounds.top && pos.y <= bounds.bottom)
        setIsHovering(hovering)
      } else {
        setIsHovering(false)
      }
    } else {
      setCustomPos({
        x: pos.x - dragOffset.dx,
        y: pos.y - dragOffset.dy
      })
    }
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  // 3. Expose Methods for Exporting
  useImperativeHandle(ref, () => ({
    exportWebP: async () => {
      if (!canvasRef.current) return null
      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          if (!blob) resolve(null)
          resolve(blob)
        }, 'image/webp', 0.95)
      })
    },
    exportPNG: async () => {
      if (!canvasRef.current) return null
      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          if (!blob) resolve(null)
          resolve(blob)
        }, 'image/png')
      })
    },
    exportBase64: async () => {
      if (!canvasRef.current) return null
      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => {
          if (!blob) resolve(null)
          const reader = new FileReader()
          reader.onloadend = () => {
             resolve(reader.result.split(',')[1]) // Return just base64 data
          }
          reader.readAsDataURL(blob)
        }, 'image/webp', 0.95)
      })
    }
  }))

  return (
    <div className="w-full aspect-square bg-[var(--color-surface-2)] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-inner relative flex items-center justify-center checkered-bg">
      {!isImageLoaded && (
         <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-4)] animate-pulse pointer-events-none">
           <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
           <span className="text-xs font-semibold tracking-wider uppercase opacity-50">Upload to Preview</span>
         </div>
      )}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full object-contain touch-none ${isImageLoaded ? 'opacity-100' : 'opacity-0'} ${
          isDragging ? 'cursor-grabbing' : isHovering ? 'cursor-grab' : 'cursor-default'
        }`}
      />
    </div>
  )
})

StickerCanvas.displayName = 'StickerCanvas'
export default StickerCanvas
