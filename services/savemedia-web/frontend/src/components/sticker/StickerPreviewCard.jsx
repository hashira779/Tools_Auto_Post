export default function StickerPreviewCard({ stickerData, onBack }) {
  const imgSrc = `data:image/webp;base64,${stickerData.data_b64}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imgSrc
    link.download = `sticker_${Date.now()}.webp`
    link.click()
  }

  return (
    <div className="card-playful p-6 sm:p-8 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>✨</span> Step 3: Sticker Generated!
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Your 512×512 WebP sticker is ready. Check the preview below.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs sm:text-sm font-extrabold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          ← Change Style
        </button>
      </div>

      {/* Main Sticker Preview on Checkerboard Canvas */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-purple-100 relative group">
          <div className="checkerboard w-52 h-52 sm:w-64 sm:h-64 rounded-2xl flex items-center justify-center overflow-hidden">
            <img
              src={imgSrc}
              alt="Generated sticker"
              className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ {stickerData.dimensions || '512×512'}
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            💾 {stickerData.size_kb} KB
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            🏷️ WebP Static
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            🎨 {stickerData.style || 'Custom'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          <span>⬇️</span> Download WebP File
        </button>
      </div>
    </div>
  )
}
