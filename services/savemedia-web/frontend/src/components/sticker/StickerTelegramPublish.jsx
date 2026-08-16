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
      <div className="card p-6 sm:p-10 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 border border-[var(--color-border)]" style={{ background: 'var(--color-success-dim)' }}>
          ✓
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-2">
          Sticker Pack Ready
        </h2>

        <p className="text-sm text-[var(--color-text-3)] max-w-md mx-auto mb-6">
          Your sticker is live. Click below to add it to your Telegram app.
        </p>

        {result.url && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={result.deeplink_app || result.url}
              className="w-full sm:w-auto px-6 py-3.5 btn-primary text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              Open in Telegram
            </a>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto btn-secondary px-6 py-3.5 text-sm font-medium flex items-center justify-center gap-2"
            >
              Save WebP File
            </button>
          </div>
        )}

        <div className="pt-5 border-t border-[var(--color-border)]">
          <button
            onClick={onReset}
            className="btn-ghost text-sm px-4 py-2"
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
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-text)]">
            Step 4: Export to Telegram
          </h2>
          <p className="text-sm text-[var(--color-text-3)] mt-0.5">
            1-click export to Telegram
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={loading}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          ← Back
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-3 mb-5">
        <button
          onClick={handleInstantPublish}
          disabled={loading}
          className="w-full py-3.5 btn-primary font-semibold text-sm flex items-center justify-center gap-2.5"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Telegram Pack...</span>
            </>
          ) : (
            <span>Add Sticker to Telegram</span>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="w-full py-3 btn-secondary text-sm font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download 512×512 WebP
        </button>
      </div>

      {/* Emoji badge */}
      <div className="flex items-center gap-2.5 p-3 card-elevated rounded-xl mb-5">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm text-[var(--color-text-2)]">
          Reaction emoji: <strong className="text-[var(--color-text)]">{emoji}</strong>
        </span>
      </div>

      {/* Advanced */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-[var(--color-text-3)] hover:text-[var(--color-text-2)] flex items-center gap-1.5 cursor-pointer select-none"
        >
          <span>{showAdvanced ? '▾' : '▸'}</span>
          <span>Advanced: Custom Pack Name & User ID</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-3 p-4 card-elevated rounded-xl animate-fade-in">
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">
                Telegram User ID (Optional)
              </label>
              <input
                type="text"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                placeholder="Leave blank for automatic"
                className="input-field w-full px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">
                Pack Short Name (Optional)
              </label>
              <input
                type="text"
                value={customPackName}
                onChange={(e) => setCustomPackName(e.target.value)}
                placeholder="e.g. my_stickers"
                className="input-field w-full px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">
                Display Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My Cool Stickers"
                className="input-field w-full px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'var(--color-error-dim)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
