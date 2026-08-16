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
    <div id="search-card" className="w-full max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
      {/* Input Row */}
      <div className={`relative flex items-center p-2 rounded-2xl bg-[var(--color-surface-1)] border transition-all duration-300 shadow-xl ${
        detectedPlatform
          ? 'border-[var(--color-primary-500)]/30 shadow-[0_8px_32px_-12px_rgba(134,59,255,0.25)]'
          : 'border-[var(--color-border-2)] hover:border-[var(--color-border-3)]'
      }`}>
        <div className="flex-1 flex items-center relative">
          {/* Left Icon */}
          <div className="pl-4 pr-3 text-[var(--color-text-4)] transition-colors">
            {matchedPlatform ? (
              <span style={{ color: matchedPlatform.color }} className="block scale-110">
                {matchedPlatform.icon}
              </span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </div>

          <input
            ref={inputRef}
            id="url-input"
            type="url"
            className="w-full bg-transparent py-4 text-[16px] text-[var(--color-text)] font-medium placeholder:text-[var(--color-text-4)] outline-none"
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
              className="mr-2 text-[var(--color-text-4)] hover:text-[var(--color-text-2)] p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          id="fetch-btn"
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-primary text-[15px] font-semibold shrink-0 ml-2"
          onClick={onFetch}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching</span>
            </>
          ) : (
            <>
              {Icon.search}
              <span>Extract Media</span>
            </>
          )}
        </button>
      </div>

      {/* Platform Detection */}
      {detectedPlatform && matchedPlatform && (
        <div className="mt-4 flex justify-center animate-slide-up" style={{ animationDelay: '50ms' }}>
          <span
            className="badge px-3 py-1.5 shadow-sm"
            style={{
              color: matchedPlatform.color,
              backgroundColor: `${matchedPlatform.color}15`,
              borderColor: `${matchedPlatform.color}30`,
            }}
          >
            {matchedPlatform.icon}
            <span className="font-semibold tracking-wide ml-1">{matchedPlatform.name} detected</span>
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          id="error-msg"
          className="mt-4 max-w-2xl mx-auto px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-3 animate-pop-in"
          style={{ background: 'var(--color-error-dim)', color: 'var(--color-error)', border: '1px solid rgba(248, 113, 113, 0.2)' }}
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
