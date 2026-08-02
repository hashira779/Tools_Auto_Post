import { useState, useCallback } from 'react'

import StickerStepIndicator from './StickerStepIndicator'
import StickerUploader from './StickerUploader'
import StickerStyleSelector from './StickerStyleSelector'
import StickerPreviewCard from './StickerPreviewCard'
import StickerTextEditor from './StickerTextEditor'
import StickerEmojiPicker from './StickerEmojiPicker'
import StickerTelegramPublish from './StickerTelegramPublish'

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Style' },
  { id: 3, label: 'Preview & Text' },
  { id: 4, label: 'Publish' },
]

export default function StickerStudio() {
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('original')
  const [baseStickerResult, setBaseStickerResult] = useState(null)
  const [activeStickerResult, setActiveStickerResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedEmoji, setSelectedEmoji] = useState('😀')

  // Step 1 -> Step 2
  const handleImageUpload = useCallback((file) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setBaseStickerResult(null)
    setActiveStickerResult(null)
    setError(null)
    setStep(2)
  }, [])

  // Step 2 -> Step 3: Call Sticker API
  const handleStyleSelect = useCallback(async (style) => {
    setSelectedStyle(style)
    if (!imageFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('style', style)

      const res = await fetch('/api/sticker/process', {
        method: 'POST',
        body: formData,
      })

      const text = await res.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Processing service unavailable (${res.status}). Please try again.`)
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Image processing failed.')
      }

      setBaseStickerResult(data.sticker)
      setActiveStickerResult(data.sticker)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [imageFile])

  // Step 3 -> Step 4
  const handleEmojiSelect = useCallback((emoji) => {
    setSelectedEmoji(emoji)
  }, [])

  const handleContinueToPublish = useCallback(() => {
    setStep(4)
  }, [])

  // Reset entire flow
  const handleReset = useCallback(() => {
    setStep(1)
    setImageFile(null)
    setImagePreview(null)
    setBaseStickerResult(null)
    setActiveStickerResult(null)
    setSelectedStyle('original')
    setSelectedEmoji('😀')
    setError(null)
  }, [])

  return (
    <div className="w-full max-w-[760px] animate-slide-up mb-8">
      {/* Wizard Steps */}
      <StickerStepIndicator steps={STEPS} currentStep={step} />

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="animate-pop-in">
          <StickerUploader onUpload={handleImageUpload} />
        </div>
      )}

      {/* Step 2: Choose Style */}
      {step === 2 && (
        <div className="animate-pop-in">
          <StickerStyleSelector
            imagePreview={imagePreview}
            selectedStyle={selectedStyle}
            onSelectStyle={handleStyleSelect}
            processing={processing}
            error={error}
            onBack={handleReset}
          />
        </div>
      )}

      {/* Step 3: Preview + Khmer & Meme Text Editor + Emoji Picker */}
      {step === 3 && baseStickerResult && (
        <div className="animate-pop-in">
          <StickerPreviewCard
            stickerData={activeStickerResult || baseStickerResult}
            onBack={() => setStep(2)}
          />

          <StickerTextEditor
            baseStickerData={baseStickerResult}
            onStickerUpdated={setActiveStickerResult}
          />

          <StickerEmojiPicker
            selected={selectedEmoji}
            onSelect={handleEmojiSelect}
            onContinue={handleContinueToPublish}
          />
        </div>
      )}

      {/* Step 4: Publish to Telegram */}
      {step === 4 && activeStickerResult && (
        <div className="animate-pop-in">
          <StickerTelegramPublish
            stickerData={activeStickerResult}
            emoji={selectedEmoji}
            onReset={handleReset}
            onBack={() => setStep(3)}
          />
        </div>
      )}
    </div>
  )
}
