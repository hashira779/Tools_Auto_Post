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
      className="w-full max-w-[700px] card-playful p-6 sm:p-8 
                 transition-all duration-300 mb-8 animate-pop-in"
    >
      {/* Input Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <input
            ref={inputRef}
            id="url-input"
            type="url"
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl
                       pl-14 pr-5 py-4 text-lg text-gray-800 font-semibold
                       placeholder:text-gray-400 placeholder:font-medium
                       focus:border-[var(--color-accent-blue)] focus:bg-white
                       outline-none transition-all duration-200"
            placeholder="Paste your video link here!"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            autoFocus
          />
        </div>

        <button
          id="fetch-btn"
          className="flex items-center justify-center gap-3 px-10 py-4
                     btn-playful rounded-2xl text-lg font-bold uppercase tracking-wider
                     outline-none"
          onClick={onFetch}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Fetching
            </>
          ) : (
            <>
              {Icon.search}
              Fetch
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="error-msg"
          className="mt-4 px-5 py-4 bg-red-50 border-2 border-red-200
                     rounded-2xl text-red-600 text-base font-bold flex items-center gap-3
                     animate-pop-in"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
