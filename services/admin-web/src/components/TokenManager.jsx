import React, { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'

const isExpired = (t) =>
  t.valid_until && new Date(t.valid_until) < new Date()

export default function TokenManager() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [description, setDescription] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [maxUses, setMaxUses] = useState(1)
  const [unlimited, setUnlimited] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTokens(await adminApi.listTokens())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await adminApi.createToken({
        description: description || null,
        valid_days: unlimited ? null : Number(validDays),
        max_uses: Number(maxUses),
        is_unlimited: unlimited,
      })
      setDescription('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (t) => {
    setError('')
    try {
      await adminApi.setTokenActive(t.id, !t.is_active)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const remove = async (t) => {
    if (!window.confirm(`Permanently delete token ${t.token_key}?`)) return
    setError('')
    try {
      await adminApi.deleteToken(t.id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-[#1a1c23] border border-blue-900/20 rounded-2xl p-6 sticky top-6">
          <h3 className="text-xl font-semibold text-white mb-6">Generate New Token</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</label>
              <input
                type="text"
                placeholder="e.g. VIP Partner access"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-300">Unlimited usage / never expires</span>
            </label>

            {!unlimited && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Valid Days</label>
                  <input
                    type="number" min="1"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Max Uses</label>
                  <input
                    type="number" min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-2"
            >
              {creating ? 'Generating…' : 'Generate Token'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-gray-500 animate-pulse p-8">Loading tokens…</div>
        ) : tokens.length === 0 ? (
          <div className="bg-[#1a1c23] rounded-2xl p-12 text-center text-gray-500 border border-dashed border-gray-800">
            No tokens generated yet.
          </div>
        ) : tokens.map((t) => {
          const expired = isExpired(t)
          const limitReached = t.max_uses > 0 && t.current_uses >= t.max_uses
          return (
            <div key={t.id} className="bg-[#1a1c23] border border-blue-900/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <code className="text-lg font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{t.token_key}</code>
                  {!t.is_active
                    ? <span className="bg-gray-500/10 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Disabled</span>
                    : expired
                      ? <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Expired</span>
                      : limitReached
                        ? <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Limit reached</span>
                        : <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                </div>
                <p className="text-gray-300 text-sm font-medium truncate">{t.description || 'No description'}</p>
                <div className="flex gap-4 mt-2 text-[11px] text-gray-500 flex-wrap">
                  <span>Uses: <b className="text-gray-400">{t.current_uses} / {t.max_uses === 0 ? '∞' : t.max_uses}</b></span>
                  <span>Expires: <b className="text-gray-400">{t.valid_until ? new Date(t.valid_until).toLocaleDateString() : 'Never'}</b></span>
                  <span>Created: <b className="text-gray-400">{new Date(t.created_at).toLocaleDateString()}</b></span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(t)}
                  className={`text-xs font-bold px-3 py-2 rounded-lg transition-all ${t.is_active ? 'text-orange-400 hover:bg-orange-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                >
                  {t.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => remove(t)}
                  className="p-2.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete token"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
