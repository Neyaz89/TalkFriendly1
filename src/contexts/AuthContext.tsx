'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username?: string, fullName?: string, profession?: string, dateOfBirth?: string, ageConfirmed?: boolean) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    // Wait a moment for cookies to be set
    await new Promise(resolve => setTimeout(resolve, 100))

    router.push('/dashboard')
    router.refresh()
  }

  const signUp = async (email: string, password: string, username?: string, fullName?: string, profession?: string, dateOfBirth?: string, ageConfirmed?: boolean) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        data: {
          username: username || email.split('@')[0],
          full_name: fullName || '',
          profession: profession || '',
          date_of_birth: dateOfBirth || null,
          age_confirmed: ageConfirmed || false,
        },
      },
    })

    if (error) {
      throw error
    }

    // Create profile record (will only work after email confirmation)
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username || email.split('@')[0],
        full_name: fullName || '',
        email: email,
        profession: profession || '',
        date_of_birth: dateOfBirth || null,
        age_confirmed: ageConfirmed || false,
      })
    }

    // Don't redirect - let the form show the email confirmation message
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    router.push('/auth/login')
    router.refresh()
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setUser(session?.user ?? null)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
