import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function PdfToolsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()

  if (authLoading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-[var(--color-primary-300)] rounded-full animate-spin"></div>
        <p className="mt-4 text-[var(--color-text-3)] text-sm font-medium uppercase tracking-widest animate-pulse">Loading Workspace...</p>
      </div>
    )
  }

  if (!dbUser || !session) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-20 text-center animate-fade-in px-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-text)] mb-3">PDF Tools Workspace</h2>
        <p className="text-[var(--color-text-2)] max-w-md mb-8 text-lg">Sign in with Google to access the advanced PDF manipulation tools.</p>
        <button 
          onClick={loginWithGoogle}
          className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] font-semibold py-4 px-8 rounded-xl border border-[var(--color-glass-border)] transition-all flex items-center gap-3 shadow-lg hover:shadow-xl cursor-pointer text-lg group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center pt-20 px-4 animate-fade-in text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-3xl font-extrabold text-[var(--color-text)] mb-3">PDF Tools Workspace</h2>
      <p className="text-[var(--color-text-2)] max-w-md mb-8 text-lg">Your PDF studio is ready. Launch the tools in a standalone window for the best experience.</p>
      
      <a 
        href="/pdf/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-3 shadow-lg hover:shadow-xl cursor-pointer text-lg group"
      >
        <span>Launch Standalone PDF Studio</span>
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
