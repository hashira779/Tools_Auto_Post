export default function VideoPreview({ videoInfo }) {
  if (!videoInfo) return null

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-5 pb-5 border-b border-[var(--color-border)]">
      {/* Thumbnail */}
      {videoInfo.thumbnail && (
        <div className="relative overflow-hidden rounded-lg shrink-0 w-full sm:w-[200px] h-[140px] sm:h-[120px] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
          <img
            className="w-full h-full object-cover"
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {videoInfo.duration_str && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/75 rounded text-[10px] font-medium text-white/90 tabular-nums">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h2 className="text-sm font-medium leading-snug mb-2.5 line-clamp-2 text-[var(--color-text)]">
          {videoInfo.title}
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="badge badge-primary text-[10px]">
            {videoInfo.platform_name}
          </span>
          {videoInfo.duration && (
            <span className="badge text-[10px]">
              {videoInfo.duration_str}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
