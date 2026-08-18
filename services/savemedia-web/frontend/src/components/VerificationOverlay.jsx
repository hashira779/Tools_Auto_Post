import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function VerificationOverlay() {
  const { session, dbUser, refreshDbUser, logout } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session || !dbUser || dbUser.is_verified) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/ai/admin/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ token_key: token.trim() })
      });

      const data = await resp.json();

      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => {
          refreshDbUser();
        }, 1500);
      } else {
        setError(data.detail || 'Invalid token key. Please check with your admin.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050B14]/85 backdrop-blur-xl p-4 animate-fade-in">
      <div className="relative bg-gradient-to-b from-[#0B1221]/90 to-[#050B14]/90 border border-cyan-900/40 rounded-3xl p-10 max-w-md w-full shadow-[0_0_50px_-15px_rgba(6,182,212,0.3)] animate-pop-in overflow-hidden">
        {/* Subtle top glare for premium feel */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            {/* Smooth pulsing aura */}
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>
            {/* Inner frosty container */}
            <div className="relative z-10 w-20 h-20 bg-gradient-to-b from-cyan-900/40 to-blue-900/40 rounded-full flex items-center justify-center border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-md transition-transform duration-500 hover:scale-105">
              <svg className="w-9 h-9 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m0 0v2m0-2h2m-2 0H10m3.332-8A4.499 4.499 0 1115.67 7H9.33a4.499 4.499 0 112.338 8.057l1.232 3.696a1 1 0 001.914 0l1.232-3.696A4.499 4.499 0 0115.332 7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 mb-3 tracking-tight drop-shadow-sm">System Locked</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            Please enter your secure access token to initialize CamTech AI modules.
          </p>
        </div>

        {success ? (
          <div className="bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 p-5 rounded-2xl text-center flex flex-col items-center gap-3 animate-slide-up shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold tracking-wide">Access Granted. Initializing...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="CAM-XXXX-XXXX"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="w-full bg-[#03060D] border border-cyan-900/50 rounded-2xl px-5 py-4 text-cyan-50 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/50 transition-all duration-300 uppercase font-mono tracking-[0.2em] text-center shadow-inner"
                disabled={loading}
              />
              {error && (
                <div className="absolute -bottom-6 left-0 right-0 text-center animate-slide-in-down">
                  <p className="text-red-400/90 text-xs font-medium tracking-wide">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 tracking-wide mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-white/80">Verifying...</span>
                </>
              ) : (
                'Verify Access'
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 py-3 rounded-xl text-sm font-medium transition-all duration-300"
            >
              Sign out & use another account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
