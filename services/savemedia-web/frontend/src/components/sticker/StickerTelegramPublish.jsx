import { useState, useEffect } from 'react'

export default function StickerTelegramPublish({
  stickerData,
  emoji,
  onReset,
  onBack,
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [botInfo, setBotInfo] = useState(null)

  // Advanced custom fields (optional)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customUserId, setCustomUserId] = useState('')
  const [customPackName, setCustomPackName] = useState('')
  const [customTitle, setCustomTitle] = useState('')

  // Fetch bot info for deeplink
  useEffect(() => {
    fetch('/api/telegram/bot-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setBotInfo(data)
      })
      .catch(() => {})
  }, [])

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
      const data = await res.json()

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
      <div className="glass-card p-8 sm:p-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-500/30">
          🎉
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Sticker Pack Ready!
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-md mx-auto mb-6">
          Your sticker is processed and live. Click below to add it straight to your Telegram app.
        </p>

        {result.url && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 btn-pro text-white rounded-xl font-bold text-base shadow-xl"
            >
              <span>📦</span> Add Sticker Pack to Telegram
            </a>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-white/10"
            >
              <span>💾</span> Save WebP File
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-3">
          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            ✨ Create Another Sticker
          </button>
        </div>
      </div>
    )
  }

  // ── Main 1-Click Form ───────────────────────────────────────────
  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>🚀</span> Step 4: Export to Telegram
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            1-Click instant export to Telegram app or web
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={loading}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-white/10"
        >
          ← Change Emoji
        </button>
      </div>

      {/* 1-Click Fast Actions */}
      <div className="space-y-4 mb-6">
        {/* Main Instant Action */}
        <button
          onClick={handleInstantPublish}
          disabled={loading}
          className="w-full py-4 btn-pro rounded-xl font-bold text-base text-white shadow-xl flex items-center justify-center gap-3 cursor-pointer select-none"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Telegram Pack...</span>
            </>
          ) : (
            <>
              <span className="text-xl">🚀</span>
              <span>1-Click Add Sticker to Telegram</span>
            </>
          )}
        </button>

        {/* Secondary Direct Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {botInfo?.deeplink_web && (
            <a
              href={botInfo.deeplink_web}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-lg shrink-0">
                ✈️
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">Open Telegram Bot</div>
                <div className="text-[11px] text-slate-400">@{botInfo.bot_username}</div>
              </div>
            </a>
          )}

          <button
            onClick={handleDownload}
            className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-left transition-all flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">
              💾
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white">Download 512×512 WebP</div>
              <div className="text-[11px] text-slate-400">Save directly to phone/PC</div>
            </div>
          </button>
        </div>
      </div>

      {/* Selected Emoji badge */}
      <div className="flex items-center gap-2.5 p-3 bg-slate-950/60 rounded-xl border border-white/5 mb-6">
        <span className="text-xl">{emoji}</span>
        <span className="text-xs text-slate-300 font-medium">
          Sticker reaction emoji: <strong className="text-white">{emoji}</strong>
        </span>
      </div>

      {/* Advanced Custom Settings (Optional) */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer select-none"
        >
          <span>{showAdvanced ? '▾' : '▸'}</span>
          <span>Advanced: Custom Pack Name &amp; User ID (Optional)</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-3 p-4 bg-slate-950/70 rounded-xl border border-white/5 animate-fade-in">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Telegram User ID (Optional)
              </label>
              <input
                type="text"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                placeholder="Leave blank for automatic server bot owner"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Pack Short Name (Optional)
              </label>
              <input
                type="text"
                value={customPackName}
                onChange={(e) => setCustomPackName(e.target.value)}
                placeholder="e.g. my_stickers"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Display Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My Cool Stickers"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}
    </div>
  )
}
