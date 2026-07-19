import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthStatus = 'loading' | 'signed-out' | 'checking-admin' | 'admin' | 'denied' | 'error'

interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  deniedEmail: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  retryCheck: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null)

  // Evita que duas checagens concorrentes (getSession + onAuthStateChange
  // disparando quase juntos, comum logo após o redirect do OAuth) apliquem
  // resultados fora de ordem — só o resultado da checagem mais recente conta.
  const requestId = useRef(0)

  async function checkAdminAndSet(nextSession: Session | null) {
    const myRequestId = ++requestId.current

    if (!nextSession) {
      if (myRequestId !== requestId.current) return
      setSession(null)
      setStatus('signed-out')
      return
    }

    setStatus('checking-admin')

    // A allowlist de verdade é a RLS no banco — esta chamada é só pra
    // decidir o que mostrar na tela (não é a barreira de segurança).
    // Tenta 2x: um erro passageiro de rede/API não pode ser tratado como
    // "acesso negado" e derrubar a sessão do usuário.
    let data: boolean | null = null
    let error: unknown = null

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await supabase.rpc('is_admin')
      data = res.data
      error = res.error
      if (!error) break
      await sleep(600)
    }

    if (myRequestId !== requestId.current) return // uma checagem mais nova já assumiu

    if (error) {
      // Erro de verdade (rede, API fora do ar, etc) — mantém a sessão e
      // deixa a pessoa tentar de novo, em vez de deslogar por engano.
      setStatus('error')
      return
    }

    if (!data) {
      // Chamada funcionou, resposta é clara: esse e-mail não está na
      // allowlist. Aí sim faz sentido encerrar a sessão.
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

  // Login nativo por link mágico (sem senha) — alternativa ao Google que
  // não depende da lista de "test users" do Google Cloud (o app OAuth
  // ainda está em modo Testing). A barreira de segurança real continua
  // sendo is_admin()/RLS: isso só troca COMO a pessoa prova quem é, não
  // muda quem tem acesso depois de provar.
  async function signInWithEmail(email: string) {
    setDeniedEmail(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error ? error.message : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setStatus('signed-out')
  }

  function retryCheck() {
    supabase.auth.getSession().then(({ data }) => checkAdminAndSet(data.session))
  }

  return (
    <AuthContext.Provider
      value={{ status, session, deniedEmail, signInWithGoogle, signInWithEmail, signOut, retryCheck }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
