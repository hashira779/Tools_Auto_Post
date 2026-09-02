import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';

/* ──────────────────────────────────────────────────────────────
   Small presentational helpers (design-token based, theme-aware)
   ────────────────────────────────────────────────────────────── */

const card =
  'bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-2xl backdrop-blur-xl';
const inputCls =
  'w-full bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/40 focus:border-[var(--color-primary-500)] transition-colors';
const labelCls =
  'block text-[11px] font-semibold text-[var(--color-text-4)]  mb-1.5 ml-0.5';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[var(--color-text-4)] ">{label}</p>
        <p className="text-2xl font-bold text-[var(--color-text)] leading-tight">{value}</p>
        {sub && <p className="text-xs text-[var(--color-text-3)] truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Badge({ tone = 'neutral', children }) {
  const tones = {
    success: 'bg-[var(--color-success-dim)] text-[var(--color-success)]',
    error: 'bg-[var(--color-error-dim)] text-[var(--color-error)]',
    warning: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]',
    neutral: 'bg-[var(--color-surface-3)] text-[var(--color-text-2)]',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Toggle({ on, onClick, accent = 'var(--color-primary-500)' }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
      style={{ background: on ? accent : 'var(--color-surface-4)' }}
      aria-pressed={on}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-1)] rounded-full shadow transition-colors ${on ? 'right-1' : 'left-1'}`}
      />
    </button>
  );
}

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/* ──────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const { session } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('overview'); // overview | tokens | users | automations

  const authHeader = { Authorization: `Bearer ${session?.access_token}` };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [tokenRes, userRes, wfRes, logRes] = await Promise.all([
        fetch('/api/admin/tokens', { headers: authHeader }),
        fetch('/api/admin/users', { headers: authHeader }),
        fetch('/api/n8n/workflows', { headers: authHeader }),
        fetch('/api/n8n/logs?limit=15', { headers: authHeader }),
      ]);
      if (tokenRes.ok) setTokens(await tokenRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (e) {
      console.error('Fetch admin data error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  /* ── Token handlers ─────────────────────────────────────────── */
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState(30);
  const [uses, setUses] = useState(1);
  const [unlimited, setUnlimited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleCreateToken = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const resp = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ description: desc, valid_days: days, max_uses: uses, is_unlimited: unlimited }),
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
    if (!window.confirm('Delete this token?')) return;
    try {
      await fetch(`/api/admin/tokens/${id}`, { method: 'DELETE', headers: authHeader });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const copyToken = (key) => {
    navigator.clipboard?.writeText(key).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  /* ── User handlers ──────────────────────────────────────────── */
  const [userSearch, setUserSearch] = useState('');

  const handleUpdateUser = async (userId, updates) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((u) => u.email?.toLowerCase().includes(userSearch.toLowerCase())),
    [users, userSearch]
  );

  /* ── Workflow handlers ──────────────────────────────────────── */
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
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name: wfName, description: wfDesc, n8n_workflow_id: wfN8nId, webhook_path: wfWebhook, category: wfCategory,
        }),
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
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;
    try {
      await fetch(`/api/n8n/workflows/${id}`, { method: 'DELETE', headers: authHeader });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Derived KPIs ───────────────────────────────────────────── */
  const stats = useMemo(() => {
    const activeTokens = tokens.filter((t) => t.is_active).length;
    const activeWorkflows = workflows.filter((w) => w.is_active).length;
    const blockedUsers = users.filter((u) => u.status !== 'active').length;
    return {
      users: users.length,
      blockedUsers,
      activeTokens,
      tokens: tokens.length,
      workflows: workflows.length,
      activeWorkflows,
    };
  }, [tokens, users, workflows]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'tokens', label: 'Access Tokens' },
    { id: 'users', label: 'Users' },
    { id: 'automations', label: 'Automations' },
  ];

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${card} h-24 animate-pulse`} />
          ))}
        </div>
        <div className={`${card} h-64 animate-pulse`} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Control Center</h1>
          <p className="text-[var(--color-text-3)] mt-1">Manage access, users, and automation workflows.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--color-text-2)] bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] hover:text-[var(--color-text)] hover:border-[var(--color-primary-400)] transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users" value={stats.users}
          sub={stats.blockedUsers ? `${stats.blockedUsers} blocked` : 'All active'}
          accent="#2563eb"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" /></svg>}
        />
        <StatCard
          label="Active Tokens" value={stats.activeTokens}
          sub={`${stats.tokens} total issued`}
          accent="#34D399"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
        />
        <StatCard
          label="Workflows" value={stats.workflows}
          sub={`${stats.activeWorkflows} running`}
          accent="#f97316"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard
          label="Recent Events" value={logs.length}
          sub="last runs"
          accent="#a855f7"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* Tabs */}
      <div className={`inline-flex ${card} p-1 mb-8`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[var(--color-primary-500)] text-white shadow-lg shadow-[var(--color-primary-500)]/20'
                : 'text-[var(--color-text-3)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${card} p-6`}>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Recent Activity</h3>
            {logs.length === 0 ? (
              <p className="text-[var(--color-text-4)] text-sm py-8 text-center">No recent executions.</p>
            ) : (
              <ul className="space-y-3">
                {logs.map((log, i) => {
                  const ok = (log.status || log.finished) && log.status !== 'error' && log.status !== 'failed';
                  return (
                    <li key={log.id || i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ok ? 'var(--color-success)' : 'var(--color-error)' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--color-text)] truncate">{log.workflowName || log.name || log.workflow_id || 'Workflow run'}</p>
                        <p className="text-xs text-[var(--color-text-4)]">
                          {log.startedAt || log.created_at ? new Date(log.startedAt || log.created_at).toLocaleString() : '—'}
                        </p>
                      </div>
                      <Badge tone={ok ? 'success' : 'error'}>{log.status || (ok ? 'ok' : 'error')}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={`${card} p-6`}>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">System Summary</h3>
            <dl className="space-y-3 text-sm">
              {[
                ['Registered users', stats.users],
                ['Blocked users', stats.blockedUsers],
                ['Active access tokens', `${stats.activeTokens} / ${stats.tokens}`],
                ['Active workflows', `${stats.activeWorkflows} / ${stats.workflows}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-[var(--color-glass-border)] pb-2 last:border-0">
                  <dt className="text-[var(--color-text-3)]">{k}</dt>
                  <dd className="font-semibold text-[var(--color-text)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* ── TOKENS ───────────────────────────────────────────── */}
      {tab === 'tokens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`${card} p-6 sticky top-24`}>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-5">Generate New Token</h3>
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className={labelCls}>Description (Internal)</label>
                  <input type="text" placeholder="e.g. VIP Partner" value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
                </div>
                <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
                  <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="w-4 h-4 rounded accent-[var(--color-primary-500)]" />
                  <span className="text-sm text-[var(--color-text-2)]">Unlimited usage / permanent</span>
                </label>
                {!unlimited && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Valid Days</label>
                      <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Max Uses</label>
                      <input type="number" value={uses} onChange={(e) => setUses(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                )}
                <button type="submit" disabled={creating} className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                  {creating ? 'Generating…' : 'Generate Token'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {tokens.length === 0 ? (
              <div className={`${card} p-12 text-center text-[var(--color-text-4)] border-dashed`}>No tokens generated yet.</div>
            ) : (
              tokens.map((t) => (
                <div key={t.id} className={`${card} p-5 flex items-center justify-between group`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <button
                        onClick={() => copyToken(t.token_key)}
                        title="Copy token"
                        className="text-base font-mono font-bold text-[var(--color-primary-400)] tracking-wider bg-[var(--color-primary-500)]/10 px-2 py-0.5 rounded hover:bg-[var(--color-primary-500)]/20 transition-colors inline-flex items-center gap-1.5"
                      >
                        {t.token_key}
                        <span className="text-[10px] text-[var(--color-text-4)]">{copied === t.token_key ? '✓ copied' : '⧉'}</span>
                      </button>
                      <Badge tone={t.is_active ? 'success' : 'error'}>{t.is_active ? 'Active' : 'Expired'}</Badge>
                    </div>
                    <p className="text-[var(--color-text-2)] text-sm font-medium">{t.description || 'No description'}</p>
                    <div className="flex gap-4 mt-2 text-[11px] text-[var(--color-text-4)] flex-wrap">
                      <span>Uses: <b className="text-[var(--color-text-3)]">{t.current_uses} / {t.max_uses === 0 ? '∞' : t.max_uses}</b></span>
                      <span>Expires: <b className="text-[var(--color-text-3)]">{t.valid_until ? new Date(t.valid_until).toLocaleDateString() : 'Never'}</b></span>
                      <span>Created: <b className="text-[var(--color-text-3)]">{new Date(t.created_at).toLocaleDateString()}</b></span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteToken(t.id)} className="p-2.5 rounded-lg text-[var(--color-text-4)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-dim)] transition-colors opacity-0 group-hover:opacity-100">
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── USERS ────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search users by email…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className={`${inputCls} max-w-sm`}
          />
          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] text-[11px] font-bold text-[var(--color-text-4)] border-b border-[var(--color-glass-border)]">
                    <th className="px-6 py-4">User Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verified</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-glass-border)]">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-[var(--color-text-4)]">No users found.</td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[var(--color-text)]">{u.email}</td>
                      <td className="px-6 py-4"><Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge></td>
                      <td className="px-6 py-4"><Toggle on={u.is_verified} onClick={() => handleUpdateUser(u.id, { is_verified: !u.is_verified })} /></td>
                      <td className="px-6 py-4"><Toggle on={u.is_admin} onClick={() => handleUpdateUser(u.id, { is_admin: !u.is_admin })} accent="#a855f7" /></td>
                      <td className="px-6 py-4 text-xs text-[var(--color-text-4)]">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                          className="text-xs font-bold text-[var(--color-text-4)] hover:text-[var(--color-text)] transition-colors underline underline-offset-4 decoration-[var(--color-border-3)]"
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
      )}

      {/* ── AUTOMATIONS ──────────────────────────────────────── */}
      {tab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`${card} p-6 sticky top-24`}>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-5">Register Workflow</h3>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className={labelCls}>Workflow Name</label>
                  <input type="text" required value={wfName} onChange={(e) => setWfName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input type="text" value={wfDesc} onChange={(e) => setWfDesc(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>n8n Workflow ID</label>
                  <input type="text" required value={wfN8nId} onChange={(e) => setWfN8nId(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Webhook Path</label>
                  <input type="text" placeholder="/webhook/…" required value={wfWebhook} onChange={(e) => setWfWebhook(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <input type="text" required value={wfCategory} onChange={(e) => setWfCategory(e.target.value)} className={inputCls} />
                </div>
                <button type="submit" disabled={wfCreating} className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                  {wfCreating ? 'Registering…' : 'Register Workflow'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {workflows.length === 0 ? (
              <div className={`${card} p-12 text-center text-[var(--color-text-4)] border-dashed`}>No workflows registered yet.</div>
            ) : (
              workflows.map((wf) => (
                <div key={wf.id} className={`${card} p-5 flex items-center justify-between group`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h4 className="text-base font-bold text-[var(--color-text)]">{wf.name}</h4>
                      <Badge>{wf.category}</Badge>
                      <Badge tone={wf.is_active ? 'success' : 'neutral'}>{wf.is_active ? 'Running' : 'Paused'}</Badge>
                    </div>
                    <p className="text-[var(--color-text-3)] text-sm mb-2">{wf.description || 'No description'}</p>
                    <div className="flex gap-4 text-xs font-mono text-[var(--color-text-4)] flex-wrap">
                      <span>ID: <b className="text-[#f97316]/80">{wf.n8n_workflow_id}</b></span>
                      <span>Webhook: <b className="text-[#f97316]/80">{wf.webhook_path}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Toggle on={wf.is_active} onClick={() => handleToggleWorkflow(wf.id, wf.is_active)} accent="#f97316" />
                    <button onClick={() => handleDeleteWorkflow(wf.id)} className="p-2.5 rounded-lg text-[var(--color-text-4)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-dim)] transition-colors opacity-0 group-hover:opacity-100">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
