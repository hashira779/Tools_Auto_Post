const STYLES = [
  {
    id: 'original',
    name: 'Original Fit',
    icon: '📷',
    desc: 'Keep original image, center & fit to 512×512',
    color: 'from-blue-500 to-indigo-600',
    badge: 'Popular',
  },
  {
    id: 'outline',
    name: 'White Outline',
    icon: '✏️',
    desc: 'Adds a bright white sticker border outline',
    color: 'from-purple-500 to-pink-500',
    badge: 'Classic',
  },
  {
    id: 'circle',
    name: 'Circle Badge',
    icon: '⭕',
    desc: 'Crops into a circle with clean border',
    color: 'from-amber-400 to-orange-500',
    badge: 'Avatar',
  },
  {
    id: 'rounded',
    name: 'Rounded Card',
    icon: '🔲',
    desc: 'Smooth curved corners with soft edges',
    color: 'from-emerald-400 to-teal-600',
    badge: 'Clean',
  },
  {
    id: 'cartoon',
    name: 'Cartoon FX',
    icon: '🎨',
    desc: 'Posterize artistic colors with bold lines',
    color: 'from-rose-500 to-red-600',
    badge: 'Artistic',
  },
]

export default function StickerStyleSelector({
  imagePreview,
  selectedStyle,
  onSelectStyle,
  processing,
  error,
  onBack,
}) {
  return (
    <div className="card-playful p-6 sm:p-8 transition-all duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>🎭</span> Step 2: Choose Sticker Style
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Select a processing style to turn your image into a sticker
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={processing}
          className="text-xs sm:text-sm font-extrabold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          ← Change Image
        </button>
      </div>

      {/* Image Preview Thumbnail */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md border-3 border-purple-200 p-1 bg-white relative">
          <img
            src={imagePreview}
            alt="Source uploaded"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <span className="text-xs font-bold text-gray-400 mt-2">Source Image Ready</span>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id

          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={processing}
              className={`p-4 rounded-2xl text-left transition-all duration-300 relative cursor-pointer select-none border-2 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/60 shadow-lg shadow-purple-500/10 scale-[1.02]'
                  : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5'
              } ${processing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shadow-xs">
                  {style.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {style.badge}
                </span>
              </div>

              <div className="font-extrabold text-sm text-gray-900 mb-1">{style.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed font-medium">{style.desc}</div>

              {isSelected && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-purple-700">
                  <span>✓</span> Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Processing State */}
      {processing && (
        <div className="flex flex-col items-center justify-center py-6 bg-purple-50/70 rounded-2xl border border-purple-200 animate-pulse">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-sm font-black text-purple-900">
            Processing sticker with {STYLES.find((s) => s.id === selectedStyle)?.name}...
          </span>
          <span className="text-xs font-semibold text-purple-600 mt-0.5">
            Optimizing 512×512 WebP & removing background boundaries
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 px-5 py-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}
    </div>
  )
}
