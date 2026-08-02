import { useState, useCallback } from 'react'

import BackgroundOrbs from './components/BackgroundOrbs'
import Header from './components/Header'
import StepIndicator from './components/StepIndicator'
import ImageUploader from './components/ImageUploader'
import StyleSelector from './components/StyleSelector'
import StickerPreview from './components/StickerPreview'
import EmojiPicker from './components/EmojiPicker'
import TelegramConnect from './components/TelegramConnect'
import Footer from './components/Footer'

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Style' },
  { id: 3, label: 'Preview' },
  { id: 4, label: 'Publish' },
]

function App() {
  // Current step in the workflow
  const [step, setStep] = useState(1)

  // Uploaded image (File object + data URL preview)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Selected style
  const [selectedStyle, setSelectedStyle] = useState('original')

  // Processed sticker result from API
  const [stickerResult, setStickerResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Selected emoji
  const [selectedEmoji, setSelectedEmoji] = useState('😀')

  // ── Handlers ──────────────────────────────────────────────────

  const handleImageUpload = useCallback((file) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStickerResult(null)
    setError(null)
    setStep(2)
  }, [])

  const handleStyleSelect = useCallback(async (style) => {
    setSelectedStyle(style)
    if (!imageFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('style', style)

      const res = await fetch('/api/process', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || 'Processing failed')

      setStickerResult(data.sticker)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [imageFile])

  const handleEmojiSelect = useCallback((emoji) => {
    setSelectedEmoji(emoji)
    setStep(4)
  }, [])

  const handleReset = useCallback(() => {
    setStep(1)
    setImageFile(null)
    setImagePreview(null)
    setStickerResult(null)
    setSelectedStyle('original')
    setSelectedEmoji('😀')
    setError(null)
  }, [])

  const handleBackToStyle = useCallback(() => {
    setStep(2)
    setStickerResult(null)
  }, [])

  return (
    <>
      <BackgroundOrbs />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        <Header />

        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="w-full max-w-[800px] mt-8">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="animate-slide-up">
              <ImageUploader onUpload={handleImageUpload} />
            </div>
          )}

          {/* Step 2: Style Selection */}
          {step === 2 && (
            <div className="animate-slide-up">
              <StyleSelector
                imagePreview={imagePreview}
                selectedStyle={selectedStyle}
                onSelectStyle={handleStyleSelect}
                processing={processing}
                error={error}
                onBack={handleReset}
              />
            </div>
          )}

          {/* Step 3: Preview + Emoji */}
          {step === 3 && stickerResult && (
            <div className="animate-slide-up">
              <StickerPreview
                stickerData={stickerResult}
                onBack={handleBackToStyle}
              />
              <div className="mt-6">
                <EmojiPicker
                  selected={selectedEmoji}
                  onSelect={handleEmojiSelect}
                />
              </div>
            </div>
          )}

          {/* Step 4: Telegram Connect */}
          {step === 4 && stickerResult && (
            <div className="animate-slide-up">
              <TelegramConnect
                stickerData={stickerResult}
                emoji={selectedEmoji}
                onReset={handleReset}
                onBack={() => setStep(3)}
              />
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}

export default App
