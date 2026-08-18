import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import TokenManager from './components/TokenManager'
import UserManager from './components/UserManager'

function Centered({ children }) {
  return <div className="min-h-screen flex items-center justify-center px-4 text-center">{children}</div>
}

export default function App() {
  const { session, profile, loading, isAdmin, loginWithGoogle, logout } = useAuth()
  const [tab, setTab] = useState('tokens')

  if (loading) {
    return <Centered><div className="text-gray-500 animate-pulse">Loading admin console…</div></Centered>
  }

  if (!session) {
    return <Login onLogin={loginWithGoogle} />
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
    <div className="min-h-screen">
      <header className="border-b border-blue-900/20 bg-[#0d0e12]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">CamTech Admin</h1>
              <p className="text-[11px] text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#1a1c23] rounded-xl p-1 border border-blue-900/20">
              <button
                onClick={() => setTab('tokens')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'tokens' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Access Tokens
              </button>
              <button
                onClick={() => setTab('users')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Users
              </button>
            </div>
            <button
              onClick={logout}
              className="text-sm font-semibold text-gray-400 hover:text-white transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'tokens' ? <TokenManager /> : <UserManager />}
      </main>
    </div>
  )
}
