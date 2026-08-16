export default function QualityGrid({ formats, selectedQuality, onSelect }) {
  if (!formats || formats.length === 0) return null

  return (
    <div id="quality-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
      {formats.map((fmt, i) => {
        const selected = selectedQuality === fmt.quality
        return (
          <button
            key={fmt.quality}
            className={`group relative p-4 rounded-2xl text-center cursor-pointer transition-all duration-300 border outline-none focus-ring shadow-sm ${
              selected
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-900)] shadow-[0_0_16px_-4px_rgba(134,59,255,0.4)] transform scale-[1.02]'
                : 'border-[var(--color-border-2)] bg-[var(--color-surface-1)] hover:border-[var(--color-border-3)] hover:bg-[var(--color-surface-2)] hover:shadow-md'
            }`}
            onClick={() => onSelect(fmt.quality)}
          >
            {/* Best badge */}
            {i === 0 && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[var(--color-primary-600)] rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/10">
                Best
              </span>
            )}

            {/* Checkmark */}
            {selected && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            <div className={`text-[17px] font-bold mb-1.5 transition-colors ${
              selected ? 'text-[var(--color-primary-100)]' : 'text-[var(--color-text)]'
            }`}>
              {fmt.label}
            </div>
            {fmt.filesize_approx && (
              <div className="text-xs text-[var(--color-text-3)] font-semibold">
                ~{fmt.filesize_approx} MB
              </div>
            )}
            <div className={`text-[10px] mt-2 uppercase tracking-widest font-bold ${
              selected ? 'text-[var(--color-primary-300)]' : 'text-[var(--color-text-4)]'
            }`}>
              {fmt.ext}
            </div>
          </button>
        )
      })}
    </div>
  )
}
