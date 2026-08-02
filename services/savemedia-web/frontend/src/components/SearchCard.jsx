import { useRef } from 'react'
import Icon from '../constants/icons'

export default function SearchCard({ url, onUrlChange, onFetch, loading, error }) {
  const inputRef = useRef(null)

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
    <div
      id="search-card"
      className="w-full max-w-[760px] glass-card p-4 sm:p-6 mb-8 animate-fade-in"
    >
      {/* Input Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <input
            ref={inputRef}
            id="url-input"
            type="url"
            className="w-full bg-slate-950/70 border border-white/10 rounded-xl
                       pl-12 pr-4 py-3.5 text-sm sm:text-base text-white font-medium
                       placeholder:text-slate-500
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                       outline-none transition-all duration-200"
            placeholder="Paste link from YouTube, TikTok, Instagram..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            autoFocus
          />
          {url && (
            <button
              onClick={() => onUrlChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          id="fetch-btn"
          className="flex items-center justify-center gap-2 px-7 py-3.5
                     btn-pro rounded-xl text-sm font-bold uppercase tracking-wider
                     cursor-pointer select-none"
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

      {/* Error Message */}
      {error && (
        <div
          id="error-msg"
          className="mt-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20
                     rounded-xl text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2.5
                     animate-fade-in"
        >
          <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
