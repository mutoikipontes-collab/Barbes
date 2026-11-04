import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL, whatsappLink } from '@/lib/format'
import {
  addDays,
  addMonths,
  daysInMonth,
  formatDay,
  formatMonth,
  formatTime,
  monthStart,
  todayIn,
  weekdayOf,
  WEEKDAYS_SHORT,
} from '@/lib/time'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/features/auth/queries'
import { Spinner } from '@/components/ui'
import type { PendingBooking, PublicShop } from './types'

const TITLES = [
  'Escolha o serviço',
  'Escolha o barbeiro',
  'Escolha a data',
  'Escolha o horário',
  'Seus dados',
  'Confirme o agendamento',
  'Agendamento confirmado',
]

export const pendingKey = (slug: string) => `barberos.pending.${slug}`

export type BookingStart = { serviceId?: string; staffId?: string | null; pending?: PendingBooking }

type State = {
  step: number
  serviceId: string | null
  // undefined = ainda não escolheu; null = sem preferência
  staffId: string | null | undefined
  date: string | null
  startsAt: string | null
  month: string
}

function initialState(shop: PublicShop, start: BookingStart): State {
  const today = todayIn(shop.timezone)
  if (start.pending) {
    const p = start.pending
    return { step: 5, serviceId: p.serviceId, staffId: p.staffId, date: p.date, startsAt: p.startsAt, month: monthStart(p.date) }
  }
  const serviceId = start.serviceId ?? null
  const staffId = start.staffId
  const step = !serviceId ? 1 : staffId === undefined ? 2 : 3
  return { step, serviceId, staffId, date: null, startsAt: null, month: monthStart(today) }
}

