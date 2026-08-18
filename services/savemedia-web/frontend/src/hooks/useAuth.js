import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) fetchDbUser(session.access_token)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) fetchDbUser(session.access_token)
      else {
        setDbUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchDbUser = async (token) => {
    try {
      const resp = await fetch('/api/conversations', { // Simple GET to check if user exists and get their status
          headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resp.status === 403) {
          // Might be "Verification Required"
          const data = await resp.json()
          setDbUser({ is_verified: false, error: data.detail })
      } else if (resp.ok) {
          // For now, let's add a dedicated /api/auth/me endpoint later, 
          // but we can infer verified = true if this succeeds
          setDbUser({ is_verified: true })
      }
    } catch (e) {
      console.error("Fetch DB User error:", e)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error("Login error:", error.message)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error("Logout error:", error.message)
  }

  return { session, user, dbUser, loading, loginWithGoogle, logout, refreshDbUser: () => session && fetchDbUser(session.access_token) }
}
