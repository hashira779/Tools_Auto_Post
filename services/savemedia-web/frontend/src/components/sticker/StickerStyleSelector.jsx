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
          <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
            Step 2: Choose Style
          </h2>
          <p className="text-[12px] text-[var(--color-text-3)] mt-0.5">
            Select a style to generate your sticker
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={processing}
          className="btn-ghost text-[11px] px-3 py-1.5"
        >
          ← Change Image
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-sm">
          <img
            src={imagePreview}
            alt="Source uploaded"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[10px] text-[var(--color-text-4)] uppercase tracking-wider font-semibold mt-2">Source Image</span>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={processing}
              className={`p-3 rounded-xl text-left transition-all duration-150 relative cursor-pointer select-none border focus-ring outline-none ${
                isSelected
                  ? 'border-[var(--color-primary-500)] bg-[rgba(134,59,255,0.06)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-1)]'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className={`font-semibold text-[13px] ${isSelected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-2)]'}`}>{style.name}</span>
                <span className="badge text-[9px] py-0 px-1.5 tracking-wide">{style.badge}</span>
              </div>
              <div className="text-[11px] text-[var(--color-text-4)] leading-relaxed">{style.desc}</div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Processing */}
      {processing && (
        <div className="flex flex-col items-center justify-center py-5 rounded-xl animate-fade-in border border-[var(--color-primary-500)]/20 bg-[var(--color-primary-500)]/5">
          <div className="w-4 h-4 border-2 border-[var(--color-primary-400)]/30 border-t-[var(--color-primary-400)] rounded-full animate-spin mb-2" />
          <span className="text-[12px] font-medium text-[var(--color-text)]">
            Rendering {STYLES.find((s) => s.id === selectedStyle)?.name}...
          </span>
          <span className="text-[10px] text-[var(--color-text-4)] mt-0.5 uppercase tracking-wider">
            Optimizing 512×512 WebP
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ background: 'var(--color-error-dim)', color: 'var(--color-error)', border: '1px solid rgba(248, 113, 113, 0.15)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
