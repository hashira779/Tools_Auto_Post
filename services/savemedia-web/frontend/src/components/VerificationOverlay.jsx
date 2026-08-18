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
      const resp = await fetch('/api/admin/verify-token', {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1c23] border border-blue-900/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m3.332-8A4.499 4.499 0 1115.67 7H9.33a4.499 4.499 0 112.338 8.057l1.232 3.696a1 1 0 001.914 0l1.232-3.696A4.499 4.499 0 0115.332 7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
          <p className="text-gray-400">
            Please enter your access token to use CamTech AI features. 
            Contact your administrator if you don't have one.
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-xl text-center animate-pulse">
            Token Verified! Accessing system...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="CAM-XXXX-XXXX"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                className="w-full bg-[#0d0e12] border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase font-mono tracking-widest"
                disabled={loading}
              />
              {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Verify Access'}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full bg-transparent hover:bg-white/5 text-gray-400 py-2 rounded-xl text-sm transition-all"
            >
              Logout and use another account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
