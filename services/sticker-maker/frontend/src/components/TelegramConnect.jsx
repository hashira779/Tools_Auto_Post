import { useState } from 'react'

export default function TelegramConnect({ stickerData, emoji, onReset, onBack }) {
  const [mode, setMode] = useState('choose') // choose | create | add
  const [userId, setUserId] = useState('')
  const [packName, setPackName] = useState('')
  const [packTitle, setPackTitle] = useState('')
  const [existingPack, setExistingPack] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!userId || !packName || !packTitle) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('short_name', packName)
      formData.append('title', packTitle)
      formData.append('sticker_b64', stickerData.data_b64)
      formData.append('emoji', emoji)

      const res = await fetch('/api/telegram/create-pack', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || 'Failed to create pack')

      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToExisting = async () => {
    if (!userId || !existingPack) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('pack_name', existingPack)
      formData.append('sticker_b64', stickerData.data_b64)
      formData.append('emoji', emoji)

      const res = await fetch('/api/telegram/add-sticker', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || 'Failed to add sticker')

      setResult({ ...data, name: existingPack, url: `https://t.me/addstickers/${existingPack}` })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success State ──
  if (result) {
    return (
      <div className="glass rounded-2xl p-6 sm:p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Published!</h2>
        <p className="text-[--color-text-secondary] mb-6">
          Your sticker has been added to Telegram!
        </p>

        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow inline-block px-8 py-3 rounded-xl font-bold text-lg mb-4"
          >
            📦 Open Sticker Pack
          </a>
        )}

        <div className="mt-4">
          <button
            onClick={onReset}
            className="text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors font-semibold"
          >
            ✨ Create Another Sticker
          </button>
        </div>
      </div>
    )
  }

  // ── Choose Mode ──
  if (mode === 'choose') {
    return (
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              📱 Publish to Telegram
            </h2>
            <p className="text-sm text-[--color-text-secondary]">
              Connect with your Telegram account to create a sticker pack
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* How to get User ID info */}
        <div className="mb-6 p-4 rounded-xl bg-[--color-accent-blue]/10 border border-[--color-accent-blue]/20">
          <p className="text-sm text-[--color-accent-blue] font-semibold mb-1">💡 How to get your Telegram User ID</p>
          <p className="text-xs text-[--color-text-secondary]">
            1. Open Telegram and search for <strong>@userinfobot</strong><br />
            2. Send it any message<br />
            3. It will reply with your User ID (a number)<br />
            4. Also, you <strong>must start a chat</strong> with our sticker bot first
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('create')}
            className="style-card rounded-xl p-6 text-left"
          >
            <div className="text-3xl mb-2">🆕</div>
            <div className="font-bold text-base">Create New Pack</div>
            <div className="text-xs text-[--color-text-muted] mt-1">
              Start a brand new sticker pack
            </div>
          </button>

          <button
            onClick={() => setMode('add')}
            className="style-card rounded-xl p-6 text-left"
          >
            <div className="text-3xl mb-2">➕</div>
            <div className="font-bold text-base">Add to Existing</div>
            <div className="text-xs text-[--color-text-muted] mt-1">
              Add sticker to a pack you already created
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Create New Pack Form ──
  if (mode === 'create') {
    return (
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🆕 Create New Pack</h2>
          <button
            onClick={() => { setMode('choose'); setError(null) }}
            className="text-sm text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-[--color-text-secondary]">
              Your Telegram User ID *
            </label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full px-4 py-3 rounded-xl bg-[--color-bg-secondary] border border-[--color-border] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:border-[--color-accent-purple] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-[--color-text-secondary]">
              Pack Name * <span className="text-xs font-normal text-[--color-text-muted]">(English letters, digits, underscores only)</span>
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="e.g. my_cool_stickers"
              className="w-full px-4 py-3 rounded-xl bg-[--color-bg-secondary] border border-[--color-border] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:border-[--color-accent-purple] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-[--color-text-secondary]">
              Pack Title * <span className="text-xs font-normal text-[--color-text-muted]">(Display name, 1-64 characters)</span>
            </label>
            <input
              type="text"
              value={packTitle}
              onChange={(e) => setPackTitle(e.target.value.slice(0, 64))}
              placeholder="e.g. My Cool Stickers 🎨"
              className="w-full px-4 py-3 rounded-xl bg-[--color-bg-secondary] border border-[--color-border] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:border-[--color-accent-purple] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-[--color-text-secondary]">
            <span className="text-xl">{emoji}</span>
            <span>Emoji: {emoji}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !userId || !packName || !packTitle}
            className="btn-glow w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Creating pack...
              </>
            ) : (
              '🚀 Create Sticker Pack'
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── Add to Existing Pack Form ──
  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">➕ Add to Existing Pack</h2>
        <button
          onClick={() => { setMode('choose'); setError(null) }}
          className="text-sm text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-[--color-text-secondary]">
            Your Telegram User ID *
          </label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. 123456789"
            className="w-full px-4 py-3 rounded-xl bg-[--color-bg-secondary] border border-[--color-border] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:border-[--color-accent-purple] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[--color-text-secondary]">
            Existing Pack Name *
            <span className="text-xs font-normal text-[--color-text-muted] ml-1">(full name, e.g. my_stickers_123_by_BotName)</span>
          </label>
          <input
            type="text"
            value={existingPack}
            onChange={(e) => setExistingPack(e.target.value)}
            placeholder="e.g. my_stickers_123_by_YourBot"
            className="w-full px-4 py-3 rounded-xl bg-[--color-bg-secondary] border border-[--color-border] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:border-[--color-accent-purple] focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleAddToExisting}
          disabled={loading || !userId || !existingPack}
          className="btn-glow w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Adding sticker...
            </>
          ) : (
            '➕ Add Sticker to Pack'
          )}
        </button>
      </div>
    </div>
  )
}
