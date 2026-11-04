import { Link } from 'react-router'
import { Wordmark } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'

// Entrada provisória. A landing page comercial completa é da Fase 3.
export function HomePage() {
  const { session } = useAuth()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16 text-center">
      <Wordmark />
      <p className="mt-6 font-display text-3xl leading-tight text-ink-100">Agenda e gestão para barbearias.</p>
      <div className="mt-10 grid gap-3">
        {session ? (
          <Link to="/conta" className="inline-flex min-h-12 items-center justify-center rounded-xs btn-gold font-semibold">
            Ir para minha conta
          </Link>
        ) : (
          <>
            <Link to="/cadastro" className="inline-flex min-h-12 items-center justify-center rounded-xs btn-gold font-semibold">
              Criar conta
            </Link>
            <Link to="/entrar" className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold">
              Entrar
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
