export default function VideoPreview({ videoInfo }) {
  if (!videoInfo) return null

  return (
    <div className="flex flex-col sm:flex-row gap-5 mb-8 pb-8 border-b-2 border-gray-100">
      {/* Thumbnail */}
      {videoInfo.thumbnail && (
        <div className="relative overflow-hidden rounded-3xl shrink-0
                        w-full sm:w-[220px] h-[180px] sm:h-[130px]
                        bg-gray-100 shadow-sm border-2 border-gray-50">
          <img
            className="w-full h-full object-cover"
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {/* Duration overlay */}
          {videoInfo.duration_str && (
            <span className="absolute bottom-3 right-3 px-3 py-1
                             bg-black/80 backdrop-blur-md rounded-xl
                             text-xs font-black text-white tabular-nums tracking-widest shadow-lg">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h2 className="text-xl font-black leading-tight mb-3 line-clamp-2 text-gray-800">
          {videoInfo.title}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                           text-[11px] font-black uppercase tracking-widest
                           bg-[var(--color-accent-orange)] text-white shadow-sm">
            {videoInfo.platform_name}
          </span>
          {videoInfo.duration && (
            <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full
                             text-[11px] font-black uppercase tracking-widest
                             bg-[var(--color-accent-blue)] text-white shadow-sm">
              ⏱ {videoInfo.duration_str}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
