import React from 'react'

const STATUS_STYLES = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error:   'bg-red-500/10 text-red-400 border-red-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function truncate(str, len = 80) {
  if (!str) return '—'
  const s = typeof str === 'string' ? str : JSON.stringify(str)
  return s.length > len ? s.slice(0, len) + '…' : s
}

export default function AutomationLogs({ logs, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan-500/50">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-xs font-medium uppercase tracking-widest animate-pulse">Loading logs...</p>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-gradient-to-b from-[#0B1221]/50 to-[#050B14]/50 border border-cyan-900/20 rounded-2xl p-10 text-center text-slate-600 flex flex-col items-center gap-3">
        <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">No automation logs yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-900/30 bg-gradient-to-b from-[#0B1221]/60 to-[#050B14]/60">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-900/30">
              <th className="text-left text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">Time</th>
              <th className="text-left text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">Workflow</th>
              <th className="text-left text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-right text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">Duration</th>
              <th className="text-left text-[10px] font-bold text-cyan-500/60 uppercase tracking-wider px-4 py-3">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-900/20">
            {logs.map((log, i) => (
              <tr
                key={log.id}
                style={{ animationDelay: `${i * 30}ms` }}
                className="animate-fade-in hover:bg-cyan-900/10 transition-colors duration-200"
              >
                <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                  {timeAgo(log.executed_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 font-medium text-xs">
                  {log.workflow_name || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                  {log.triggered_by_email || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${STATUS_STYLES[log.status] || STATUS_STYLES.pending}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-slate-400 font-mono text-xs">
                  {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate font-mono" title={JSON.stringify(log.response)}>
                  {truncate(log.response, 60)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
