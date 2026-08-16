import { useState } from 'react'

export default function StickerTelegramPublish({ stickerData, emoji, onReset, onBack }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Advanced custom fields (optional)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customUserId, setCustomUserId] = useState('')
  const [customPackName, setCustomPackName] = useState('')
  const [customTitle, setCustomTitle] = useState('')

  const handleInstantPublish = async () => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('sticker_b64', stickerData.data_b64)
      formData.append('emoji', emoji)

      if (customUserId.trim()) {
        formData.append('user_id', customUserId.trim())
      }
      if (customPackName.trim()) {
        formData.append('short_name', customPackName.trim())
      }
      if (customTitle.trim()) {
        formData.append('title', customTitle.trim())
      }

      const res = await fetch('/api/telegram/create-pack', {
        method: 'POST',
        body: formData,
      })

      const text = await res.text()
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Server returned error (${res.status}). Please try again.`)
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create Telegram sticker pack.')
      }

      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:image/webp;base64,${stickerData.data_b64}`
    link.download = `sticker_${Date.now()}.webp`
    link.click()
  }

  // ── Success State ───────────────────────────────────────────────
  if (result) {
    return (
      <div className="card p-8 sm:p-10 text-center animate-fade-in flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[var(--color-success-dim)] border border-[rgba(52,211,153,0.15)]">
          <svg className="w-8 h-8 text-[var(--color-success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Sticker Pack Ready
        </h2>

        <p className="text-[14px] text-[var(--color-text-3)] max-w-sm mx-auto mb-8 leading-relaxed">
          Your sticker is live. Click below to add it to your Telegram app.
        </p>

        {result.url && (
          <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
            <a
              href={result.deeplink_app || result.url}
              className="w-full py-3.5 btn-primary text-[14px] font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18.6 7.171A2 2 0 0 0 1.51 13.5l5.228 2.052 3.197 9.406a2.128 2.128 0 0 0 3.999.043l3.228-9.451 5.39-2.083a2.001 2.001 0 0 0 .141-3.693l-13.882-6.02" />
              </svg>
              Open in Telegram
            </a>
            <button
              onClick={handleDownload}
              className="w-full py-3 btn-secondary text-[14px] font-medium flex items-center justify-center gap-2"
            >
              Save WebP File
            </button>
          </div>
        )}

        <div className="w-full pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={onReset}
            className="btn-ghost text-[13px] px-4 py-2"
          >
            Create Another Sticker
          </button>
        </div>
      </div>
    )
  }

  // ── Main Form ───────────────────────────────────────────
  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
            Step 4: Export to Telegram
          </h2>
          <p className="text-[12px] text-[var(--color-text-3)] mt-0.5">
            1-click export to Telegram
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={loading}
          className="btn-ghost text-[11px] px-3 py-1.5"
        >
          ← Back
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleInstantPublish}
          disabled={loading}
          className="w-full py-3.5 btn-primary font-medium text-[14px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Telegram Pack...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18.6 7.171A2 2 0 0 0 1.51 13.5l5.228 2.052 3.197 9.406a2.128 2.128 0 0 0 3.999.043l3.228-9.451 5.39-2.083a2.001 2.001 0 0 0 .141-3.693l-13.882-6.02" />
              </svg>
              <span>Add Sticker to Telegram</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="w-full py-3 btn-secondary text-[13px] font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download 512×512 WebP
        </button>
      </div>

      {/* Emoji badge */}
      <div className="flex items-center gap-3 p-3.5 card-elevated rounded-xl mb-6 border border-[var(--color-border-2)]">
        <span className="text-2xl drop-shadow-sm">{emoji}</span>
        <span className="text-[13px] text-[var(--color-text-2)]">
          Reaction emoji: <strong className="text-[var(--color-text)]">{emoji}</strong>
        </span>
      </div>

      {/* Advanced */}
      <div className="pt-5 border-t border-[var(--color-border)]">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] font-semibold text-[var(--color-text-4)] hover:text-[var(--color-text-2)] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer select-none transition-colors"
        >
          <span>Advanced Settings</span>
          <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 card-elevated rounded-xl animate-slide-up border border-[var(--color-border-2)]">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5">
                Telegram User ID (Optional)
              </label>
              <input
                type="text"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                placeholder="Leave blank for automatic"
                className="input-field w-full px-3 py-2 text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5">
                Pack Short Name (Optional)
              </label>
              <input
                type="text"
                value={customPackName}
                onChange={(e) => setCustomPackName(e.target.value)}
                placeholder="e.g. my_stickers"
                className="input-field w-full px-3 py-2 text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5">
                Display Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My Cool Stickers"
                className="input-field w-full px-3 py-2 text-[13px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ background: 'var(--color-error-dim)', color: 'var(--color-error)', border: '1px solid rgba(248, 113, 113, 0.15)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
