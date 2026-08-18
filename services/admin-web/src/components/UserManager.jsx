import React, { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'

export default function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await adminApi.listUsers())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = async (id, updates) => {
    setError('')
    try {
      await adminApi.updateUser(id, updates)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const Toggle = ({ on, onClick, color }) => (
    <button
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative transition-all ${on ? color : 'bg-gray-700'}`}
    >
      <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${on ? 'right-1' : 'left-1'}`} />
    </button>
  )

  return (
  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}
      
      <div className="bg-gradient-to-b from-[#0B1221]/80 to-[#050B14]/80 border border-cyan-900/30 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-[#03060D]/50 text-[11px] font-bold text-cyan-500/70 uppercase tracking-widest border-b border-cyan-900/30 backdrop-blur-md">
                <th className="px-6 py-5 pl-8">User Email</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Verified</th>
                <th className="px-6 py-5">Admin</th>
                <th className="px-6 py-5">Joined</th>
                <th className="px-6 py-5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900/20">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-cyan-500/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium uppercase tracking-widest animate-pulse">Loading users...</span>
                  </div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium">No users yet.</span>
                  </div>
                </td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id} style={{animationDelay: `${i * 30}ms`}} className="hover:bg-cyan-500/[0.02] transition-colors duration-300 animate-slide-up group">
                  <td className="px-6 py-5 pl-8 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{u.email}</td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${u.status === 'active' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-red-900/20 text-red-400 border border-red-500/20'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <Toggle on={u.is_verified} color="bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" onClick={() => update(u.id, { is_verified: !u.is_verified })} />
                  </td>
                  <td className="px-6 py-5">
                    <Toggle on={u.is_admin} color="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" onClick={() => update(u.id, { is_admin: !u.is_admin })} />
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-right pr-8">
                    <button
                      onClick={() => update(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-300 ${u.status === 'active' ? 'text-red-400/70 border-transparent hover:border-red-900/50 hover:bg-red-500/10 hover:text-red-400' : 'text-cyan-400 border-cyan-900 hover:bg-cyan-900/30 hover:border-cyan-500/50'}`}
                    >
                      {u.status === 'active' ? 'Block' : 'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
