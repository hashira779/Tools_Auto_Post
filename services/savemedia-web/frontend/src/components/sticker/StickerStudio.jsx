import { useState, useCallback } from 'react'

import StickerStepIndicator from './StickerStepIndicator'
import StickerUploader from './StickerUploader'
import StickerStyleSelector from './StickerStyleSelector'
import StickerPreviewCard from './StickerPreviewCard'
import StickerEmojiPicker from './StickerEmojiPicker'
import StickerTelegramPublish from './StickerTelegramPublish'

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Style' },
  { id: 3, label: 'Preview' },
  { id: 4, label: 'Publish' },
]

export default function StickerStudio() {
  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('original')
  const [stickerResult, setStickerResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedEmoji, setSelectedEmoji] = useState('😀')

  // Step 1 -> Step 2
  const handleImageUpload = useCallback((file) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStickerResult(null)
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
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Image processing failed.')
      }

      setStickerResult(data.sticker)
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
    setStickerResult(null)
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

      {/* Step 3: Preview + Emoji Picker */}
      {step === 3 && stickerResult && (
        <div className="animate-pop-in">
          <StickerPreviewCard
            stickerData={stickerResult}
            onBack={() => setStep(2)}
          />
          <StickerEmojiPicker
            selected={selectedEmoji}
            onSelect={handleEmojiSelect}
            onContinue={handleContinueToPublish}
          />
        </div>
      )}

      {/* Step 4: Publish to Telegram */}
      {step === 4 && stickerResult && (
        <div className="animate-pop-in">
          <StickerTelegramPublish
            stickerData={stickerResult}
            emoji={selectedEmoji}
            onReset={handleReset}
            onBack={() => setStep(3)}
          />
        </div>
      )}
    </div>
  )
}
