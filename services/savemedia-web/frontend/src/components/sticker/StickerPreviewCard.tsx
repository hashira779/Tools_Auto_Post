export default function StickerPreviewCard({ stickerData, onBack }) {
  const imgSrc = `data:image/webp;base64,${stickerData.data_b64}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imgSrc
    link.download = `sticker_${Date.now()}.webp`
    link.click()
  }

  return (
    <div className="card p-5 sm:p-6 animate-fade-in mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
            Step 3: Preview
          </h2>
          <p className="text-[12px] text-[var(--color-text-3)] mt-0.5">
            Your 512×512 WebP sticker is ready
          </p>
        </div>
        <button
          onClick={onBack}
          className="btn-ghost text-[11px] px-3 py-1.5"
        >
          ← Change Style
        </button>
      </div>

      {/* Sticker Preview */}
      <div className="flex flex-col items-center justify-center mb-5">
        <div className="p-1.5 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border-2)] shadow-sm">
          <div className="checkerboard w-44 h-44 sm:w-52 sm:h-52 rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src={imgSrc}
              alt="Generated sticker"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-center gap-1.5 mt-5 flex-wrap">
          <span className="badge badge-success text-[10px]">
            {stickerData.dimensions || '512×512'}
          </span>
          <span className="badge text-[10px]">
            {stickerData.size_kb} KB
          </span>
          <span className="badge text-[10px]">
            WebP
          </span>
          <span className="badge text-[10px]">
            {stickerData.style || 'Custom'}
          </span>
        </div>
      </div>

      {/* Download */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="btn-secondary px-5 py-2 text-[13px] font-medium flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download WebP
        </button>
      </div>
    </div>
  )
}
