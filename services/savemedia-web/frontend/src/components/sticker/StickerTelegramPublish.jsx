import { useState } from 'react'

export default function StickerTelegramPublish({
  stickerData,
  emoji,
  onReset,
  onBack,
}) {
  const [mode, setMode] = useState('create') // 'create' | 'add'
  const [userId, setUserId] = useState('')
  const [packName, setPackName] = useState('')
  const [packTitle, setPackTitle] = useState('')
  const [existingPack, setExistingPack] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!userId || !packName || !packTitle) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId.trim())
      formData.append('short_name', packName.trim())
      formData.append('title', packTitle.trim())
      formData.append('sticker_b64', stickerData.data_b64)
      formData.append('emoji', emoji)

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

  const handleAddToExisting = async () => {
    if (!userId || !existingPack) {
      setError('Please fill in your User ID and Pack Name.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId.trim())
      formData.append('pack_name', existingPack.trim())
      formData.append('sticker_b64', stickerData.data_b64)
      formData.append('emoji', emoji)

      const res = await fetch('/api/telegram/add-sticker', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to add sticker to existing pack.')
      }

      setResult({
        ...data,
        name: existingPack.trim(),
        url: `https://t.me/addstickers/${existingPack.trim()}`,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success State ───────────────────────────────────────────────
  if (result) {
    return (
      <div className="card-playful p-8 sm:p-12 text-center animate-pop-in">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-emerald-200 shadow-sm">
          🎉
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Published to Telegram!
        </h2>

        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-md mx-auto mb-6">
          Your new sticker is live in Telegram! Click the button below to add the pack to your Telegram app.
        </p>

        {result.url && (
          <div className="mb-6">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              <span>📦</span> Add Sticker Pack to Telegram
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-4">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
          >
            ✨ Create Another Sticker
          </button>
        </div>
      </div>
    )
  }

  // ── Form State ──────────────────────────────────────────────────
  return (
    <div className="card-playful p-6 sm:p-8 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>🚀</span> Step 4: Publish to Telegram
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Connect your Telegram ID to instantly publish your sticker pack
          </p>
        </div>
        <button
          onClick={onBack}
          disabled={loading}
          className="text-xs sm:text-sm font-extrabold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          ← Change Emoji
        </button>
      </div>

      {/* Mode Switcher: Create New vs Add to Existing */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => { setMode('create'); setError(null); }}
          className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 cursor-pointer ${
            mode === 'create'
              ? 'border-purple-600 bg-purple-50/70 shadow-sm'
              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
          }`}
        >
          <div className="text-2xl mb-1">🆕</div>
          <div className="font-extrabold text-sm text-gray-900">Create New Pack</div>
          <div className="text-xs text-gray-500 font-medium">Start a brand new sticker set</div>
        </button>

        <button
          onClick={() => { setMode('add'); setError(null); }}
          className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 cursor-pointer ${
            mode === 'add'
              ? 'border-purple-600 bg-purple-50/70 shadow-sm'
              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
          }`}
        >
          <div className="text-2xl mb-1">➕</div>
          <div className="font-extrabold text-sm text-gray-900">Add to Existing</div>
          <div className="text-xs text-gray-500 font-medium">Add sticker to an existing pack</div>
        </button>
      </div>

      {/* How to get Telegram User ID Help Box */}
      <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 mb-6 text-xs sm:text-sm">
        <div className="font-black text-blue-900 mb-1 flex items-center gap-1.5">
          <span>💡</span> How to get your Telegram User ID:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-blue-800/80 font-medium text-xs">
          <li>Open Telegram and search for <strong>@userinfobot</strong></li>
          <li>Send any message to receive your numerical <strong>User ID</strong> (e.g. 123456789)</li>
          <li>Make sure you have pressed <strong>/start</strong> on your sticker bot at least once</li>
        </ol>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
            Your Telegram User ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. 123456789"
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white outline-none transition-all"
          />
        </div>

        {mode === 'create' ? (
          <>
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                Pack Short Name <span className="text-rose-500">*</span>{' '}
                <span className="text-[11px] font-normal text-gray-400 lowercase">(letters, numbers, underscore only)</span>
              </label>
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. funny_memes"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                Pack Display Title <span className="text-rose-500">*</span>{' '}
                <span className="text-[11px] font-normal text-gray-400 lowercase">(visible to users in Telegram)</span>
              </label>
              <input
                type="text"
                value={packTitle}
                onChange={(e) => setPackTitle(e.target.value.slice(0, 64))}
                placeholder="e.g. My Funny Memes 🎨"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white outline-none transition-all"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              Full Pack Name <span className="text-rose-500">*</span>{' '}
              <span className="text-[11px] font-normal text-gray-400 lowercase">(e.g. funny_memes_123_by_BotName)</span>
            </label>
            <input
              type="text"
              value={existingPack}
              onChange={(e) => setExistingPack(e.target.value)}
              placeholder="e.g. funny_memes_123456_by_CamTechBot"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white outline-none transition-all"
            />
          </div>
        )}

        {/* Selected Emoji badge */}
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-2xl border border-purple-100">
          <span className="text-2xl">{emoji}</span>
          <span className="text-xs font-bold text-purple-900">
            Selected sticker emoji: <strong>{emoji}</strong>
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={mode === 'create' ? handleCreate : handleAddToExisting}
          disabled={loading}
          className={`w-full py-4.5 rounded-2xl font-black text-base uppercase tracking-wider text-white shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 ${
            loading
              ? 'bg-purple-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 hover:from-purple-700 hover:to-rose-600 shadow-purple-500/25 hover:scale-[1.01]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Publishing to Telegram...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>{mode === 'create' ? 'Create Sticker Pack' : 'Add Sticker to Pack'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
