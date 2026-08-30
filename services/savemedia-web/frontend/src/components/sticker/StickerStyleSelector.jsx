const STYLES = [
  { id: 'original', name: 'Original Fit', desc: 'Keep proportions', badge: 'Popular' },
  { id: 'outline', name: 'White Outline', desc: 'Add crisp border', badge: 'Classic' },
  { id: 'circle', name: 'Circle Badge', desc: 'Circular avatar crop', badge: 'Avatar' },
  { id: 'rounded', name: 'Rounded Card', desc: 'Smooth curved corners', badge: 'Clean' },
  { id: 'cartoon', name: 'Cartoon FX', desc: 'Artistic edge lines', badge: 'Artistic' },
]

export default function StickerStyleSelector({ selectedStyle, onSelectStyle, processing }) {
  return (
    <div className="card p-5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border)]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
          Image Style
        </h3>
        {processing && (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10 px-2 py-1 rounded-md">
            <div className="w-2.5 h-2.5 border border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              disabled={processing}
              className={`p-2.5 rounded-xl text-left transition-all duration-150 relative cursor-pointer select-none border focus-ring outline-none ${
                isSelected
                  ? 'border-[var(--color-primary-500)] bg-[rgba(134,59,255,0.06)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-1)]'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={`font-semibold text-[11px] ${isSelected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-2)]'}`}>{style.name}</span>
              </div>
              <div className="text-[9px] text-[var(--color-text-4)] leading-snug pr-2">{style.desc}</div>
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white">
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
