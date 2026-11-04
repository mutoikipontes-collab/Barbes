import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { addDays, dayStartIso, formatTime, monthStart, todayIn, formatDay, dayOf } from '@/lib/time'
import { Alert, Spinner } from '@/components/ui'
import { usePanel } from './context'
import { useServices, useShopHours, useStaff, useStaffServices } from './queries'
import { Card, SectionTitle } from './ui'

export function DashboardPage() {
  const { shop } = usePanel()
  const tz = shop.timezone
  const today = todayIn(tz)
  const services = useServices()
  const staff = useStaff()
  const hours = useShopHours()
  const links = useStaffServices()

  const data = useQuery({
    queryKey: ['panel', shop.id, 'dashboard', today],
    queryFn: async () => {
      const from = dayStartIso(addDays(today, -30) < monthStart(today) ? addDays(today, -30) : monthStart(today), tz)
      const to = dayStartIso(addDays(today, 8), tz)
      const a = await supabase.from('appointments').select('*').eq('shop_id', shop.id).gte('starts_at', from).lt('starts_at', to)
      if (a.error) throw a.error
      const c = await supabase.from('customers').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id)
      if (c.error) throw c.error
      const ids = [...new Set(a.data.map((x) => x.customer_id))]
      const names = new Map<string, string>()
      if (ids.length) {
        const n = await supabase.from('customers').select('id,name').in('id', ids)
        if (n.error) throw n.error
        n.data.forEach((x) => names.set(x.id, x.name))
      }
      return { appts: a.data, customers: c.count ?? 0, names }
    },
  })

  // Lista do que falta para abrir os agendamentos online.
  const bookableStaff = (staff.data ?? []).filter((s) => s.active && s.bookable)
  const checklist = [
    { ok: (services.data ?? []).some((s) => s.active), label: 'Cadastrar pelo menos um serviço', to: 'servicos' },
    { ok: bookableStaff.length > 0, label: 'Ter um barbeiro que atende, com expediente', to: 'equipe' },
    { ok: (links.data ?? []).length > 0, label: 'Ligar os serviços aos barbeiros', to: 'equipe' },
  ]
  const ready = checklist.every((c) => c.ok)

  const now = Date.now()
  const t = (iso: string) => Date.parse(iso)
  const todayStart = t(dayStartIso(today, tz))
  const tomorrowStart = t(dayStartIso(addDays(today, 1), tz))
  const monthStartMs = t(dayStartIso(monthStart(today), tz))
  const appts = data.data?.appts ?? []
  const live = appts.filter((a) => a.status !== 'cancelled')
  const todays = live.filter((a) => t(a.starts_at) >= todayStart && t(a.starts_at) < tomorrowStart)
  const upcoming = live.filter((a) => (a.status === 'confirmed' || a.status === 'in_progress') && t(a.ends_at) > now).sort((a, b) => t(a.starts_at) - t(b.starts_at)).slice(0, 6)
  const monthAppts = live.filter((a) => t(a.starts_at) >= monthStartMs && a.status !== 'no_show')
  const monthDone = monthAppts.filter((a) => a.status === 'completed').reduce((s, a) => s + a.price_cents, 0)
  const monthExpected = monthAppts.reduce((s, a) => s + a.price_cents, 0)
  const last30 = live.filter((a) => t(a.starts_at) >= t(dayStartIso(addDays(today, -30), tz)) && t(a.starts_at) < tomorrowStart)
  const counts = new Map<string, number>()
  last30.forEach((a) => counts.set(a.service_id, (counts.get(a.service_id) ?? 0) + 1))
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topMax = top[0]?.[1] ?? 1
  const cancelled30 = appts.filter((a) => a.status === 'cancelled' && t(a.starts_at) >= t(dayStartIso(addDays(today, -30), tz))).length

  const stats = [
    { label: 'Atendimentos hoje', value: String(todays.length) },
    { label: 'Clientes', value: String(data.data?.customers ?? '—') },
    { label: 'Recebido no mês (concluídos)', value: formatBRL(monthDone) },
    { label: 'Previsto no mês', value: formatBRL(monthExpected) },
  ]

  return (
    <div className="space-y-10">
      <PlanSummary />
      {!ready ? (
        <Card className="border-gold-500/50">
          <h2 className="mb-2 text-2xl">Abra seus agendamentos online</h2>
          <p className="mb-3 text-ink-300">Falta pouco para sua página receber clientes. Faça nesta ordem:</p>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-3">
                <span aria-hidden="true" className={c.ok ? 'text-success' : 'text-ink-500'}>{c.ok ? '✓' : '○'}</span>
                {c.ok ? <span className="text-ink-300 line-through">{c.label}</span> : <Link to={c.to} className="text-gold-300 underline underline-offset-4">{c.label}</Link>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-300">
            {(hours.data ?? []).length > 0
              ? 'Horário de funcionamento cadastrado: os horários respeitam a abertura, o fechamento e o almoço.'
              : 'Opcional: cadastre o horário de funcionamento em Configurações (com pausa de almoço). Sem ele, vale o expediente de cada barbeiro.'}
          </p>
        </Card>
      ) : null}

      {data.isError ? <Alert tone="error">{friendlyError(data.error)}</Alert> : null}
      {data.isLoading ? (
        <Spinner />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xs border border-ink-700 p-4">
                <dt className="text-xs tracking-[0.12em] text-ink-300 uppercase">{s.label}</dt>
                <dd className="mt-2 font-display text-2xl">{s.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <SectionTitle action={<Link to="agenda" className="text-sm text-gold-300 underline underline-offset-4">Abrir agenda</Link>}>Próximos horários</SectionTitle>
            {upcoming.length === 0 ? (
              <p className="text-ink-300">Nenhum atendimento marcado para os próximos dias.</p>
            ) : (
              <ul className="border-b border-ink-700">
                {upcoming.map((a) => {
                  const d = dayOf(a.starts_at, tz)
                  return (
                    <li key={a.id} className="flex flex-wrap justify-between gap-2 border-t border-ink-700 py-3">
                      <span>
                        <b className="font-medium">{d === today ? 'Hoje' : d === addDays(today, 1) ? 'Amanhã' : formatDay(d)} às {formatTime(a.starts_at, tz)}</b>
                        <small className="block text-ink-300">
                          {data.data?.names.get(a.customer_id) ?? 'Cliente'} · {services.data?.find((s) => s.id === a.service_id)?.name} · {staff.data?.find((s) => s.id === a.staff_id)?.display_name}
                        </small>
                      </span>
                      <span className="font-display text-gold-300">{formatBRL(a.price_cents)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Serviços mais procurados</SectionTitle>
            <p className="-mt-2 mb-4 text-sm text-ink-300">
              Últimos 30 dias · {last30.length} agendamento{last30.length === 1 ? '' : 's'} · {cancelled30} cancelado{cancelled30 === 1 ? '' : 's'}
            </p>
            {top.length === 0 ? (
              <p className="text-ink-300">Ainda sem dados suficientes.</p>
            ) : (
              <ul className="space-y-3">
                {top.map(([id, n]) => (
                  <li key={id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{services.data?.find((s) => s.id === id)?.name ?? 'Serviço'}</span>
                      <span className="text-ink-300">{n}</span>
                    </div>
                    <div className="h-2 rounded-xs bg-ink-800">
                      <div className="h-2 rounded-xs bg-gold-500" style={{ width: `${(n / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

/** Resumo do plano no início do painel, com o caminho para assinar ou trocar. */
function PlanSummary() {
  const { shop } = usePanel()
  const billing = useQuery({
    queryKey: ['panel', shop.id, 'billing'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shop_billing', { p_shop_id: shop.id })
      if (error) throw error
      return data as unknown as { status: string; plan: string; price_cents: number; requested_plan: string | null; requested_price_cents: number | null } | null
    },
  })
  const b = billing.data
  if (!b) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs border border-gold-500/50 bg-ink-900 px-4 py-3">
      <p>
        Seu plano: <b>{b.plan}</b> <span className="text-ink-300">({formatBRL(b.price_cents)}/mês{b.status === 'trialing' ? ', em teste grátis' : ''})</span>
        {b.requested_plan ? (
          <span className="block text-sm text-gold-300">
            Você escolheu o {b.requested_plan} ({formatBRL(b.requested_price_cents ?? 0)}/mês): falta pagar o Pix.
          </span>
        ) : null}
      </p>
      <Link to="plano" className="btn-gold inline-flex min-h-11 items-center rounded-xs px-4 font-semibold">
        {b.requested_plan ? 'Pagar plano' : 'Assinar ou trocar plano'}
      </Link>
    </div>
  )
}
