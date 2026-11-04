import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { formatBRL } from '@/lib/format'

export type Tier = 'basico' | 'plus' | 'premium'
export type Plan = { tier: Tier; name: string; price_cents: number; features: string[] }

const TIER_OF: Record<string, Tier> = { essencial: 'basico', plus: 'plus', premium: 'premium' }
export const POSITION: Record<Tier, string> = {
  premium: 'Aparece em 1º lugar na busca da cidade',
  plus: 'Aparece em 2º, antes das barbearias Básicas',
  basico: 'Aparece na busca da cidade',
}

/** Planos ativos, do mais barato ao mais caro (vêm do banco: preço e itens reais). */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('code, name, price_cents, features').eq('active', true).order('price_cents')
      if (error) throw error
      return (data ?? [])
        .filter((p) => TIER_OF[p.code])
        .map((p) => ({ tier: TIER_OF[p.code], name: p.name, price_cents: p.price_cents, features: Array.isArray(p.features) ? (p.features as string[]) : [] }))
    },
  })
}

export function PlanCard({ plan, highlight, badge, children }: { plan: Plan; highlight?: boolean; badge?: string; children?: ReactNode }) {
  return (
    <article className={`relative flex flex-col rounded-xs border bg-ink-900 p-5 ${highlight ? 'border-gold-500' : 'border-ink-700'}`}>
      {badge ? <span className="absolute -top-3 left-5 rounded-xs bg-gold-500 px-2 py-0.5 text-xs font-semibold tracking-wide text-ink-950 uppercase">{badge}</span> : null}
      <h3 className="font-display text-2xl">{plan.name}</h3>
      <p className="mt-2">
        <span className="font-display text-3xl text-gold-300">{formatBRL(plan.price_cents)}</span>
        <span className="text-ink-300">/mês</span>
      </p>
      <p className="mt-3 text-sm font-semibold text-ink-100">{POSITION[plan.tier]}</p>
      <ul className="mt-3 flex-1 space-y-1.5 text-sm text-ink-300">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden="true" className="text-gold-300">✓</span>
            {f}
          </li>
        ))}
      </ul>
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  )
}
