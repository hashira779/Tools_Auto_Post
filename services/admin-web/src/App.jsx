import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import TokenManager from './components/TokenManager'
import UserManager from './components/UserManager'

function Centered({ children }) {
  return <div className="min-h-screen flex items-center justify-center px-4 text-center">{children}</div>
}

export default function App() {
  const { session, profile, profileError, loading, isAdmin, loginWithGoogle, logout } = useAuth()
  const [tab, setTab] = useState('tokens')

  if (loading) {
    return <Centered><div className="text-gray-500 animate-pulse">Loading admin console…</div></Centered>
  }

  if (!session) {
    return <Login onLogin={loginWithGoogle} />
  }

  // The profile request itself failed (backend down / stale deploy / auth error) —
  // show the real error instead of a misleading "Access Denied".
  if (profileError) {
    return (
      <Centered>
        <div className="max-w-md bg-[#1a1c23] border border-yellow-900/30 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white">Backend Unreachable</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Could not verify your account with the API server.
          </p>
          <p className="text-yellow-400/80 mt-3 text-xs font-mono break-all">{profileError}</p>
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
            <button
              onClick={logout}
              className="text-sm font-semibold text-gray-400 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </Centered>
    )
  }

  // Signed in with Google but not an administrator.
  if (!isAdmin) {
    return (
      <Centered>
        <div className="max-w-md bg-[#1a1c23] border border-red-900/30 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400 mt-2 text-sm">
            The account <b className="text-gray-200">{profile?.email || session.user?.email}</b> is not an administrator.
            Ask an existing admin to grant you access, then reload.
          </p>
          <button
            onClick={logout}
            className="mt-6 text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Sign out
          </button>
        </div>
      </Centered>
    )
  }

  return (
    <div className="min-h-screen bg-[#03060D] text-slate-300 font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#03060D] to-[#03060D] pointer-events-none"></div>
      
      <header className="border-b border-cyan-900/30 bg-[#050B14]/80 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 leading-tight tracking-wide">CamTech Admin</h1>
              <p className="text-[11px] font-medium text-cyan-500/70">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-[#0B1221] rounded-xl p-1 border border-cyan-900/40 shadow-inner">
              <button
                onClick={() => setTab('tokens')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${tab === 'tokens' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
              >
                Access Tokens
              </button>
              <button
                onClick={() => setTab('users')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${tab === 'users' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
              >
                Users
              </button>
            </div>
            <button
              onClick={logout}
              className="text-sm font-bold text-slate-500 hover:text-red-400 transition-colors duration-300 flex items-center gap-2"
            >
              Sign out
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-10 z-10">
        {tab === 'tokens' ? <TokenManager /> : <UserManager />}
      </main>
    </div>
  )
}
