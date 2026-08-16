import Icon from '../constants/icons'
import { FORMAT_VIDEO } from '../constants/platforms'

export default function DownloadButton({ formatTab, selectedQuality, downloading, downloadStatus, downloadSuccess, onDownload }) {
  const label = formatTab === FORMAT_VIDEO ? 'MP4' : 'MP3'

  const getButtonClasses = () => {
    if (downloading) {
      return 'bg-amber-600 text-white cursor-wait'
    }
    if (downloadSuccess) {
      return 'bg-[var(--color-success)] text-white'
    }
    if (!selectedQuality) {
      return 'bg-[var(--color-surface-2)] text-[var(--color-text-4)] cursor-not-allowed border border-[var(--color-border)]'
    }
    return 'btn-primary'
  }

  return (
    <button
      id="download-btn"
      className={`w-full py-4 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 select-none shadow-sm ${getButtonClasses()}`}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Download Complete</span>
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
