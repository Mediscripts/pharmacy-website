import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './authContext'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const syncSession = async (session) => {
    if (!session?.user) {
      setUser(null)
      setSession(null)
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to load profile', error)
      setUser({ id: session.user.id, email: session.user.email ?? '', role: 'customer' })
      return
    }

    setUser({
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: profile?.full_name ?? '',
      role: profile?.role ?? 'customer',
    })
    setSession(session)
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) {
        return
      }

      await syncSession(data.session)
      if (isMounted) {
        setLoading(false)
      }
    }

    initialize()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncSession(session)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { success: false, message: error.message }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      await supabase.auth.signOut()
      return { success: false, message: 'Unable to load your admin profile.' }
    }

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setUser(null)
      return { success: false, message: 'This account is not an admin account.' }
    }

    setUser({
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: profile?.full_name ?? '',
      role: profile?.role ?? 'customer',
    })
    setSession(data.session || null)

    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      login,
      logout,
      accessToken: session?.access_token ?? '',
      isAdmin: Boolean(user && user.role === 'admin'),
    }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
