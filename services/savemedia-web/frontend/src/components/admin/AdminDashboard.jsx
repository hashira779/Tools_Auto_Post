import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { session } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tokens'); // 'tokens', 'users', 'automations'

  // Token Form State
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState(30);
  const [uses, setUses] = useState(1);
  const [unlimited, setUnlimited] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tokenRes, userRes, wfRes, logRes] = await Promise.all([
        fetch('/api/admin/tokens', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch('/api/n8n/workflows', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch('/api/n8n/logs?limit=10', { headers: { 'Authorization': `Bearer ${session.access_token}` } })
      ]);
      
      if (tokenRes.ok) setTokens(await tokenRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (logRes.ok) setLogs(await logRes.json());
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

  // Workflow Form State
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfN8nId, setWfN8nId] = useState('');
  const [wfWebhook, setWfWebhook] = useState('');
  const [wfCategory, setWfCategory] = useState('general');
  const [wfCreating, setWfCreating] = useState(false);

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    setWfCreating(true);
    try {
      const resp = await fetch('/api/n8n/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name: wfName, description: wfDesc, n8n_workflow_id: wfN8nId, webhook_path: wfWebhook, category: wfCategory
        })
      });
      if (resp.ok) {
        setWfName(''); setWfDesc(''); setWfN8nId(''); setWfWebhook('');
        fetchData();
      } else {
        const data = await resp.json();
        alert(data.detail || 'Error creating workflow');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWfCreating(false);
    }
  };

  const handleToggleWorkflow = async (id, currentStatus) => {
    try {
      await fetch(`/api/n8n/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await fetch(`/api/n8n/workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && tokens.length === 0 && workflows.length === 0) {
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
          <button 
            onClick={() => setTab('automations')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'automations' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            Automations
          </button>
          <button 
            onClick={() => setTab('n8n')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'n8n' ? 'bg-[#FF6D5A] text-white shadow-lg shadow-[#FF6D5A]/30' : 'text-gray-400 hover:text-white'}`}
          >
            n8n Builder
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

      {tab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Workflow Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1c23] border border-orange-900/20 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-white mb-6">Register Workflow</h3>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Workflow Name</label>
                  <input 
                    type="text" required
                    value={wfName} onChange={e => setWfName(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-orange-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
                  <input 
                    type="text" 
                    value={wfDesc} onChange={e => setWfDesc(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-orange-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">n8n Workflow ID</label>
                  <input 
                    type="text" required
                    value={wfN8nId} onChange={e => setWfN8nId(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-orange-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Webhook Path</label>
                  <input 
                    type="text" placeholder="/webhook/..." required
                    value={wfWebhook} onChange={e => setWfWebhook(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-orange-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Category</label>
                  <input 
                    type="text" required
                    value={wfCategory} onChange={e => setWfCategory(e.target.value)}
                    className="w-full bg-[#0d0e12] border border-orange-900/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <button 
                  type="submit" disabled={wfCreating}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {wfCreating ? 'Registering...' : 'Register Workflow'}
                </button>
              </form>
            </div>
          </div>

          {/* Workflows List */}
          <div className="lg:col-span-2 space-y-4">
            {workflows.length === 0 ? (
              <div className="bg-[#1a1c23] rounded-2xl p-12 text-center text-gray-500 border border-dashed border-gray-800">
                No workflows registered yet.
              </div>
            ) : workflows.map(wf => (
              <div key={wf.id} className="bg-[#1a1c23] border border-orange-900/10 rounded-2xl p-5 flex items-center justify-between group hover:border-orange-900/30 transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold text-white">{wf.name}</h4>
                    <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{wf.category}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{wf.description || 'No description'}</p>
                  <div className="flex gap-4 text-xs font-mono text-gray-500">
                    <span>ID: <b className="text-orange-400/70">{wf.n8n_workflow_id}</b></span>
                    <span>Webhook: <b className="text-orange-400/70">{wf.webhook_path}</b></span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleToggleWorkflow(wf.id, wf.is_active)}
                    className={`w-12 h-6 rounded-full relative transition-all ${wf.is_active ? 'bg-orange-500' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${wf.is_active ? 'right-1' : 'left-1'}`} />
                  </button>
                  <button 
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    className="p-2.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'n8n' && (
        <div className="bg-[#1a1c23] border border-blue-900/20 rounded-2xl overflow-hidden h-[800px] flex flex-col">
          <div className="bg-black/20 p-3 border-b border-blue-900/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF6D5A]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.66 0v6.07c-3.13.19-5.63 2.81-5.63 6.02 0 1.94.91 3.68 2.33 4.81l-3.32 4.98C2.08 19.34 0 15.93 0 12.09 0 5.42 5.42 0 12.09 0h-.43zm.68 24v-6.07c3.13-.19 5.63-2.81 5.63-6.02 0-1.94-.91-3.68-2.33-4.81l3.32-4.98c2.96 2.54 5.04 5.95 5.04 9.79 0 6.67-5.42 12.09-12.09 12.09h.43z"/>
              </svg>
              n8n Workflow Builder
            </h3>
            <a 
              href="/n8n/" target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold text-blue-400 hover:text-white transition-all flex items-center gap-1"
            >
              Open in New Tab
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
          <iframe 
            src="/n8n/" 
            className="w-full flex-1 border-0" 
            title="n8n Admin Builder" 
            allow="clipboard-write; clipboard-read"
          />
        </div>
      )}
    </div>
  );
}
