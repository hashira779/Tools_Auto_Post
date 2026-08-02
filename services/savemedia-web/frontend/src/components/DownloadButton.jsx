import Icon from '../constants/icons'
import { FORMAT_VIDEO } from '../constants/platforms'

export default function DownloadButton({ formatTab, selectedQuality, downloading, downloadStatus, downloadSuccess, onDownload }) {
  const label = formatTab === FORMAT_VIDEO ? 'MP4' : 'MP3'

  let btnClass = 'btn-pro'
  if (downloading) {
    btnClass = 'bg-amber-600/90 text-white cursor-wait'
  } else if (downloadSuccess) {
    btnClass = 'bg-emerald-600 text-white animate-fade-in'
  }

  return (
    <button
      id="download-btn"
      className={`w-full py-4 rounded-xl text-white text-base sm:text-lg font-bold uppercase tracking-wider
                  flex items-center justify-center gap-3 cursor-pointer
                  transition-all duration-200 select-none
                  ${!selectedQuality && !downloading && !downloadSuccess ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5 shadow-none' : btnClass}`}
      onClick={onDownload}
      disabled={!selectedQuality || downloading}
    >
      {downloading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{downloadStatus || 'Processing...'}</span>
        </>
      ) : downloadSuccess ? (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Download Complete!</span>
        </>
      ) : (
        <>
          {Icon.download}
          <span>Download {label}</span>
        </>
      )}
    </button>
  )
}
