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
  const [validDays, setValidDays] = useState('30')
  const [maxUses, setMaxUses] = useState('1')
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
      {/* Create Token Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-b from-[#0B1221]/90 to-[#050B14]/90 border border-cyan-900/40 rounded-3xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.05)] backdrop-blur-xl sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl shadow-inner">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
              Generate Token
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-cyan-500/70 uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. VIP Partner access"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#03060D] border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/50 transition-all duration-300 shadow-inner text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-1 pb-1">
              <input
                type="checkbox"
                id="unlimited-checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="w-4 h-4 rounded border-cyan-900/50 bg-[#03060D] text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <label htmlFor="unlimited-checkbox" className="text-xs text-slate-400 cursor-pointer select-none">
                Unlimited usage / never expires
              </label>
            </div>

            {!unlimited && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-cyan-500/70 uppercase tracking-wider mb-2">
                    Valid Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full bg-[#03060D] border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/50 transition-all duration-300 shadow-inner text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-cyan-500/70 uppercase tracking-wider mb-2">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full bg-[#03060D] border border-cyan-900/50 rounded-xl px-4 py-3 text-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/50 transition-all duration-300 shadow-inner text-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating…</span>
                </>
              ) : 'Generate Token'}
            </button>
          </form>
        </div>
      </div>

      {/* Token List */}
      <div className="lg:col-span-2 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-5 py-4 animate-fade-in flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-cyan-500/50">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-sm font-medium uppercase tracking-widest animate-pulse">Loading Tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="bg-gradient-to-b from-[#0B1221]/50 to-[#050B14]/50 border border-cyan-900/20 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium">No tokens generated yet.</p>
          </div>
        ) : tokens.map((t, i) => {
          const expired = isExpired(t)
          const limitReached = t.max_uses > 0 && t.current_uses >= t.max_uses
          return (
            <div
              key={t.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="bg-gradient-to-r from-[#0B1221]/90 to-[#050B14]/90 border border-cyan-900/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-slide-up hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.1)] transition-all duration-300 backdrop-blur-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <code className="text-base font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3.5 py-1 rounded-lg tracking-wider shadow-inner">
                    {t.token_key}
                  </code>
                  {!t.is_active ? (
                    <span className="bg-slate-800/80 text-slate-400 border border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Disabled
                    </span>
                  ) : expired ? (
                    <span className="bg-red-950/50 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Expired
                    </span>
                  ) : limitReached ? (
                    <span className="bg-orange-950/50 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Limit Reached
                    </span>
                  ) : (
                    <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-slate-200 text-sm font-medium mb-4">
                  {t.description || <span className="text-slate-600 italic">No description provided</span>}
                </p>

                <div className="flex gap-5 text-xs text-slate-400 flex-wrap font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-cyan-300 font-bold">{t.current_uses}</span> / {t.max_uses === 0 ? '∞' : t.max_uses} uses
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.valid_until ? new Date(t.valid_until).toLocaleDateString() : 'Never expires'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created: {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-cyan-900/40 pt-4 sm:pt-0 sm:pl-5">
                <button
                  onClick={() => toggleActive(t)}
                  className={`w-full text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 border cursor-pointer ${
                    t.is_active
                      ? 'text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                      : 'text-cyan-400 border-cyan-800 hover:bg-cyan-950/50 hover:border-cyan-500/60 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                  }`}
                >
                  {t.is_active ? 'Revoke Access' : 'Reactivate'}
                </button>
                <button
                  onClick={() => remove(t)}
                  className="w-full text-xs font-bold px-4 py-2 rounded-xl text-red-400/70 border border-transparent hover:border-red-900/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
