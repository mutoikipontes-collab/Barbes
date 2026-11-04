import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  // true quando o usuário chegou pelo link de "esqueci a senha"
  recovering: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    let currentUser: string | null = null
    supabase.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user.id ?? null
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // Trocou de pessoa (saiu, ou entrou outra conta no mesmo aparelho): apaga tudo que estava em memória,
      // para os dados de uma conta nunca aparecerem para outra.
      const nextUser = next?.user.id ?? null
      if (nextUser !== currentUser) {
        queryClient.clear()
        currentUser = nextUser
      }
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') setRecovering(false)
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ session, loading, recovering, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
