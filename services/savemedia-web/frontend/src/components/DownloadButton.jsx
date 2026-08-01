import Icon from '../constants/icons'
import { FORMAT_VIDEO } from '../constants/platforms'

export default function DownloadButton({ formatTab, selectedQuality, downloading, downloadStatus, downloadSuccess, onDownload }) {
  const label = formatTab === FORMAT_VIDEO ? 'MP4' : 'MP3'

  let btnClass = 'btn-playful hover:scale-[1.02] active:scale-[0.98]'
  if (downloading) {
    btnClass = 'bg-orange-400 cursor-wait shadow-[0_8px_0_#c2410c] text-white'
  } else if (downloadSuccess) {
    btnClass = 'bg-green-500 shadow-[0_8px_0_#15803d] text-white animate-pop-in'
  }

  return (
    <button
      id="download-btn"
      className={`w-full py-5 rounded-3xl text-white text-2xl font-black uppercase tracking-wider
                  flex items-center justify-center gap-4 cursor-pointer
                  border-none transition-all duration-300 relative overflow-hidden
                  ${!selectedQuality && !downloading && !downloadSuccess ? 'bg-gray-300 shadow-[0_8px_0_#9ca3af] text-gray-500 cursor-not-allowed transform-none hover:transform-none' : btnClass}
                  ${selectedQuality && !downloading && !downloadSuccess ? 'animate-pulse-soft' : ''}`}
      onClick={onDownload}
      disabled={!selectedQuality || downloading}
    >
      {downloading ? (
        <>
          <span className="spinner" />
          <span className="animate-pulse">{downloadStatus || 'Processing...'}</span>
        </>
      ) : downloadSuccess ? (
        <>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Done!
        </>
      ) : (
        <>
          {Icon.download}
          Download {label}
        </>
      )}
    </button>
  )
}
