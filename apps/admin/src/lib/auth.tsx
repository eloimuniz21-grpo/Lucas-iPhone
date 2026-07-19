import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthStatus = 'loading' | 'signed-out' | 'checking-admin' | 'admin' | 'denied'

interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  deniedEmail: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null)

  async function checkAdminAndSet(nextSession: Session | null) {
    if (!nextSession) {
      setSession(null)
      setStatus('signed-out')
      return
    }

    setStatus('checking-admin')

    // A allowlist de verdade é a RLS no banco — esta chamada é só pra
    // decidir o que mostrar na tela (não é a barreira de segurança).
    const { data, error } = await supabase.rpc('is_admin')

    if (error || !data) {
      // Autenticado no Google, mas não está na tabela public.admins.
      // Desloga imediatamente: não faz sentido manter uma sessão "presa"
      // sem acesso a nada.
      setDeniedEmail(nextSession.user.email ?? null)
      await supabase.auth.signOut()
      setSession(null)
      setStatus('denied')
      return
    }

    setSession(nextSession)
    setStatus('admin')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      checkAdminAndSet(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      checkAdminAndSet(nextSession)
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signInWithGoogle() {
    setDeniedEmail(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setStatus('signed-out')
  }

  return (
    <AuthContext.Provider value={{ status, session, deniedEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
