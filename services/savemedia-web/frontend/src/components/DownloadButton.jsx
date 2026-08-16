import Icon from '../constants/icons'
import { FORMAT_VIDEO } from '../constants/platforms'

export default function DownloadButton({ formatTab, selectedQuality, downloading, downloadStatus, downloadSuccess, onDownload }) {
  const label = formatTab === FORMAT_VIDEO ? 'MP4' : 'MP3'

  const getButtonClasses = () => {
    if (downloading) {
      return 'bg-[var(--color-surface-3)] text-[var(--color-text)] cursor-wait border border-[var(--color-border)]'
    }
    if (downloadSuccess) {
      return 'bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[rgba(52,211,153,0.2)]'
    }
    if (!selectedQuality) {
      return 'bg-[var(--color-surface-1)] text-[var(--color-text-4)] cursor-not-allowed border border-[var(--color-border)]'
    }
    return 'btn-primary'
  }

  return (
    <button
      id="download-btn"
      className={`w-full py-3.5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-colors duration-200 select-none ${getButtonClasses()}`}
      onClick={onDownload}
      disabled={!selectedQuality || downloading}
    >
      {downloading ? (
        <>
          <div className="w-4 h-4 border-2 border-[var(--color-text-4)] border-t-[var(--color-text)] rounded-full animate-spin" />
          <span>{downloadStatus || 'Processing...'}</span>
        </>
      ) : downloadSuccess ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
