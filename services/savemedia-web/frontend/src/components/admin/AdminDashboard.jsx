import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { session } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tokens'); // 'tokens', 'users'

  // Token Form State
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState(30);
  const [uses, setUses] = useState(1);
  const [unlimited, setUnlimited] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tokenRes, userRes] = await Promise.all([
        fetch('/api/admin/tokens', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${session.access_token}` } })
      ]);
      
      if (tokenRes.ok) setTokens(await tokenRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (e) {
      console.error("Fetch admin data error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleCreateToken = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const resp = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          description: desc,
          valid_days: days,
          max_uses: uses,
          is_unlimited: unlimited
        })
      });
      if (resp.ok) {
        setDesc('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteToken = async (id) => {
    if (!window.confirm("Delete this token?")) return;
    try {
      await fetch(`/api/admin/tokens/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && tokens.length === 0) {
    return <div className="w-full max-w-4xl mx-auto p-8 animate-pulse text-gray-500">Loading Admin Control Plane...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-gray-400 mt-1">Manage system access tokens and user permissions.</p>
        </div>
        <div className="flex bg-[#1a1c23] rounded-xl p-1 border border-blue-900/20">
          <button 
            onClick={() => setTab('tokens')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'tokens' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            Access Tokens
          </button>
          <button 
            onClick={() => setTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            User Directory
          </button>
        </div>
      </div>

      {tab === 'tokens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Token Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1c23] border border-blue-900/20 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-white mb-6">Generate New Token</h3>
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Description (Internal)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. For VIP Partner"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="unlimited" 
                    checked={unlimited}
                    onChange={e => setUnlimited(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0d0e12] border-blue-900/30 text-blue-600"
                  />
                  <label htmlFor="unlimited" className="text-sm text-gray-300 cursor-pointer">Unlimited Usage / Permanent</label>
                </div>

                {!unlimited && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Valid Days</label>
                      <input 
                        type="number" 
                        value={days}
                        onChange={e => setDays(e.target.value)}
                        className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Max Uses</label>
                      <input 
                        type="number" 
                        value={uses}
                        onChange={e => setUses(e.target.value)}
                        className="w-full bg-[#0d0e12] border border-blue-900/10 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {creating ? 'Generating...' : 'Generate Token'}
                </button>
              </form>
            </div>
          </div>

          {/* Tokens List */}
          <div className="lg:col-span-2 space-y-4">
            {tokens.length === 0 ? (
              <div className="bg-[#1a1c23] rounded-2xl p-12 text-center text-gray-500 border border-dashed border-gray-800">
                No tokens generated yet.
              </div>
            ) : tokens.map(t => (
              <div key={t.id} className="bg-[#1a1c23] border border-blue-900/10 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-900/30 transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-lg font-mono font-bold text-blue-400 tracking-wider bg-blue-500/10 px-2 py-0.5 rounded">{t.token_key}</code>
                    {!t.is_active && <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Expired/Limit</span>}
                    {t.is_active && <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                  </div>
                  <p className="text-gray-300 text-sm font-medium">{t.description || 'No description'}</p>
                  <div className="flex gap-4 mt-2 text-[11px] text-gray-500">
                    <span>Uses: <b className="text-gray-400">{t.current_uses} / {t.max_uses === 0 ? '∞' : t.max_uses}</b></span>
                    <span>Expires: <b className="text-gray-400">{t.valid_until ? new Date(t.valid_until).toLocaleDateString() : 'Never'}</b></span>
                    <span>Created: <b className="text-gray-400">{new Date(t.created_at).toLocaleDateString()}</b></span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteToken(t.id)}
                  className="p-2.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-[#1a1c23] border border-blue-900/20 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
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
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleUpdateUser(u.id, { is_verified: !u.is_verified })}
                      className={`w-10 h-5 rounded-full relative transition-all ${u.is_verified ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.is_verified ? 'right-1' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleUpdateUser(u.id, { is_admin: !u.is_admin })}
                      className={`w-10 h-5 rounded-full relative transition-all ${u.is_admin ? 'bg-purple-600' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.is_admin ? 'right-1' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
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
      )}
    </div>
  );
}
