import React from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'

export default function PdfToolsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()

  if (authLoading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm font-medium uppercase tracking-widest animate-pulse">Loading Workspace...</p>
      </div>
    )
  }

  // 1. Not signed in with Google
  if (!session) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-16 text-center animate-fade-in px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">PDF Tools Workspace</h2>
        <p className="text-slate-400 max-w-md mb-8 text-base leading-relaxed">
          Sign in with your Google account to access 50+ Stirling-PDF document editing, OCR, and conversion tools.
        </p>
        <button 
          onClick={loginWithGoogle}
          className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl border border-white/10 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:border-red-500/30 cursor-pointer text-base group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .5 4.1 1.5l3.1-3.1C17.3 1.6 14.8.7 12 .7 7.5.7 3.7 3.3 1.9 7.1l3.7 2.8C6.5 6.9 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L1.9 7.1C.7 9.5 0 10.7 0 12s.7 2.5 1.9 4.9l3.7-2.8z"/>
            <path fill="#34A853" d="M12 23.3c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-1.9-6.4-4.9L1.9 16.5C3.7 20.3 7.5 23.3 12 23.3z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    )
  }

  // 2. Signed in, but needs active Token verification
  if (!dbUser?.is_verified) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-10 px-4">
        <VerificationOverlay 
          title="PDF Studio Activation"
          subtitle="Enter your active token key to unlock all Stirling-PDF tools."
        />
      </div>
    )
  }

  // 3. Fully Verified
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center pt-16 px-4 animate-fade-in text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">PDF Tools Workspace</h2>
      <p className="text-slate-400 max-w-md mb-8 text-base leading-relaxed">
        Your PDF studio is active and ready. Launch the complete toolset in a standalone workspace.
      </p>
      
      <a 
        href="/pdf/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center gap-3 shadow-[0_0_25px_rgba(239,68,68,0.35)] hover:shadow-[0_0_35px_rgba(239,68,68,0.55)] cursor-pointer text-base hover:-translate-y-0.5 active:translate-y-0 group"
      >
        <span>Launch Standalone PDF Studio</span>
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
