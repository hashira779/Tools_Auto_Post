export default function QualityGrid({ formats, selectedQuality, onSelect }) {
  if (!formats || formats.length === 0) return null

  return (
    <div id="quality-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
      {formats.map((fmt, i) => {
        const selected = selectedQuality === fmt.quality
        return (
          <button
            key={fmt.quality}
            className={`group relative p-3.5 rounded-xl text-center cursor-pointer transition-all duration-200 border outline-none focus-ring ${
              selected
                ? 'border-[var(--color-primary-500)] bg-[rgba(134,59,255,0.08)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-1)]'
            }`}
            onClick={() => onSelect(fmt.quality)}
          >
            {/* Best badge */}
            {i === 0 && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--color-primary-500)] rounded-md text-[9px] font-semibold uppercase tracking-wider text-white">
                Best
              </span>
            )}

            {/* Checkmark */}
            {selected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            <div className={`text-base font-semibold mb-1 ${
              selected ? 'text-[var(--color-primary-300)]' : 'text-[var(--color-text)]'
            }`}>
              {fmt.label}
            </div>
            {fmt.filesize_approx && (
              <div className="text-[11px] text-[var(--color-text-3)] font-medium">
                ~{fmt.filesize_approx} MB
              </div>
            )}
            <div className="text-[10px] text-[var(--color-text-4)] mt-1.5 uppercase tracking-wider font-medium">
              {fmt.ext}
            </div>
          </button>
        )
      })}
    </div>
  )
}
