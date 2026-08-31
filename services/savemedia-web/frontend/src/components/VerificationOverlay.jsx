import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function VerificationOverlay({ onVerified, title = "Activate Access", subtitle = "Enter your secure token key to unlock this workspace." }) {
  const { session, dbUser, refreshDbUser, logout } = useAuth()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    setError('')

    try {
      const resp = await fetch('/api/ai/admin/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ token_key: token.trim() })
      })

      const data = await resp.json()

      if (resp.ok) {
        setSuccess(true)
        setTimeout(() => {
          refreshDbUser()
          if (onVerified) onVerified()
        }, 1200)
      } else {
        setError(data.detail || 'Invalid token key. Please contact your administrator.')
      }
    } catch (err) {
      setError('Connection to server failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="relative bg-gradient-to-b from-[#0B1221]/95 to-[#050B14]/95 border border-cyan-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl text-center">
        {/* Top Glare */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

        {/* Key Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)]">
          <svg className="w-8 h-8 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {subtitle}
        </p>

        {success ? (
          <div className="bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 p-5 rounded-2xl flex items-center justify-center gap-3 animate-slide-up shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-bold tracking-wide">Access Granted! Unlocking…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400/80 uppercase tracking-widest mb-2 text-center">
                Access Token Key
              </label>
              <input
                type="text"
                placeholder="CAM-XXXX-XXXX"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="w-full bg-[#03060D] border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-cyan-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono tracking-[0.15em] text-center text-base font-bold shadow-inner"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-xl p-3 text-center animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Token…</span>
                </>
              ) : (
                'Activate Access'
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-slate-500 hover:text-red-400 font-medium transition-colors cursor-pointer"
              >
                Sign out ({session?.user?.email})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
