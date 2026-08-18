import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Authentication hook for the standalone admin console.
// Handles Supabase Google OAuth and resolves the local DB profile
// (including the is_admin / is_verified flags) via GET /api/auth/me.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (token) => {
    try {
      const resp = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        setProfile(await resp.json())
      } else {
        setProfile(null)
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.access_token)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setLoading(true)
        fetchProfile(session.access_token)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) console.error('Login error:', error.message)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout error:', error.message)
  }

  return {
    session,
    profile,
    loading,
    isAdmin: profile?.is_admin === true,
    loginWithGoogle,
    logout,
  }
}
