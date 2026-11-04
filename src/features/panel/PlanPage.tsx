import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL, whatsappLink } from '@/lib/format'
import { Alert, Spinner } from '@/components/ui'
import { PlanCard, usePlans, type Tier } from '@/features/plans/plans'
import { usePanel } from './context'
import { SectionTitle } from './ui'

type Billing = {
  status: string
  plan: string
  price_cents: number
  tier: Tier
  requested_tier: Tier | null
  requested_plan: string | null
  requested_price_cents: number | null
  pix_key: string | null
  pix_holder: string | null
  pix_code: string | null
  support_whatsapp: string | null
}

/** Aba Plano (só o dono): ver o plano atual e escolher outro. A troca vale depois do pagamento. */
export function PlanPage() {
  const { shop } = usePanel()
  const queryClient = useQueryClient()
  const plans = usePlans()
  const [copied, setCopied] = useState(false)
  const [params, setParams] = useSearchParams()
  const payRef = useRef<HTMLDivElement>(null)
  const billing = useQuery({
    queryKey: ['panel', shop.id, 'billing'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shop_billing', { p_shop_id: shop.id })
      if (error) throw error
      return data as unknown as Billing | null
    },
  })
  const choose = useMutation({
    mutationFn: async (tier: Tier) => {
      const { error } = await supabase.rpc('request_plan', { p_shop_id: shop.id, p_tier: tier })
      if (error) throw error
    },
    onSuccess: async () => {
      setCopied(false)
      await queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'billing'] })
      // leva direto para o Pix do plano escolhido
      payRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  })

  // veio da página Planos com "Assinar X": já escolhe esse plano
  const wanted = params.get('escolher')
  const loaded = !!billing.data
  useEffect(() => {
    if (!loaded || !wanted) return
    setParams({}, { replace: true })
    if (wanted === 'basico' || wanted === 'plus' || wanted === 'premium') choose.mutate(wanted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, wanted])

  if (billing.isLoading || plans.isLoading) return <Spinner />
  if (billing.isError || !billing.data) return <Alert tone="error">{billing.isError ? friendlyError(billing.error) : 'Plano não encontrado.'}</Alert>
  if (plans.isError) return <Alert tone="error">{friendlyError(plans.error)}</Alert>
  const b = billing.data
  const payTier = b.requested_tier ?? b.tier
  const payPrice = b.requested_price_cents ?? b.price_cents
  const payName = b.requested_plan ?? b.plan

  return (
    <section>
      <SectionTitle>Plano</SectionTitle>
      <p className="-mt-2 mb-6 text-ink-300">
        Plano atual: <b className="text-ink-100">{b.plan}</b> ({formatBRL(b.price_cents)}/mês)
        {b.status === 'trialing' ? ' · em período de teste grátis' : ''}.
      </p>

      {choose.isError ? <div className="mb-4"><Alert tone="error">{friendlyError(choose.error)}</Alert></div> : null}
      {b.requested_tier ? (
        <div className="mb-6">
          <Alert tone="info">
            Você escolheu o plano <b>{b.requested_plan}</b> ({formatBRL(b.requested_price_cents ?? 0)}/mês). Ele passa a valer assim que o pagamento for confirmado.
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        {(plans.data ?? []).map((p) => {
          const current = p.tier === b.tier
          const requested = p.tier === b.requested_tier
          return (
            <PlanCard key={p.tier} plan={p} highlight={requested || (current && !b.requested_tier)} badge={current ? 'Plano atual' : requested ? 'Escolhido' : undefined}>
              {current && !b.requested_tier ? (
                <p className="text-sm text-ink-300">Este é o seu plano.</p>
              ) : requested ? (
                <p className="text-sm text-gold-300">Aguardando pagamento.</p>
              ) : (
                <button
                  type="button"
                  disabled={choose.isPending}
                  onClick={() => choose.mutate(p.tier)}
                  className={`${current ? 'border border-ink-700 hover:border-gold-500' : 'btn-gold'} inline-flex min-h-11 w-full items-center justify-center rounded-xs px-4 font-semibold disabled:opacity-60`}
                >
                  {current ? 'Continuar no plano atual' : `Escolher ${p.name}`}
                </button>
              )}
            </PlanCard>
          )
        })}
      </div>

      <div ref={payRef} className="mt-8 scroll-mt-28 rounded-xs border border-ink-700 bg-ink-900 p-4">
        <h3 className="font-display text-xl">Como pagar</h3>
        <p className="mt-2 text-sm text-ink-300">
          Plano {payName}: <b className="text-ink-100">{formatBRL(payPrice)}/mês</b>, por Pix. Depois de pagar, envie o comprovante; a liberação é feita em seguida.
        </p>
        {b.pix_code ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-ink-300">Pix copia e cola do plano {payName} (o valor já vem preenchido):</p>
            <p className="max-h-20 overflow-auto rounded-xs bg-ink-950 px-3 py-2 font-mono text-xs break-all select-all">{b.pix_code}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(b.pix_code!)
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
              className="btn-gold inline-flex min-h-11 w-full items-center justify-center rounded-xs px-4 font-semibold sm:w-auto"
            >
              {copied ? 'Código copiado ✓ Cole no app do banco' : 'Copiar Pix copia e cola'}
            </button>
          </div>
        ) : b.pix_key ? (
          <p className="mt-3 text-sm">
            Chave Pix: <span className="font-mono break-all select-all">{b.pix_key}</span>
            {b.pix_holder ? ` · Titular: ${b.pix_holder}` : ''}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-300">Os dados de pagamento ainda não foram informados pelo BARBER OS.</p>
        )}
        {b.support_whatsapp ? (
          <a
            href={whatsappLink(b.support_whatsapp, `Olá! Paguei o plano ${payName} (${formatBRL(payPrice)}) do BARBER OS da barbearia ${shop.name}. Segue o comprovante.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center rounded-xs border border-ink-700 px-4 font-semibold hover:border-gold-500"
          >
            Enviar comprovante no WhatsApp
          </a>
        ) : null}
        <p className="mt-3 text-xs text-ink-500">Plano escolhido: {payTier === 'premium' ? 'Premium' : payTier === 'plus' ? 'Plus' : 'Básico'}.</p>
      </div>
    </section>
  )
}
