import Icon from '../constants/icons'

export default function QualityGrid({ formats, selectedQuality, onSelect }) {
  if (!formats || formats.length === 0) return null

  return (
    <div id="quality-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {formats.map((fmt, i) => {
        const selected = selectedQuality === fmt.quality
        return (
          <button
            key={fmt.quality}
            className={`group relative p-5 rounded-3xl text-center cursor-pointer
                        transition-all duration-300 border-4 outline-none
                        ${selected
                          ? 'border-[var(--color-accent-blue)] bg-blue-50 shadow-[0_10px_20px_rgba(59,130,246,0.15)] -translate-y-1'
                          : 'border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-100'
                        }
                        ${i === 0 && !selected ? 'ring-2 ring-orange-200' : ''}`}
            onClick={() => onSelect(fmt.quality)}
          >
            {/* Recommended badge for first item */}
            {i === 0 && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2
                               px-3 py-1 bg-[var(--color-accent-orange)] rounded-full
                               text-[10px] font-bold uppercase tracking-widest text-white
                               shadow-sm">
                Best!
              </span>
            )}

            {/* Checkmark */}
            <div
              className={`absolute top-3 right-3 w-6 h-6 rounded-full
                          bg-[var(--color-accent-blue)] text-white flex items-center justify-center
                          transition-all duration-300
                          ${selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className={`text-xl font-black mb-1 transition-colors duration-300
                             ${selected ? 'text-[var(--color-accent-blue)]' : 'text-gray-800 group-hover:text-blue-600'}`}>
              {fmt.label}
            </div>
            {fmt.filesize_approx && (
              <div className="text-xs text-gray-400 font-bold">
                ~{fmt.filesize_approx} MB
              </div>
            )}
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black bg-gray-100 inline-block px-2 py-0.5 rounded-md">
              {fmt.ext}
            </div>
          </button>
        )
      })}
    </div>
  )
}
