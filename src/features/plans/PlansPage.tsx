import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useMyShops } from '@/features/auth/queries'
import { Alert, Spinner, Wordmark } from '@/components/ui'
import { friendlyError } from '@/lib/errors'
import { PlanCard, usePlans, type Tier } from './plans'

/** Planos para barbearias: Básico, Plus e Premium. */
export function PlansPage() {
  const plans = usePlans()
  const { session } = useAuth()
  const shops = useMyShops()
  const navigate = useNavigate()
  const owned = (shops.data ?? []).filter((s) => s.role === 'owner')
  const [picking, setPicking] = useState<Tier | null>(null)

  // Assinar: sem conta → cadastro; com uma barbearia → aba Plano dela; com várias → escolher qual
  const subscribe = (tier: Tier) => {
    if (!session) return navigate('/cadastro', { state: { from: '/conta?nova-barbearia=1' } })
    if (owned.length === 0) return navigate('/conta?nova-barbearia=1')
    if (owned.length === 1) return navigate(`/painel/${owned[0].id}/plano?escolher=${tier}`)
    setPicking(tier)
  }

  return (
    <main className="mx-auto w-full max-w-[68rem] px-5 py-10">
      <Link to="/" aria-label="Início"><Wordmark /></Link>
      <div className="gold-line mt-10 mb-6" />
      <h1 className="text-4xl">Planos para barbearias</h1>
      <p className="mt-3 max-w-[38rem] text-ink-300">
        Todos os planos têm agenda online, página de agendamento, equipe, serviços e clientes. A diferença é a posição da sua barbearia na busca da cidade. Os primeiros dias são de
        teste, sem cobrança. O pagamento é mensal, por Pix.
      </p>

      <div className="mt-10">
        {plans.isLoading ? (
          <Spinner />
        ) : plans.isError ? (
          <Alert tone="error">{friendlyError(plans.error)}</Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {(plans.data ?? []).map((p) => (
              <PlanCard key={p.tier} plan={p} highlight={p.tier === 'premium'} badge={p.tier === 'premium' ? 'Mais visibilidade' : undefined}>
                <button
                  type="button"
                  onClick={() => subscribe(p.tier)}
                  disabled={!!session && shops.isLoading}
                  className="btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-xs px-4 font-semibold disabled:opacity-60"
                >
                  Assinar {p.name}
                </button>
                {picking === p.tier ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-ink-300">Para qual barbearia?</p>
                    {owned.map((s) => (
                      <Link
                        key={s.id}
                        to={`/painel/${s.id}/plano?escolher=${p.tier}`}
                        className="flex min-h-11 items-center rounded-xs border border-ink-700 px-3 hover:border-gold-500"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </PlanCard>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/cadastro" state={{ from: '/conta?nova-barbearia=1' }} className="btn-gold inline-flex min-h-12 items-center rounded-xs px-6 font-semibold">
          Cadastrar minha barbearia
        </Link>
        <Link to="/para-barbearias" className="inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold hover:border-gold-500">
          Já tenho barbearia: entrar
        </Link>
      </div>
      <p className="mt-4 text-sm text-ink-300">Já tem barbearia cadastrada? Escolha ou troque o plano no painel, na aba Plano.</p>
    </main>
  )
}
