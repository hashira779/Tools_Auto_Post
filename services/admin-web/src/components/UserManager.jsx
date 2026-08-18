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
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      <div className="bg-[#1a1c23] border border-blue-900/20 rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-black/20 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-blue-900/10">
              <th className="px-6 py-4">User Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Verified</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-8 text-gray-500 animate-pulse">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-gray-500">No users yet.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-all">
                <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Toggle on={u.is_verified} color="bg-blue-600" onClick={() => update(u.id, { is_verified: !u.is_verified })} />
                </td>
                <td className="px-6 py-4">
                  <Toggle on={u.is_admin} color="bg-purple-600" onClick={() => update(u.id, { is_admin: !u.is_admin })} />
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => update(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                    className="text-xs font-bold text-gray-500 hover:text-white transition-all underline underline-offset-4 decoration-gray-700"
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
  )
}