export function BookingDialog({ shop, start, onClose }: { shop: PublicShop; start: BookingStart; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [st, setSt] = useState<State>(() => initialState(shop, start))
  const [stepError, setStepError] = useState<string | null>(null)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [st.step])

  const service = shop.services.find((s) => s.id === st.serviceId) ?? null
  const staff = st.staffId ? (shop.staff.find((b) => b.id === st.staffId) ?? null) : null
  const go = (patch: Partial<State>) => {
    setStepError(null)
    setSt((s) => ({ ...s, ...patch }))
  }

  const context = [service?.name, st.staffId === null ? 'qualquer barbeiro' : staff?.display_name].filter(Boolean).join(' com ')

  return (
    <dialog
      ref={ref}
      aria-labelledby="booking-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      className="rise m-auto h-dvh max-h-dvh w-full max-w-full overflow-hidden border-0 bg-ink-900 p-0 text-ink-100 shadow-[0_30px_80px_rgba(0,0,0,0.7)] sm:h-[min(100dvh,46rem)] sm:w-[min(100%,34rem)] sm:border sm:border-ink-700"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between py-2 pr-2 pl-5 text-sm text-ink-300">
          <span>{st.step < 7 ? `Etapa ${Math.min(st.step, 6)} de 6` : 'Concluído'}</span>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="grid size-11 place-items-center text-xl">
            ✕
          </button>
        </div>
        <div className="h-[3px] bg-ink-700" aria-hidden="true">
          <i className="block h-full bg-gold-500 transition-[width] duration-300" style={{ width: `${(Math.min(st.step, 6) / 6) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-auto px-5 py-6">
          <h2 id="booking-title" ref={titleRef} tabIndex={-1} className="mb-4 text-[1.8rem] outline-none">
            {TITLES[st.step - 1]}
          </h2>
          {st.step > 1 && st.step < 7 && context ? <p className="-mt-2 mb-4 text-sm text-ink-300">{context}</p> : null}
          {stepError ? (
            <p role="alert" className="mb-4 text-sm text-danger">
              {stepError}
            </p>
          ) : null}

          {st.step === 1 && (
            <OptionList>
              {shop.services
                .filter((s) => !staff || staff.service_ids.includes(s.id))
                .map((s) => (
                <Option key={s.id} pressed={st.serviceId === s.id} onClick={() => go({ serviceId: s.id, date: null, startsAt: null, step: st.staffId === undefined ? 2 : 3 })}>
                  <span>
                    <b className="block font-medium">{s.name}</b>
                    <small className="text-ink-300">{s.duration_min} min</small>
                  </span>
                  <span className="font-display text-lg text-gold-300">{formatBRL(s.price_cents)}</span>
                </Option>
              ))}
            </OptionList>
          )}

          {st.step === 2 && service && (
            <OptionList>
              <Option pressed={st.staffId === null} onClick={() => go({ staffId: null, date: null, startsAt: null, step: 3 })}>
                <span>
                  <b className="block font-medium">Sem preferência</b>
                  <small className="text-ink-300">O primeiro barbeiro livre no horário escolhido</small>
                </span>
              </Option>
              {shop.staff
                .filter((b) => b.service_ids.includes(service.id))
                .map((b) => (
                  <Option key={b.id} pressed={st.staffId === b.id} onClick={() => go({ staffId: b.id, date: null, startsAt: null, step: 3 })}>
                    <span className="flex items-center gap-4">
                      <Initials name={b.display_name} />
                      <span>
                        <b className="block font-medium">{b.display_name}</b>
                        {b.specialties.length > 0 ? <small className="text-ink-300">{b.specialties.join(', ')}</small> : null}
                      </span>
                    </span>
                  </Option>
                ))}
            </OptionList>
          )}

          {st.step === 3 && service && (
            <CalendarStep
              shop={shop}
              serviceId={service.id}
              staffId={st.staffId ?? null}
              month={st.month}
              selected={st.date}
              onMonth={(month) => setSt((s) => ({ ...s, month }))}
              onPick={(date) => go({ date, startsAt: null, step: 4 })}
            />
          )}

          {st.step === 4 && service && st.date && (
            <TimeStep
              shop={shop}
              serviceId={service.id}
              staffId={st.staffId ?? null}
              date={st.date}
              selected={st.startsAt}
              onPick={(startsAt) => go({ startsAt, step: 5 })}
            />
          )}

          {st.step >= 5 && service && st.date && st.startsAt && (
            <DetailsAndConfirm
              shop={shop}
              step={st.step}
              pending={{ serviceId: service.id, staffId: st.staffId ?? null, date: st.date, startsAt: st.startsAt }}
              staffName={staff?.display_name ?? null}
              onStep={(step) => go({ step })}
              onSlotTaken={(msg) => {
                setSt((s) => ({ ...s, startsAt: null, step: 4 }))
                setStepError(msg)
              }}
              onClose={() => ref.current?.close()}
            />
          )}
        </div>

        {st.step > 1 && st.step < 5 ? (
          <div className="flex border-t border-ink-700 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => go({ step: st.step - 1 })}
              className="inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold hover:border-gold-500"
            >
              Voltar
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}

function OptionList({ children }: { children: ReactNode }) {
  return <div className="grid gap-2">{children}</div>
}

function Option({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="flex min-h-[58px] w-full items-center justify-between gap-4 rounded-xs border border-ink-700 bg-ink-800 px-4 py-3 text-left hover:border-gold-600 aria-pressed:border-gold-500 aria-pressed:bg-[#2a2518] aria-pressed:shadow-[inset_3px_0_0_var(--color-gold-500)]"
    >
      {children}
    </button>
  )
}

export function Initials({ name }: { name: string }) {
  const ini = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <span aria-hidden="true" className="grid size-[52px] flex-none place-items-center rounded-full border border-gold-500 font-display text-[17px] text-gold-300">
      {ini}
    </span>
  )
}

export function CalendarStep(props: {
  shop: PublicShop
  serviceId: string
  staffId: string | null
  month: string
  selected: string | null
  onMonth: (m: string) => void
  onPick: (d: string) => void
}) {
  const { shop, serviceId, staffId, month, selected, onMonth, onPick } = props
  const today = todayIn(shop.timezone)
  const last = addDays(today, shop.booking.max_advance_days)
  const from = month < today ? today : month
  const monthEnd = addDays(month, daysInMonth(month) - 1)
  const to = monthEnd > last ? last : monthEnd

  const days = useQuery({
    queryKey: ['available-days', shop.id, serviceId, staffId, from, to],
    enabled: from <= to,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_days', {
        p_shop_id: shop.id,
        p_service_id: serviceId,
        p_from: from,
        p_to: to,
        p_staff_id: staffId ?? undefined,
      })
      if (error) throw error
      return new Set((data ?? []).map((d) => d.day))
    },
  })

  const prevOk = month > monthStart(today)
  const nextOk = addMonths(month, 1) <= last
  const lead = weekdayOf(month)
  const count = daysInMonth(month)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" disabled={!prevOk} onClick={() => onMonth(addMonths(month, -1))} aria-label="Mês anterior" className="grid size-11 place-items-center text-xl disabled:opacity-30">
          ‹
        </button>
        <b className="font-medium">{formatMonth(month)}</b>
        <button type="button" disabled={!nextOk} onClick={() => onMonth(addMonths(month, 1))} aria-label="Próximo mês" className="grid size-11 place-items-center text-xl disabled:opacity-30">
          ›
        </button>
      </div>
      {days.isError ? (
        <p role="alert" className="text-sm text-danger">{friendlyError(days.error)}</p>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center" aria-busy={days.isLoading}>
          {WEEKDAYS_SHORT.map((w) => (
            <small key={w} className="py-1 text-ink-300">{w}</small>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const d = addDays(month, i)
            const ok = !!days.data?.has(d)
            return (
              <button
                key={d}
                type="button"
                disabled={!ok}
                aria-pressed={selected === d}
                aria-current={d === today ? 'date' : undefined}
                aria-label={`${formatDay(d)}${ok ? '' : ', indisponível'}`}
                onClick={() => onPick(d)}
                className="aspect-square min-h-10 rounded-xs border border-ink-700 bg-ink-800 font-medium hover:border-gold-500 disabled:cursor-default disabled:border-transparent disabled:bg-transparent disabled:text-ink-500 disabled:line-through aria-pressed:border-gold-500 aria-pressed:bg-gold-500 aria-pressed:text-[#1a1405] aria-[current=date]:shadow-[inset_0_-2px_0_var(--color-gold-500)]"
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}
      <p className="mt-3 text-sm text-ink-300">
        {days.isLoading ? 'Consultando a agenda…' : days.data && days.data.size === 0 ? 'Nenhum dia livre neste mês. Veja o próximo.' : 'Dias riscados estão indisponíveis.'}
      </p>
    </div>
  )
}

export function TimeStep(props: {
  shop: PublicShop
  serviceId: string
  staffId: string | null
  date: string
  selected: string | null
  onPick: (iso: string) => void
}) {
  const { shop, serviceId, staffId, date, selected, onPick } = props
  const slots = useQuery({
    queryKey: ['available-slots', shop.id, serviceId, staffId, date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_shop_id: shop.id,
        p_service_id: serviceId,
        p_date: date,
        p_staff_id: staffId ?? undefined,
      })
      if (error) throw error
      // Em "sem preferência" vários barbeiros podem ter o mesmo horário: mostramos cada horário uma vez.
      return [...new Set((data ?? []).map((s) => s.starts_at))].sort()
    },
    staleTime: 0,
  })

  return (
    <div>
      <p className="mb-4 text-ink-300">{formatDay(date)}</p>
      {slots.isLoading ? (
        <Spinner label="Consultando horários" />
      ) : slots.isError ? (
        <p role="alert" className="text-sm text-danger">{friendlyError(slots.error)}</p>
      ) : slots.data && slots.data.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
          {slots.data.map((iso) => (
            <Option key={iso} pressed={selected === iso} onClick={() => onPick(iso)}>
              <span className="w-full text-center font-medium">{formatTime(iso, shop.timezone)}</span>
            </Option>
          ))}
        </div>
      ) : (
        <p>Nenhum horário livre neste dia. Volte e escolha outra data.</p>
      )}
    </div>
  )
}

function DetailsAndConfirm(props: {
  shop: PublicShop
  step: number
  pending: PendingBooking
  staffName: string | null
  onStep: (step: number) => void
  onSlotTaken: (msg: string) => void
  onClose: () => void
}) {
  const { shop, step, pending, staffName, onStep, onSlotTaken, onClose } = props
  const { session } = useAuth()
  const location = useLocation()
  const profile = useProfile()
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [contact, setContact] = useState<string | null>(null)
  const [bookedStaff, setBookedStaff] = useState<string | null>(null)
  const service = shop.services.find((s) => s.id === pending.serviceId)!
  const needsPhone = !profile.data?.phone

  const rememberAndGo = () => {
    try {
      sessionStorage.setItem(pendingKey(shop.slug), JSON.stringify(pending))
    } catch {
      // sem armazenamento: o cliente só precisará escolher de novo
    }
  }

  const summary = useMemo(
    () => [
      ['Serviço', `${service.name}, ${service.duration_min} min`],
      ['Barbeiro', staffName ?? 'Primeiro disponível'],
      ['Data', formatDay(pending.date)],
      ['Horário', formatTime(pending.startsAt, shop.timezone)],
      ['Valor', formatBRL(service.price_cents)],
    ],
    [service, staffName, pending, shop.timezone],
  )

  if (!session) {
    const state = { from: location.pathname }
    return (
      <div className="space-y-5">
        <p className="text-ink-300">Para confirmar, entre na sua conta. Assim você acompanha e cancela seus horários quando quiser.</p>
        <div className="grid gap-3">
          <Link to="/entrar" state={state} onClick={rememberAndGo} className="btn-gold inline-flex min-h-12 items-center justify-center rounded-xs font-semibold">
            Entrar
          </Link>
          <Link to="/cadastro" state={state} onClick={rememberAndGo} className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold hover:border-gold-500">
            Criar conta
          </Link>
        </div>
        <p className="text-sm text-ink-500">Seu horário fica guardado enquanto você entra.</p>
      </div>
    )
  }

  if (profile.isLoading) return <Spinner />

  async function confirm() {
    setSubmitError(null)
    setSubmitting(true)
    const { data, error } = await supabase.rpc('customer_create_booking', {
      p_shop_id: shop.id,
      p_service_id: pending.serviceId,
      p_starts_at: pending.startsAt,
      p_staff_id: pending.staffId ?? undefined,
      p_phone: needsPhone ? phone : undefined,
      p_notes: notes.trim() || undefined,
    })
    setSubmitting(false)
    queryClient.invalidateQueries({ queryKey: ['available-slots'] })
    queryClient.invalidateQueries({ queryKey: ['available-days'] })
    if (error) {
      const msg = friendlyError(error)
      if (error.message === 'slot_unavailable') return onSlotTaken(msg)
      if (error.message === 'invalid_phone') {
        setPhoneError(msg)
        return onStep(5)
      }
      return setSubmitError(msg)
    }
    try {
      sessionStorage.removeItem(pendingKey(shop.slug))
    } catch {
      // nada a limpar
    }
    queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    const booked = data as { contact_whatsapp?: string | null; staff?: { display_name?: string } } | null
    setContact(booked?.contact_whatsapp ?? null)
    setBookedStaff(booked?.staff?.display_name ?? staffName)
    onStep(7)
  }

  const footer = (back: number | null, label: string, action: () => void, loading = false) => (
    <div className="mt-8 flex justify-between gap-3 border-t border-ink-700 pt-4">
      {back ? (
        <button type="button" onClick={() => onStep(back)} className="inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold hover:border-gold-500">
          Voltar
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={action} disabled={loading} className="btn-gold inline-flex min-h-12 items-center gap-2 rounded-xs px-6 font-semibold disabled:opacity-60">
        {loading ? <Spinner label="Confirmando" /> : label}
      </button>
    </div>
  )

  if (step === 5) {
    return (
      <div>
        {needsPhone ? (
          <>
            <label htmlFor="bk-phone" className="mb-1.5 block text-sm font-medium">Celular com DDD</label>
            <input
              id="bk-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(99) 91234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              aria-invalid={phoneError ? true : undefined}
              className="min-h-12 w-full rounded-xs border border-ink-700 bg-ink-950 px-4 text-base focus:border-gold-500 focus:outline-none"
            />
            <p className="mt-1 min-h-5 text-sm text-danger" aria-live="polite">{phoneError}</p>
          </>
        ) : (
          <p className="mb-4 text-ink-300">
            Agendando como <b className="font-medium text-ink-100">{profile.data?.full_name}</b>.
          </p>
        )}
        <label htmlFor="bk-notes" className="mt-3 mb-1.5 block text-sm font-medium">
          Observações <span className="text-ink-300">(opcional)</span>
        </label>
        <textarea
          id="bk-notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xs border border-ink-700 bg-ink-950 px-4 py-3 text-base focus:border-gold-500 focus:outline-none"
        />
        {footer(4, 'Continuar', () => {
          if (needsPhone) {
            const digits = phone.replace(/\D/g, '')
            if (digits.length < 10 || digits.length > 11) return setPhoneError('Informe um celular com DDD.')
          }
          setPhoneError(null)
          onStep(6)
        })}
      </div>
    )
  }

  const list = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3">
      {summary.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-300">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
      {notes.trim() && step === 6 ? (
        <>
          <dt className="text-ink-300">Observações</dt>
          <dd>{notes.trim()}</dd>
        </>
      ) : null}
    </dl>
  )

  if (step === 6) {
    return (
      <div>
        {submitError ? <p role="alert" className="mb-4 text-sm text-danger">{submitError}</p> : null}
        {list}
        <p className="mt-5 text-sm text-ink-300">
          Cancelamento online até {Math.round(shop.booking.cancel_limit_min / 60)}h antes do horário.
        </p>
        {footer(5, 'Confirmar agendamento', confirm, submitting)}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-5 text-ink-300">
        Seu horário está reservado, {profile.data?.full_name?.split(' ')[0]}. Você pode acompanhar e cancelar em “Minha conta”.
      </p>
      {list}
      <div className="mt-8 grid gap-3 border-t border-ink-700 pt-4">
        {contact ? (
          <a
            href={whatsappLink(
              contact,
              `Olá${bookedStaff ? `, ${bookedStaff.split(' ')[0]}` : ''}! Sou ${profile.data?.full_name ?? 'cliente'} e acabei de agendar ${service.name} na ${shop.name} para ${formatDay(pending.date).toLowerCase()} às ${formatTime(pending.startsAt, shop.timezone)}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="btn-gold inline-flex min-h-12 items-center justify-center rounded-xs font-semibold"
          >
            Falar com {bookedStaff ? bookedStaff.split(' ')[0] : 'a barbearia'} no WhatsApp
          </a>
        ) : null}
        <Link to="/conta" className={`${contact ? 'border border-ink-700 hover:border-gold-500' : 'btn-gold'} inline-flex min-h-12 items-center justify-center rounded-xs font-semibold`}>
          Ver meus agendamentos
        </Link>
        <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold hover:border-gold-500">
          Fechar
        </button>
      </div>
    </div>
  )
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (d.length > 6) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  if (d.length > 2) return d.replace(/(\d{2})(\d+)/, '($1) $2')
  return d
}
