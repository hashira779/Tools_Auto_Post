const STYLES = [
  { id: 'original', name: 'Original Fit', desc: 'Keep original proportions, centered on 512×512', badge: 'Popular' },
  { id: 'outline', name: 'White Outline', desc: 'Add crisp white sticker border outline', badge: 'Classic' },
  { id: 'circle', name: 'Circle Badge', desc: 'Clean circular avatar crop with border', badge: 'Avatar' },
  { id: 'rounded', name: 'Rounded Card', desc: 'Smooth curved rectangle corners', badge: 'Clean' },
  { id: 'cartoon', name: 'Cartoon FX', desc: 'Artistic posterized colors with edge lines', badge: 'Artistic' },
]

export default function StickerStyleSelector({ imagePreview, selectedStyle, onSelectStyle, processing, error, onBack }) {
  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-text)]">
            Step 2: Choose Style
          </h2>
          <p className="text-sm text-[var(--color-text-3)] mt-0.5">
            Select a style to generate your sticker
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={processing}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          ← Change Image
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex flex-col items-center justify-center mb-5">
        <div className="w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
          <img
            src={imagePreview}
            alt="Source uploaded"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[11px] text-[var(--color-text-3)] mt-2">Source Image</span>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={processing}
              className={`p-4 rounded-xl text-left transition-all duration-150 relative cursor-pointer select-none border focus-ring ${
                isSelected
                  ? 'border-[var(--color-primary-500)] bg-[rgba(134,59,255,0.06)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-1)]'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-sm text-[var(--color-text)]">{style.name}</span>
                <span className="badge text-[9px] py-0">{style.badge}</span>
              </div>
              <div className="text-xs text-[var(--color-text-3)] leading-relaxed">{style.desc}</div>
              {isSelected && (
                <div className="mt-2 text-xs font-medium text-[var(--color-primary-300)]">
                  ✓ Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Processing */}
      {processing && (
        <div className="flex flex-col items-center justify-center py-6 rounded-xl animate-fade-in" style={{ background: 'rgba(134,59,255,0.06)', border: '1px solid rgba(134,59,255,0.15)' }}>
          <div className="w-5 h-5 border-2 border-[var(--color-primary-400)] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-sm font-medium text-[var(--color-primary-300)]">
            Rendering sticker with {STYLES.find((s) => s.id === selectedStyle)?.name}...
          </span>
          <span className="text-xs text-[var(--color-text-3)] mt-0.5">
            Optimizing 512×512 WebP
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'var(--color-error-dim)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
