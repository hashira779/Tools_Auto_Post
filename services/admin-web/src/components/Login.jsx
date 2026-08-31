import React from 'react'

export default function Login({ onLogin }) {
  return (
    <div className="min-h-screen bg-[#03060D] text-slate-300 font-sans selection:bg-cyan-500/30 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#03060D] to-[#03060D] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-20 animate-pulse" />
        <div className="relative bg-gradient-to-b from-[#0B1221]/90 to-[#050B14]/90 border border-cyan-900/40 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 flex items-center justify-center border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight">CamTech Admin</h1>
          <p className="text-cyan-500/70 mt-3 text-sm font-medium px-4">
            Sign in with your authorized Google account to access the control panel.
          </p>
          
          <button
            onClick={onLogin}
            className="w-full mt-10 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:border-cyan-400/30 hover:-translate-y-1 active:translate-y-0"
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="text-white font-bold text-base">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}
