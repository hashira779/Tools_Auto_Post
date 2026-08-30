import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AutomationsPage() {
  const { dbUser, session, loading: authLoading } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [triggering, setTriggering] = useState({})
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (authLoading) return
    if (!dbUser || !session) {
      setLoading(false)
      return
    }

    const fetchWorkflows = async () => {
      try {
        const res = await fetch('/api/n8n/active', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch workflows')
        const data = await res.json()
        setWorkflows(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [dbUser, session, authLoading])

  const handleTrigger = async (wf) => {
    setTriggering(p => ({ ...p, [wf.id]: true }))
    try {
      const res = await fetch(`/api/n8n/trigger/${wf.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ payload: {} })
      })
      if (!res.ok) throw new Error('Failed to trigger workflow')
      const data = await res.json()
      showToast(`✅ ${wf.name} triggered (${data.duration_ms}ms)`)
    } catch (e) {
      showToast(`❌ ${e.message}`, 'error')
    } finally {
      setTriggering(p => ({ ...p, [wf.id]: false }))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-[var(--color-primary-300)] rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--color-text-3)] text-sm font-medium uppercase tracking-widest animate-pulse">Loading Automations...</p>
      </div>
    )
  }

  if (!dbUser) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--color-text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Sign In Required</h2>
        <p className="text-[var(--color-text-2)] max-w-md">You need to be signed in to view and trigger automations.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in relative pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl animate-slide-up border ${
          toast.type === 'error'
            ? 'bg-red-500/10 text-red-400 border-red-500/30 backdrop-blur-md'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 backdrop-blur-md'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text)] tracking-tight mb-4">
          Workflow <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Automations</span>
        </h1>
        <p className="text-lg text-[var(--color-text-2)] max-w-2xl mx-auto">
          Trigger background tasks and automated workflows seamlessly.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-glass-border)] rounded-3xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
          <svg className="w-14 h-14 text-[var(--color-text-4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-lg font-medium text-[var(--color-text-2)]">No Active Automations</p>
          <p className="text-sm text-[var(--color-text-3)] max-w-sm">There are currently no active workflows available to trigger. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workflows.map((wf, i) => (
            <div 
              key={wf.id} 
              className="bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] border border-[var(--color-glass-border)] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg group flex flex-col justify-between h-full relative overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Category tag */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[var(--color-surface-3)] text-[var(--color-text-3)]">
                  {wf.category}
                </span>
              </div>

              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2 group-hover:text-[var(--color-primary-400)] transition-colors">
                  {wf.name}
                </h3>
                
                <p className="text-sm text-[var(--color-text-3)] mb-6 line-clamp-2">
                  {wf.description || "No description provided."}
                </p>
              </div>

              <button
                onClick={() => handleTrigger(wf)}
                disabled={triggering[wf.id]}
                className="w-full bg-[var(--color-surface-3)] hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30 disabled:opacity-50 border border-[var(--color-glass-border)] text-[var(--color-text)] font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {triggering[wf.id] ? (
                  <>
                    <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="text-orange-400">Triggering...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Automation
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
