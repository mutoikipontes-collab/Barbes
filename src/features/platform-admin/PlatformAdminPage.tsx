import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError, functionErrorMessage } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { Alert, Button, Field, Spinner, Wordmark } from '@/components/ui'
import type { Enums } from '@/types/database'

type SubStatus = Enums<'subscription_status'>

type AdminShop = {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  owner: { name: string; email: string | null } | null
  subscription: { status: SubStatus; plan: string; price_cents: number }
  counts: { staff: number; customers: number; appointments_30d: number }
}

type Overview = {
  shops_total: number
  mrr_cents: number
  users_total: number
  customers_total: number
  appointments_30d: number
  shops_by_status: Partial<Record<SubStatus, number>>
}

const STATUS_OPTIONS: { value: SubStatus; label: string }[] = [
  { value: 'trialing', label: 'Em teste' },
  { value: 'active', label: 'Ativa' },
  { value: 'past_due', label: 'Pagamento pendente' },
  { value: 'suspended', label: 'Suspensa' },
  { value: 'cancelled', label: 'Cancelada' },
]

export function PlatformAdminPage() {
  const queryClient = useQueryClient()
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_platform_overview')
      if (error) throw error
      return data as unknown as Overview
    },
  })
  const shops = useQuery({
    queryKey: ['admin-shops'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_shops')
      if (error) throw error
      return (data ?? []) as unknown as AdminShop[]
    },
  })
  const update = useMutation({
    mutationFn: async ({ shopId, status }: { shopId: string; status: SubStatus }) => {
      const { error } = await supabase.rpc('admin_update_subscription', { p_shop_id: shopId, p_status: status })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
  })

  const stats = overview.data
    ? [
        { label: 'Barbearias', value: String(overview.data.shops_total) },
        { label: 'Receita mensal (ativas)', value: formatBRL(overview.data.mrr_cents) },
        { label: 'Usuários', value: String(overview.data.users_total) },
        { label: 'Agendamentos em 30 dias', value: String(overview.data.appointments_30d) },
      ]
    : []

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Wordmark />
        <Link to="/conta" className="text-sm text-ink-300">Minha conta</Link>
      </header>
      <h1 className="mt-10 font-display text-4xl font-semibold">Administração</h1>

      {overview.isError ? <div className="mt-6"><Alert tone="error">{friendlyError(overview.error)}</Alert></div> : null}
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xs border border-ink-800 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink-500">{s.label}</dt>
            <dd className="mt-2 font-display text-2xl text-ink-100">{s.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">Barbearias</h2>
      {update.isError ? <div className="mt-4"><Alert tone="error">{friendlyError(update.error)}</Alert></div> : null}
      {shops.isLoading ? (
        <div className="mt-4"><Spinner /></div>
      ) : shops.isError ? (
        <div className="mt-4"><Alert tone="error">{friendlyError(shops.error)}</Alert></div>
      ) : (
        <ul className="mt-4 divide-y divide-ink-800 rounded-xs border border-ink-800">
          {shops.data?.map((s) => (
            <li key={s.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold">
                  {s.name} <span className="text-sm font-normal text-ink-500">/{s.slug}</span>
                </p>
                <p className="text-sm text-ink-500">
                  {s.owner?.email ?? 'sem proprietário com login'} · {s.counts.staff} na equipe · {s.counts.customers} clientes ·{' '}
                  {s.counts.appointments_30d} agendamentos em 30 dias
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Situação da assinatura de {s.name}</span>
                <select
                  value={s.subscription.status}
                  disabled={update.isPending}
                  onChange={(e) => {
                    const status = e.target.value as SubStatus
                    if ((status === 'suspended' || status === 'cancelled') && !window.confirm(`${status === 'suspended' ? 'Suspender' : 'Cancelar'} ${s.name}? A página de agendamento sai do ar na hora.`)) return
                    update.mutate({ shopId: s.id, status })
                  }}
                  className="min-h-11 rounded-xs border border-ink-700 bg-ink-900 px-3 text-ink-100"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
      <TempPassword />
    </main>
  )
}

function TempPassword() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ email: string; password: string } | null>(null)
  const reset = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-set-password', { body: { email } })
      if (error) throw new Error(await functionErrorMessage(error))
      return { email, password: (data as { password: string }).password }
    },
    onSuccess: setResult,
  })
  return (
    <section className="mt-12">
      <h2 className="font-sans text-sm font-semibold tracking-[0.16em] text-ink-500 uppercase">Recuperar acesso de um usuário</h2>
      <p className="mt-2 text-sm text-ink-300">Gera uma senha temporária. Envie para a pessoa e peça que ela troque em Minha conta → Trocar senha.</p>
      <form
        className="mt-4 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setResult(null)
          reset.mutate()
        }}
      >
        {reset.isError ? <Alert tone="error">{reset.error instanceof Error ? reset.error.message : 'Erro.'}</Alert> : null}
        {result ? (
          <Alert tone="success">
            Nova senha de {result.email}: <b className="font-mono text-base text-ink-100 select-all">{result.password}</b>
          </Alert>
        ) : null}
        <Field label="E-mail da conta" name="tp-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="max-w-xs">
          <Button type="submit" loading={reset.isPending} disabled={!email.trim()}>Gerar senha temporária</Button>
        </div>
      </form>
    </section>
  )
}
