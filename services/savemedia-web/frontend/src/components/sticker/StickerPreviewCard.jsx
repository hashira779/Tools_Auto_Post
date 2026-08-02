export default function StickerPreviewCard({ stickerData, onBack }) {
  const imgSrc = `data:image/webp;base64,${stickerData.data_b64}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imgSrc
    link.download = `sticker_${Date.now()}.webp`
    link.click()
  }

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>✨</span> Step 3: Sticker Preview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Your 512×512 WebP sticker is processed and optimized
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-white/10"
        >
          ← Change Style
        </button>
      </div>

      {/* Main Sticker Preview on Checkerboard Canvas */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="p-2 bg-slate-950 rounded-2xl shadow-2xl border border-white/15 relative group">
          <div className="checkerboard w-48 h-48 sm:w-60 sm:h-60 rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src={imgSrc}
              alt="Generated sticker"
              className="w-full h-full object-contain filter drop-shadow-lg transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ {stickerData.dimensions || '512×512'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            💾 {stickerData.size_kb} KB
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            🏷️ WebP
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-white/10">
            🎨 {stickerData.style || 'Custom'}
          </span>
        </div>
      </div>

      {/* Download Action */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
        >
          <span>⬇️</span> Download WebP File
        </button>
      </div>
    </div>
  )
}
