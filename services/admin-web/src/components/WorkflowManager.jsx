import React, { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'
import AutomationLogs from './AutomationLogs'

const CATEGORIES = ['general', 'social', 'backup', 'notify', 'data', 'other']

export default function WorkflowManager() {
  const [workflows, setWorkflows] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [n8nId, setN8nId] = useState('')
  const [webhookPath, setWebhookPath] = useState('')
  const [category, setCategory] = useState('general')
  const [creating, setCreating] = useState(false)

  // Trigger states
  const [triggering, setTriggering] = useState({})
  const [expandedLogs, setExpandedLogs] = useState({})
  const [workflowLogs, setWorkflowLogs] = useState({})
  const [wfLogsLoading, setWfLogsLoading] = useState({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [wfs, allLogs] = await Promise.all([
        adminApi.listWorkflows(),
        adminApi.listAllLogs(20),
      ])
      setWorkflows(wfs)
      setLogs(allLogs)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim() || !n8nId.trim()) return
    setCreating(true)
    setError('')
    try {
      await adminApi.createWorkflow({
        name: name.trim(),
        description: description.trim() || null,
        n8n_workflow_id: n8nId.trim(),
        webhook_path: webhookPath.trim() || null,
        category,
      })
      setName(''); setDescription(''); setN8nId(''); setWebhookPath(''); setCategory('general')
      setShowForm(false)
      showToast('Workflow registered!')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleTrigger = async (wf) => {
    setTriggering(p => ({ ...p, [wf.id]: true }))
    try {
      const res = await adminApi.triggerWorkflow(wf.id)
      showToast(`✅ ${wf.name}: ${res.status} (${res.duration_ms}ms)`)
      await load()
    } catch (e) {
      showToast(`❌ ${wf.name}: ${e.message}`, 'error')
    } finally {
      setTriggering(p => ({ ...p, [wf.id]: false }))
    }
  }

  const toggleActive = async (wf) => {
    try {
      await adminApi.updateWorkflow(wf.id, { is_active: !wf.is_active })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const removeWorkflow = async (wf) => {
    if (!window.confirm(`Delete workflow "${wf.name}" and all its logs?`)) return
    try {
      await adminApi.deleteWorkflow(wf.id)
      showToast('Workflow deleted')
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleLogs = async (wfId) => {
    if (expandedLogs[wfId]) {
      setExpandedLogs(p => ({ ...p, [wfId]: false }))
      return
    }
    setExpandedLogs(p => ({ ...p, [wfId]: true }))
    setWfLogsLoading(p => ({ ...p, [wfId]: true }))
    try {
      const data = await adminApi.listWorkflowLogs(wfId)
      setWorkflowLogs(p => ({ ...p, [wfId]: data }))
    } catch (e) {
      setError(e.message)
    } finally {
      setWfLogsLoading(p => ({ ...p, [wfId]: false }))
    }
  }

  const categoryColor = (cat) => {
    const colors = {
      social: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      backup: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      notify: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      data:   'text-violet-400 bg-violet-500/10 border-violet-500/20',
      other:  'text-slate-400 bg-slate-500/10 border-slate-500/20',
    }
    return colors[cat] || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl animate-slide-up border ${
          toast.type === 'error'
            ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-900/30 border border-orange-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(251,146,60,0.2)]">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-200">Workflow Automations</h2>
            <p className="text-xs text-slate-500 mt-0.5">{workflows.length} registered • Powered by n8n</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 shadow-[0_0_15px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? 'Cancel' : 'Register Workflow'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl px-5 py-4 animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="relative bg-gradient-to-b from-[#0B1221]/90 to-[#050B14]/90 border border-orange-900/40 rounded-3xl p-8 shadow-[0_0_40px_-10px_rgba(251,146,60,0.15)] overflow-hidden animate-fade-in">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent"></div>
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-200 mb-6">Register n8n Workflow</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-orange-500/70 uppercase tracking-wider mb-2">Workflow Name *</label>
              <input
                type="text" required placeholder="e.g. Auto-Post to Facebook"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#03060D] border border-orange-900/50 rounded-xl px-4 py-3 text-orange-50 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/50 transition-all duration-300 shadow-inner text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-500/70 uppercase tracking-wider mb-2">n8n Workflow ID *</label>
              <input
                type="text" required placeholder="e.g. wkf_abc123"
                value={n8nId} onChange={e => setN8nId(e.target.value)}
                className="w-full bg-[#03060D] border border-orange-900/50 rounded-xl px-4 py-3 text-orange-50 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/50 transition-all duration-300 shadow-inner text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-500/70 uppercase tracking-wider mb-2">Webhook Path</label>
              <input
                type="text" placeholder="e.g. /webhook/abc123"
                value={webhookPath} onChange={e => setWebhookPath(e.target.value)}
                className="w-full bg-[#03060D] border border-orange-900/50 rounded-xl px-4 py-3 text-orange-50 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/50 transition-all duration-300 shadow-inner text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-500/70 uppercase tracking-wider mb-2">Category</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#03060D] border border-orange-900/50 rounded-xl px-4 py-3 text-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/50 transition-all duration-300 shadow-inner text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-orange-500/70 uppercase tracking-wider mb-2">Description</label>
              <input
                type="text" placeholder="Optional description"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#03060D] border border-orange-900/50 rounded-xl px-4 py-3 text-orange-50 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400/50 transition-all duration-300 shadow-inner text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit" disabled={creating}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Registering…</span>
                  </>
                ) : 'Register Workflow'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflows List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-orange-500/50">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest animate-pulse">Loading Workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-gradient-to-b from-[#0B1221]/50 to-[#050B14]/50 border border-cyan-900/20 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center gap-4">
          <svg className="w-14 h-14 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-medium">No workflows registered yet.</p>
          <p className="text-xs text-slate-600">Create a workflow in n8n, then register it here to trigger from the admin panel.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf, i) => (
            <div key={wf.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
              <div className="bg-gradient-to-r from-[#0B1221]/80 to-[#050B14]/80 border border-cyan-900/30 rounded-2xl p-6 hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(251,146,60,0.05)] transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-base font-bold text-white">{wf.name}</h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${categoryColor(wf.category)}`}>
                        {wf.category}
                      </span>
                      {wf.is_active
                        ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Active</span>
                        : <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Disabled</span>
                      }
                    </div>
                    {wf.description && <p className="text-slate-400 text-sm mb-2">{wf.description}</p>}
                    <div className="flex gap-5 text-xs text-slate-500 flex-wrap font-medium">
                      <span className="flex items-center gap-1.5 font-mono">
                        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        {wf.n8n_workflow_id}
                      </span>
                      {wf.webhook_path && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          {wf.webhook_path}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTrigger(wf)}
                      disabled={!wf.is_active || !wf.webhook_path || triggering[wf.id]}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.15)] hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center gap-1.5"
                    >
                      {triggering[wf.id] ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      Trigger
                    </button>
                    <button
                      onClick={() => toggleLogs(wf.id)}
                      className="text-xs font-bold px-3 py-2 rounded-xl text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all duration-300"
                    >
                      Logs
                    </button>
                    <button
                      onClick={() => toggleActive(wf)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all duration-300 border ${wf.is_active ? 'text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white' : 'text-cyan-400 border-cyan-900 hover:bg-cyan-900/30'}`}
                    >
                      {wf.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => removeWorkflow(wf)}
                      className="text-xs font-bold px-3 py-2 rounded-xl text-red-400/70 border border-transparent hover:border-red-900/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Logs */}
                {expandedLogs[wf.id] && (
                  <div className="mt-5 pt-5 border-t border-cyan-900/20 animate-fade-in">
                    <AutomationLogs logs={workflowLogs[wf.id] || []} loading={wfLogsLoading[wf.id]} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Logs (all workflows) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-400/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">Recent Activity</h3>
        </div>
        <AutomationLogs logs={logs} loading={logsLoading} />
      </div>
    </div>
  )
}
