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
    <div id="search-card" className="w-full max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '80ms' }}>
      {/* Input Row */}
      <div className={`relative flex items-center p-2 rounded-2xl bg-[var(--color-surface-1)] border shadow-xl transition-all duration-300 ${
        detectedPlatform
          ? 'border-[var(--color-primary-400)] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
          : 'border-[var(--color-border-2)] hover:border-[var(--color-primary-400)]/50 focus-within:border-[var(--color-primary-400)] focus-within:shadow-[0_0_25px_rgba(56,189,248,0.2)]'
      }`}>
        <div className="flex-1 flex items-center relative">
          {/* Left Icon */}
          <div className="pl-3.5 pr-2.5 text-[var(--color-text-4)]">
            {matchedPlatform ? (
              <span style={{ color: matchedPlatform.color }} className="block">
                {matchedPlatform.icon}
              </span>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </div>

          <input
            ref={inputRef}
            id="url-input"
            type="url"
            className="w-full bg-transparent py-3.5 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-4)] outline-none"
            placeholder="Paste a video link..."
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
              className="mr-1.5 text-[var(--color-text-4)] hover:text-[var(--color-text-2)] p-1.5 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          id="fetch-btn"
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg btn-primary text-[14px] font-medium shrink-0"
          onClick={onFetch}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="hidden sm:inline">Fetching</span>
            </>
          ) : (
            <>
              {Icon.search}
              <span className="hidden sm:inline">Extract</span>
            </>
          )}
        </button>
      </div>

      {/* Platform Detection */}
      {detectedPlatform && matchedPlatform && (
        <div className="mt-3 flex justify-center animate-fade-in">
          <span
            className="badge px-2.5 py-1 text-[11px]"
            style={{
              color: matchedPlatform.color,
              backgroundColor: `${matchedPlatform.color}0a`,
              borderColor: `${matchedPlatform.color}20`,
            }}
          >
            {matchedPlatform.icon}
            <span className="font-medium ml-0.5">{matchedPlatform.name} detected</span>
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          id="error-msg"
          className="mt-4 max-w-2xl mx-auto px-4 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2.5 animate-fade-in"
          style={{ background: 'var(--color-error-dim)', color: 'var(--color-error)', border: '1px solid rgba(248, 113, 113, 0.15)' }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
