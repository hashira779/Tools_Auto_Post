export default function VideoPreview({ videoInfo }) {
  if (!videoInfo) return null

  return (
    <div className="flex flex-col sm:flex-row gap-5 mb-6 pb-6 border-b border-white/10">
      {/* Thumbnail */}
      {videoInfo.thumbnail && (
        <div className="relative overflow-hidden rounded-2xl shrink-0
                        w-full sm:w-[220px] h-[160px] sm:h-[130px]
                        bg-slate-950 border border-white/10 shadow-lg">
          <img
            className="w-full h-full object-cover"
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {/* Duration overlay */}
          {videoInfo.duration_str && (
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5
                             bg-slate-950/80 backdrop-blur-md rounded-lg
                             text-[11px] font-bold text-white tabular-nums tracking-wide border border-white/10">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h2 className="text-base sm:text-lg font-bold leading-snug mb-3 line-clamp-2 text-white">
          {videoInfo.title}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                           text-xs font-semibold uppercase tracking-wider
                           bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {videoInfo.platform_name}
          </span>
          {videoInfo.duration && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg
                             text-xs font-semibold tracking-wider
                             bg-slate-800 text-slate-300 border border-white/10">
              ⏱ {videoInfo.duration_str}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
