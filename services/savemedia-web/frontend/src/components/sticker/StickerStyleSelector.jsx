const STYLES = [
  {
    id: 'original',
    name: 'Original Fit',
    icon: '📷',
    desc: 'Keep original proportions, centered on 512×512',
    badge: 'Popular',
  },
  {
    id: 'outline',
    name: 'White Outline',
    icon: '✏️',
    desc: 'Add crisp white sticker border outline',
    badge: 'Classic',
  },
  {
    id: 'circle',
    name: 'Circle Badge',
    icon: '⭕',
    desc: 'Clean circular avatar crop with border',
    badge: 'Avatar',
  },
  {
    id: 'rounded',
    name: 'Rounded Card',
    icon: '🔲',
    desc: 'Smooth curved rectangle corners',
    badge: 'Clean',
  },
  {
    id: 'cartoon',
    name: 'Cartoon FX',
    icon: '🎨',
    desc: 'Artistic posterized colors with edge lines',
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
    <div className="glass-card p-6 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>🎭</span> Step 2: Choose Sticker Style
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Select a style to generate your 512×512 sticker
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={processing}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-white/10"
        >
          ← Change Image
        </button>
      </div>

      {/* Image Preview Thumbnail */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border border-white/15 p-1 bg-slate-900 relative">
          <img
            src={imagePreview}
            alt="Source uploaded"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-400 mt-2">Source Image Ready</span>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id

          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={processing}
              className={`p-4 rounded-xl text-left transition-all duration-200 relative cursor-pointer select-none border ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                  : 'border-white/5 bg-slate-950/60 hover:border-white/20 hover:bg-slate-900/80'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-xl border border-white/10">
                  {style.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                  {style.badge}
                </span>
              </div>

              <div className="font-bold text-sm text-white mb-0.5">{style.name}</div>
              <div className="text-xs text-slate-400 leading-relaxed font-normal">{style.desc}</div>

              {isSelected && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <span>✓</span> Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Processing State */}
      {processing && (
        <div className="flex flex-col items-center justify-center py-6 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-fade-in">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-sm font-bold text-indigo-300">
            Rendering sticker with {STYLES.find((s) => s.id === selectedStyle)?.name}...
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            Optimizing 512×512 WebP &amp; formatting transparency
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}
    </div>
  )
}
