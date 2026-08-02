export default function QualityGrid({ formats, selectedQuality, onSelect }) {
  if (!formats || formats.length === 0) return null

  return (
    <div id="quality-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      {formats.map((fmt, i) => {
        const selected = selectedQuality === fmt.quality
        return (
          <button
            key={fmt.quality}
            className={`group relative p-4 rounded-xl text-center cursor-pointer
                        transition-all duration-200 border outline-none
                        ${selected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 -translate-y-0.5'
                          : 'border-white/5 bg-slate-950/60 hover:bg-slate-900/80 hover:border-white/15'
                        }`}
            onClick={() => onSelect(fmt.quality)}
          >
            {/* Recommended badge */}
            {i === 0 && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2
                               px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full
                               text-[10px] font-bold uppercase tracking-wider text-white
                               shadow-md">
                Best
              </span>
            )}

            {/* Checkmark */}
            <div
              className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full
                          bg-indigo-500 text-white flex items-center justify-center
                          transition-all duration-200
                          ${selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className={`text-base sm:text-lg font-bold mb-1 transition-colors
                             ${selected ? 'text-indigo-400' : 'text-white group-hover:text-indigo-300'}`}>
              {fmt.label}
            </div>
            {fmt.filesize_approx && (
              <div className="text-xs text-slate-400 font-medium">
                ~{fmt.filesize_approx} MB
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold bg-slate-800/80 inline-block px-2 py-0.5 rounded-md border border-white/5">
              {fmt.ext}
            </div>
          </button>
        )
      })}
    </div>
  )
}
