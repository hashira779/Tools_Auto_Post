import { useRef, useMemo } from 'react'
import Icon from '../constants/icons'
import { PLATFORMS } from '../constants/platforms'

// Detect which platform a URL belongs to
function detectPlatform(url) {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('tiktok.com')) return 'tiktok'
  if (lower.includes('douyin.com')) return 'douyin'
  if (lower.includes('instagram.com')) return 'instagram'
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook'
  return null
}

export default function SearchCard({ url, onUrlChange, onFetch, loading, error }) {
  const inputRef = useRef(null)

  const detectedPlatform = useMemo(() => detectPlatform(url), [url])
  const matchedPlatform = PLATFORMS.find((p) => p.key === detectedPlatform)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) onFetch()
  }

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText && pastedText.trim().startsWith('http')) {
      onUrlChange(pastedText)
    }
  }

  return (
    <div id="search-card" className="w-full card p-4 sm:p-5 mb-8 animate-fade-in">
      {/* Input Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`relative flex-1 rounded-xl border transition-all duration-200 ${
          detectedPlatform
            ? 'border-[var(--color-primary-500)]/40'
            : 'border-[var(--color-border)]'
        } bg-[var(--color-surface)]`}>
          {/* Left Icon */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {matchedPlatform ? (
              <span style={{ color: matchedPlatform.color }} className="block">
                {matchedPlatform.icon}
              </span>
            ) : (
              <svg className="text-[var(--color-text-4)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </div>

          <input
            ref={inputRef}
            id="url-input"
            type="url"
            className="w-full bg-transparent pl-11 pr-10 py-3.5 text-sm sm:text-[15px] text-[var(--color-text)] font-medium placeholder:text-[var(--color-text-4)] outline-none rounded-xl"
            placeholder="Paste a video link from YouTube, TikTok, Instagram..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            autoFocus
          />

          {/* Clear button */}
          {url && (
            <button
              onClick={() => onUrlChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-4)] hover:text-[var(--color-text-2)] p-1 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          id="fetch-btn"
          className="flex items-center justify-center gap-2 px-6 py-3.5 btn-primary text-sm font-semibold"
          onClick={onFetch}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching</span>
            </>
          ) : (
            <>
              {Icon.search}
              <span>Fetch</span>
            </>
          )}
        </button>
      </div>

      {/* Platform Detection */}
      {detectedPlatform && matchedPlatform && (
        <div className="mt-3 animate-fade-in">
          <span
            className="badge text-[11px]"
            style={{
              color: matchedPlatform.color,
              backgroundColor: `${matchedPlatform.color}10`,
              borderColor: `${matchedPlatform.color}20`,
            }}
          >
            {matchedPlatform.icon}
            <span>{matchedPlatform.name} detected</span>
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          id="error-msg"
          className="mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2.5 animate-fade-in"
          style={{ background: 'var(--color-error-dim)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)' }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
