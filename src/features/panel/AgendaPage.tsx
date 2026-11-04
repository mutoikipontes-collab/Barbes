import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { addDays, dayStartIso, formatDay, formatTime, todayIn, weekdayOf, WEEKDAYS_SHORT, zonedToIso } from '@/lib/time'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import type { Enums, Tables } from '@/types/database'
import { usePanel } from './context'
import { useServices, useStaff } from './queries'
import { TimeInput } from './SettingsPage'
import { Card, Empty, Select, SectionTitle, SmallButton } from './ui'

type Status = Enums<'appointment_status'>
type Appointment = Tables<'appointments'>
type Customer = Pick<Tables<'customers'>, 'id' | 'name' | 'phone'>

const STATUS_LABEL: Record<Status, string> = {
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
}
const STATUS_STYLE: Record<Status, string> = {
  confirmed: 'text-gold-300',
  in_progress: 'text-success',
  completed: 'text-ink-300',
  cancelled: 'text-danger line-through',
  no_show: 'text-danger',
}

/** Segunda-feira da semana de uma data. */
function weekStart(ymd: string) {
  const wd = weekdayOf(ymd)
  return addDays(ymd, wd === 0 ? -6 : 1 - wd)
}

export function AgendaPage() {
  const { shop, role, staffId } = usePanel()
  const tz = shop.timezone
  const today = todayIn(tz)
  const [day, setDay] = useState(today)
  const [barber, setBarber] = useState<string>(role === 'owner' ? 'all' : staffId)
  const [panel, setPanel] = useState<'none' | 'block' | 'book'>('none')
  const staff = useStaff()
  const services = useServices()
  const queryClient = useQueryClient()

  const ws = weekStart(day)
  const weekFrom = dayStartIso(ws, tz)
  const weekTo = dayStartIso(addDays(ws, 7), tz)

  const appts = useQuery({
    queryKey: ['panel', shop.id, 'appointments', ws],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shop.id)
        .gte('starts_at', weekFrom)
        .lt('starts_at', weekTo)
        .order('starts_at')
      if (error) throw error
      const ids = [...new Set(data.map((a) => a.customer_id))]
      let customers: Customer[] = []
      if (ids.length) {
        const c = await supabase.from('customers').select('id,name,phone').in('id', ids)
        if (c.error) throw c.error
        customers = c.data
      }
      return { list: data, customers: new Map(customers.map((c) => [c.id, c])) }
    },
  })

  const blocks = useQuery({
    queryKey: ['panel', shop.id, 'blocks', ws],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('shop_id', shop.id)
        .lt('starts_at', weekTo)
        .gt('ends_at', weekFrom)
        .order('starts_at')
      if (error) throw error
      return data
    },
  })

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
      queryClient.invalidateQueries({ queryKey: ['available-days'] })
    },
  })

  const removeBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_blocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'blocks'] }),
  })

  const staffName = (id: string | null) => (id ? (staff.data?.find((s) => s.id === id)?.display_name ?? '—') : 'Toda a barbearia')
  const serviceName = (id: string) => services.data?.find((s) => s.id === id)?.name ?? 'Serviço'
  const visible = (a: Appointment) => barber === 'all' || a.staff_id === barber
  // Compara instantes (números), não textos: o banco e o navegador escrevem datas em formatos diferentes.
  const t = (iso: string) => Date.parse(iso)
  const dayStart = t(dayStartIso(day, tz))
  const dayEnd = t(dayStartIso(addDays(day, 1), tz))
  const ofDay = (a: { starts_at: string }, d: string) => t(a.starts_at) >= t(dayStartIso(d, tz)) && t(a.starts_at) < t(dayStartIso(addDays(d, 1), tz))

  const dayList = (appts.data?.list ?? []).filter((a) => visible(a) && ofDay(a, day))
  const dayBlocks = (blocks.data ?? []).filter(
    (b) => (barber === 'all' || b.staff_id === null || b.staff_id === barber) && t(b.starts_at) < dayEnd && t(b.ends_at) > dayStart,
  )
  const active = dayList.filter((a) => a.status !== 'cancelled')

  return (
    <section>
      <SectionTitle
        action={
          <div className="flex gap-2">
            <SmallButton onClick={() => setPanel(panel === 'block' ? 'none' : 'block')}>Bloquear horário</SmallButton>
            <SmallButton tone="gold" onClick={() => setPanel(panel === 'book' ? 'none' : 'book')}>Novo agendamento</SmallButton>
          </div>
        }
      >
        Agenda
      </SectionTitle>

      {panel === 'block' ? <BlockForm day={day} defaultStaff={barber === 'all' ? null : barber} onDone={() => setPanel('none')} /> : null}
      {panel === 'book' ? <ManualBookingForm day={day} defaultStaff={barber === 'all' ? null : barber} onDone={() => setPanel('none')} /> : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1">
          <SmallButton aria-label="Semana anterior" onClick={() => setDay(addDays(day, -7))}>‹</SmallButton>
          <SmallButton onClick={() => setDay(today)}>Hoje</SmallButton>
          <SmallButton aria-label="Próxima semana" onClick={() => setDay(addDays(day, 7))}>›</SmallButton>
        </div>
        {role === 'owner' ? (
          <div className="min-w-48">
            <Select label="Barbeiro" value={barber} onChange={(e) => setBarber(e.target.value)}>
              <option value="all">Todos</option>
              {(staff.data ?? [])
                .filter((s) => s.bookable)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
            </Select>
          </div>
        ) : null}
      </div>

      {/* Semana: um botão por dia com a quantidade de atendimentos */}
      <div className="mb-6 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(ws, i)
          const n = (appts.data?.list ?? []).filter((a) => visible(a) && a.status !== 'cancelled' && ofDay(a, d)).length
          return (
            <button
              key={d}
              type="button"
              aria-pressed={d === day}
              onClick={() => setDay(d)}
              className="flex min-h-16 flex-col items-center justify-center rounded-xs border border-ink-700 bg-ink-900 text-sm aria-pressed:border-gold-500 aria-pressed:bg-[#2a2518]"
            >
              <span className="text-ink-300">{WEEKDAYS_SHORT[weekdayOf(d)]}</span>
              <b className={`font-medium ${d === today ? 'text-gold-300' : ''}`}>{Number(d.slice(8))}</b>
              <span className="text-xs text-ink-300">{n || ''}</span>
            </button>
          )
        })}
      </div>

      <h3 className="mb-3 font-display text-xl">
        {formatDay(day)}
        <span className="ml-2 font-sans text-sm text-ink-300">
          {active.length} atendimento{active.length === 1 ? '' : 's'}
          {active.length ? ` · ${formatBRL(active.filter((a) => a.status !== 'no_show').reduce((s, a) => s + a.price_cents, 0))}` : ''}
        </span>
      </h3>

      {setStatus.isError ? <div className="mb-3"><Alert tone="error">{friendlyError(setStatus.error)}</Alert></div> : null}

      {dayBlocks.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {dayBlocks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xs border border-dashed border-ink-700 px-4 py-3 text-sm">
              <span>
                <b className="font-medium">Bloqueado</b> · {formatTime(b.starts_at, tz)}–{formatTime(b.ends_at, tz)}
                {t(b.ends_at) > dayEnd || t(b.starts_at) < dayStart ? ' (vários dias)' : ''} · {staffName(b.staff_id)}
                {b.reason ? ` · ${b.reason}` : ''}
              </span>
              <button type="button" className="min-h-10 text-gold-300 underline underline-offset-4" onClick={() => removeBlock.mutate(b.id)}>
                Desbloquear
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {appts.isLoading ? (
        <Spinner />
      ) : appts.isError ? (
        <Alert tone="error">{friendlyError(appts.error)}</Alert>
      ) : dayList.length === 0 ? (
        <Empty>Nenhum agendamento neste dia.</Empty>
      ) : (
        <ul className="space-y-2">
          {dayList.map((a) => {
            const c = appts.data?.customers.get(a.customer_id)
            const wa = c ? `https://wa.me/${c.phone.replace(/\D/g, '')}` : null
            return (
              <li key={a.id}>
                <Card className={a.status === 'cancelled' ? 'opacity-60' : ''}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <b className="font-display text-xl">{formatTime(a.starts_at, tz)}</b>
                      <span className="ml-2 text-sm text-ink-300">até {formatTime(a.ends_at, tz)}</span>
                      <p className="mt-1">
                        {c?.name ?? 'Cliente'} · {serviceName(a.service_id)}
                      </p>
                      <small className="text-ink-300">
                        {staffName(a.staff_id)} · {formatBRL(a.price_cents)} · {a.source === 'manual' ? 'marcado pela barbearia' : 'online'}
                        {wa ? (
                          <>
                            {' · '}
                            <a href={wa} target="_blank" rel="noreferrer" className="text-gold-300 underline underline-offset-2">WhatsApp</a>
                          </>
                        ) : null}
                      </small>
                      {a.customer_notes ? <p className="mt-1 text-sm text-ink-300">“{a.customer_notes}”</p> : null}
                    </div>
                    <span className={`text-sm font-semibold ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                  </div>
                  {a.status === 'confirmed' || a.status === 'in_progress' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.status === 'confirmed' ? (
                        <SmallButton disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: a.id, status: 'in_progress' })}>Iniciar</SmallButton>
                      ) : null}
                      <SmallButton tone="gold" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: a.id, status: 'completed' })}>Concluir</SmallButton>
                      {a.status === 'confirmed' && new Date(a.starts_at).getTime() <= Date.now() ? (
                        <SmallButton disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: a.id, status: 'no_show' })}>Faltou</SmallButton>
                      ) : null}
                      <SmallButton
                        tone="danger"
                        disabled={setStatus.isPending}
                        onClick={() => {
                          if (window.confirm('Cancelar este agendamento? O horário volta a ficar livre.')) setStatus.mutate({ id: a.id, status: 'cancelled' })
                        }}
                      >
                        Cancelar
                      </SmallButton>
                    </div>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function BlockForm({ day, defaultStaff, onDone }: { day: string; defaultStaff: string | null; onDone: () => void }) {
  const { shop, role, staffId } = usePanel()
  const staff = useStaff()
  const queryClient = useQueryClient()
  const [who, setWho] = useState<string>(role === 'owner' ? (defaultStaff ?? 'all') : staffId)
  const [fromDay, setFromDay] = useState(day)
  const [toDay, setToDay] = useState(day)
  const [allDay, setAllDay] = useState(false)
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('13:00')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      const startsAt = zonedToIso(fromDay, allDay ? '00:00' : start, shop.timezone)
      const endsAt = allDay ? zonedToIso(addDays(toDay, 1), '00:00', shop.timezone) : zonedToIso(toDay, end, shop.timezone)
      if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('O fim do bloqueio precisa ser depois do início.')
      const { error } = await supabase.from('time_blocks').insert({
        shop_id: shop.id,
        staff_id: who === 'all' ? null : who,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: reason.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'blocks'] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
      queryClient.invalidateQueries({ queryKey: ['available-days'] })
      onDone()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    if (toDay < fromDay) return setErr('A data final precisa ser igual ou depois da inicial.')
    save.mutate()
  }

  return (
    <Card className="mb-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <h3 className="font-display text-xl">Bloquear horário</h3>
        <p className="text-sm text-ink-300">Folgas, feriados, compromissos. Ninguém consegue agendar no período bloqueado. Agendamentos que já existem não são cancelados.</p>
        {err ? <Alert tone="error">{err}</Alert> : null}
        {save.isError ? <Alert tone="error">{save.error instanceof Error && !('code' in save.error) ? save.error.message : friendlyError(save.error)}</Alert> : null}
        {role === 'owner' ? (
          <Select label="Para quem" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="all">Toda a barbearia</option>
            {(staff.data ?? [])
              .filter((s) => s.bookable && s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.display_name}</option>
              ))}
          </Select>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="De" name="bl-from" type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
          <Field label="Até" name="bl-to" type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-5 accent-[#c8a04a]" />
          Dia inteiro
        </label>
        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Das" value={start} onChange={setStart} />
            <TimeInput label="Até as" value={end} onChange={setEnd} />
          </div>
        ) : null}
        <Field label="Motivo (opcional, só a equipe vê)" name="bl-reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-3">
          <div className="min-w-40"><Button type="submit" loading={save.isPending}>Bloquear</Button></div>
          <SmallButton onClick={onDone} className="min-h-12">Cancelar</SmallButton>
        </div>
      </form>
    </Card>
  )
}

function ManualBookingForm({ day, defaultStaff, onDone }: { day: string; defaultStaff: string | null; onDone: () => void }) {
  const { shop, role, staffId } = usePanel()
  const staff = useStaff()
  const services = useServices()
  const queryClient = useQueryClient()
  const bookable = (staff.data ?? []).filter((s) => s.bookable && s.active)
  const [who, setWho] = useState<string>(role === 'owner' ? (defaultStaff ?? bookable[0]?.id ?? '') : staffId)
  const [serviceId, setServiceId] = useState<string>(services.data?.find((s) => s.active)?.id ?? '')
  const [date, setDate] = useState(day)
  const [time, setTime] = useState('09:00')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('staff_create_booking', {
        p_shop_id: shop.id,
        p_staff_id: who,
        p_service_id: serviceId,
        p_starts_at: zonedToIso(date, time, shop.timezone),
        p_customer_name: name,
        p_customer_phone: phone,
        p_notes: notes.trim() || undefined,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id] })
      queryClient.invalidateQueries({ queryKey: ['available-slots'] })
      queryClient.invalidateQueries({ queryKey: ['available-days'] })
      onDone()
    },
  })

  return (
    <Card className="mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="space-y-4"
        noValidate
      >
        <h3 className="font-display text-xl">Novo agendamento</h3>
        <p className="text-sm text-ink-300">Para clientes que marcam por telefone ou no balcão. O horário precisa estar livre e dentro do expediente.</p>
        {save.isError ? <Alert tone="error">{friendlyError(save.error)}</Alert> : null}
        <Select label="Serviço" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {(services.data ?? [])
            .filter((s) => s.active)
            .map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.duration_min} min · {formatBRL(s.price_cents)}</option>
            ))}
        </Select>
        {role === 'owner' ? (
          <Select label="Barbeiro" value={who} onChange={(e) => setWho(e.target.value)}>
            {bookable.map((s) => (
              <option key={s.id} value={s.id}>{s.display_name}</option>
            ))}
          </Select>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" name="mb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <TimeInput label="Horário" value={time} onChange={setTime} />
        </div>
        <Field label="Nome do cliente" name="mb-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Celular com DDD" name="mb-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(99) 91234-5678" />
        <Field label="Observações (opcional)" name="mb-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-3">
          <div className="min-w-40">
            <Button type="submit" loading={save.isPending} disabled={!serviceId || !who}>Agendar</Button>
          </div>
          <SmallButton onClick={onDone} className="min-h-12">Cancelar</SmallButton>
        </div>
      </form>
    </Card>
  )
}
