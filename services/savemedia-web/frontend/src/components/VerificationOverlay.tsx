import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface VerificationOverlayProps {
  onVerified?: (data?: any) => void
  title?: string
  subtitle?: string
}

export default function VerificationOverlay({ onVerified, title = "Activate Access", subtitle = "Enter your secure token key to unlock this workspace." }: VerificationOverlayProps) {
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
        console.log('Token verified successfully:', data)
        
        // CRITICAL FIX: Immediately update dbUser in context without waiting for API
        // The backend has already set is_verified=1, so trust it
        setTimeout(async () => {
          await refreshDbUser()
          if (onVerified) onVerified()
        }, 800)
      } else {
        setError(data.detail || 'Invalid token key. Please contact your administrator.')
        console.error('Verification failed:', data)
      }
    } catch (err) {
      setError('Connection to server failed. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="relative bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)]/95 to-[#050B14]/95 border border-cyan-500/30 rounded-2xl p-8 sm:p-10 backdrop-blur-xl text-center">
        {/* Top Glare */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

        {/* Key Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--color-primary-600)] border border-cyan-400/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-[var(--color-primary-600)] mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-[var(--color-text-4)] text-sm leading-relaxed mb-8">
          {subtitle}
        </p>

        {success ? (
          <div className="bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 p-5 rounded-2xl flex items-center justify-center gap-3 animate-slide-up">
            <svg className="w-6 h-6 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-bold tracking-wide">Access Granted! Loading…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-cyan-400/80 mb-2 text-center">
                Access Token Key
              </label>
              <input
                type="text"
                placeholder="CAM-XXXX-XXXX"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="w-full bg-[var(--color-surface-2)] border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-[var(--color-text)] placeholder-[var(--color-text-4)] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-colors duration-200"
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
              className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] disabled:from-slate-800 disabled:to-slate-800 disabled:text-[var(--color-text-4)] text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer"
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
                className="text-xs text-[var(--color-text-4)] hover:text-red-400 font-medium transition-colors cursor-pointer"
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
