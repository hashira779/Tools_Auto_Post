export default function VideoPreview({ videoInfo }) {
  if (!videoInfo) return null

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-5 pb-5 border-b border-[var(--color-border)]">
      {/* Thumbnail */}
      {videoInfo.thumbnail && (
        <div className="relative overflow-hidden rounded-xl shrink-0 w-full sm:w-[220px] h-[150px] sm:h-[130px] bg-[var(--color-surface-2)] shadow-md border border-[var(--color-border-2)]">
          <img
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {videoInfo.duration_str && (
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[11px] font-semibold text-white/90 tabular-nums shadow-sm border border-white/10">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h2 className="text-sm sm:text-[15px] font-semibold leading-snug mb-3 line-clamp-2 text-[var(--color-text)]">
          {videoInfo.title}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-primary text-[11px]">
            {videoInfo.platform_name}
          </span>
          {videoInfo.duration && (
            <span className="badge text-[11px]">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
