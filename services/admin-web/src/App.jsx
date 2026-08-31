import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import TokenManager from './components/TokenManager'
import UserManager from './components/UserManager'
import WorkflowManager from './components/WorkflowManager'
import PdfTools from './components/PdfTools'

function Centered({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-[#03060D]">
      {children}
    </div>
  )
}

export default function App() {
  const { session, profile, profileError, loading, isAdmin, loginWithGoogle, logout } = useAuth()
  const [tab, setTab] = useState('tokens')

  if (loading) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-cyan-500/70 font-medium tracking-wider uppercase text-xs animate-pulse">Loading admin console…</p>
        </div>
      </Centered>
    )
  }

  if (!session) {
    return <Login onLogin={loginWithGoogle} />
  }

  if (profileError) {
    return (
      <Centered>
        <div className="max-w-md bg-[#0B1221] border border-yellow-900/40 rounded-3xl p-8 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
          <h2 className="text-xl font-bold text-white mb-2">Backend Unreachable</h2>
          <p className="text-slate-400 text-sm">
            Could not verify your account with the API server.
          </p>
          <p className="text-yellow-400/80 mt-3 text-xs font-mono break-all bg-black/40 p-3 rounded-xl border border-yellow-900/30">
            {profileError}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </Centered>
    )
  }

  if (!isAdmin) {
    return (
      <Centered>
        <div className="max-w-md bg-[#0B1221] border border-red-900/40 rounded-3xl p-8 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm">
            The account <span className="font-bold text-slate-200">{profile?.email || session.user?.email}</span> is not an administrator.
            Ask an existing admin to grant you access, then reload.
          </p>
          <button
            onClick={logout}
            className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </Centered>
    )
  }

  return (
    <div className="min-h-screen bg-[#03060D] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/15 via-[#03060D] to-[#03060D] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="border-b border-cyan-900/30 bg-[#050B14]/80 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/40 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 text-lg leading-tight tracking-wide">
                CamTech Admin
              </div>
              <div className="text-xs font-medium text-cyan-400/70 truncate max-w-[200px] sm:max-w-xs">
                {profile?.email}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-[#0B1221]/90 rounded-2xl p-1 border border-cyan-900/50 shadow-inner">
            <button
              onClick={() => setTab('tokens')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                tab === 'tokens'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              Access Tokens
            </button>
            <button
              onClick={() => setTab('users')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                tab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setTab('automations')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                tab === 'automations'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_15px_rgba(251,146,60,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              Automations
            </button>
            <button
              onClick={() => setTab('pdf-tools')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                tab === 'pdf-tools'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_15px_rgba(248,113,113,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              PDF Tools
            </button>
          </nav>

          {/* Sign out */}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 cursor-pointer"
          >
            <span>Sign out</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

        </div>
      </header>

      {/* Main Body */}
      <main className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10 z-10">
        {tab === 'tokens' ? (
          <TokenManager />
        ) : tab === 'users' ? (
          <UserManager />
        ) : tab === 'pdf-tools' ? (
          <PdfTools />
        ) : (
          <WorkflowManager />
        )}
      </main>
    </div>
  )
}
