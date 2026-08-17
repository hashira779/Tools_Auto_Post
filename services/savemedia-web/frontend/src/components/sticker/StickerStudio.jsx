import { useState } from 'react'

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
  { id: 3, label: 'Text' },
  { id: 4, label: 'Export' },
]

export default function StickerStudio() {
  const [currentStep, setCurrentStep] = useState(1)

  // Uploaded file state
  const [sourceImage, setSourceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Selected style (e.g., outline, circle)
  const [selectedStyle, setSelectedStyle] = useState('original')

  // API response: the raw processed sticker (no text yet)
  const [baseStickerData, setBaseStickerData] = useState(null)

  // Current sticker (could be base or with custom text applied)
  const [currentStickerData, setCurrentStickerData] = useState(null)

  // Selected emoji for Telegram
  const [emoji, setEmoji] = useState('😂')

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleUpload = (file) => {
    setSourceImage(file)
    setImagePreview(URL.createObjectURL(file))
    setCurrentStep(2)
  }

  const handleStyleGenerate = async (styleId) => {
    if (!sourceImage) return
    setSelectedStyle(styleId)
    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', sourceImage)
      formData.append('style', styleId)

      const res = await fetch('/api/sticker/process', {
        method: 'POST',
        body: formData,
      })

      const text = await res.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error(`Server returned error (${res.status}). Please try again.`)
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process image.')
      }

      // Extract sticker data object (support both data.sticker and top-level data)
      const stickerObj = data.sticker || data
      if (!stickerObj || !stickerObj.data_b64) {
        throw new Error('Server returned invalid data format.')
      }

      setBaseStickerData(stickerObj)
      setCurrentStickerData(stickerObj) // initially same
      setCurrentStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSourceImage(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setBaseStickerData(null)
    setCurrentStickerData(null)
    setError(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-10">
      <StickerStepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="relative">
        {currentStep === 1 && (
          <StickerUploader onUpload={handleUpload} />
        )}

        {currentStep === 2 && (
          <StickerStyleSelector
            imagePreview={imagePreview}
            selectedStyle={selectedStyle}
            onSelectStyle={handleStyleGenerate}
            processing={processing}
            error={error}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && baseStickerData && currentStickerData && (
          <div className="animate-fade-in space-y-4">
            <StickerPreviewCard
              stickerData={currentStickerData}
              onBack={() => setCurrentStep(2)}
            />
            <StickerTextEditor
              baseStickerData={baseStickerData}
              onStickerUpdated={setCurrentStickerData}
            />
            <StickerEmojiPicker
              selected={emoji}
              onSelect={setEmoji}
              onContinue={() => setCurrentStep(4)}
            />
          </div>
        )}

        {currentStep === 4 && currentStickerData && (
          <StickerTelegramPublish
            stickerData={currentStickerData}
            emoji={emoji}
            onReset={handleReset}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </div>
    </div>
  )
}
