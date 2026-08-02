export default function StickerPreview({ stickerData, onBack }) {
  const imgSrc = `data:image/webp;base64,${stickerData.data_b64}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imgSrc
    link.download = 'sticker.webp'
    link.click()
  }

  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            ✅ Sticker Preview
          </h2>
          <p className="text-sm text-[--color-text-secondary]">
            Your sticker is ready! Choose an emoji below to continue.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors"
        >
          ← Change Style
        </button>
      </div>

      {/* Sticker Preview on Checkerboard */}
      <div className="flex justify-center mb-4">
        <div className="checkerboard rounded-2xl p-4 inline-block">
          <img
            src={imgSrc}
            alt="Sticker preview"
            className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[--color-accent-green]/15 text-[--color-accent-green]">
          {stickerData.dimensions}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[--color-accent-blue]/15 text-[--color-accent-blue]">
          {stickerData.size_kb} KB
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[--color-accent-purple]/15 text-[--color-accent-purple]">
          WebP
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[--color-accent-cyan]/15 text-[--color-accent-cyan]">
          {stickerData.style}
        </span>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="text-sm text-[--color-accent-cyan] hover:text-white transition-colors flex items-center gap-1"
        >
          ⬇️ Download Sticker File
        </button>
      </div>
    </div>
  )
}
