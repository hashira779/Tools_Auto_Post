import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
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
      if (session) {
          fetchDbUser(session.access_token)
      } else {
        setDbUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchDbUser = async (token) => {
    try {
      const resp = await fetch('/api/ai/conversations', { 
          headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resp.status === 403) {
          const data = await resp.json()
          setDbUser({ is_verified: false, error: data.detail })
      } else if (resp.status === 401) {
          // Token is invalid/expired - clear local db user state, don't spam errors
          setDbUser(null)
          console.warn("Auth token expired or invalid (401)")
      } else if (resp.ok) {
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

  // Updated refreshDbUser to be async and await the fetch
  const refreshDbUser = async () => {
    if (session?.access_token) {
      setLoading(true)
      await fetchDbUser(session.access_token)
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ session, user, dbUser, loading, loginWithGoogle, logout, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
