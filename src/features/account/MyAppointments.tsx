import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL, whatsappLink } from '@/lib/format'
import { dayOf, formatDay, formatTime } from '@/lib/time'
import { useState } from 'react'
import { Alert, Spinner } from '@/components/ui'
import { RescheduleDialog, type RescheduleTarget } from './RescheduleDialog'

type MyAppointment = {
  id: string
  starts_at: string
  ends_at: string
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  price_cents: number
  service: string
  service_id: string
  staff: string
  staff_id: string
  can_cancel: boolean
  can_reschedule: boolean
  contact_whatsapp: string | null
  shop: { id: string; name: string; slug: string; timezone: string; whatsapp: string | null }
}

const STATUS: Record<MyAppointment['status'], string> = {
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Falta',
}

export function MyAppointments() {
  const queryClient = useQueryClient()
  const [moving, setMoving] = useState<RescheduleTarget | null>(null)
  const list = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_appointments')
      if (error) throw error
      return (data ?? []) as unknown as MyAppointment[]
    },
  })
  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('customer_cancel_booking', { p_appointment_id: id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-appointments'] }),
  })

  const now = Date.now()
  const upcoming = (list.data ?? [])
    .filter((a) => new Date(a.ends_at).getTime() > now && (a.status === 'confirmed' || a.status === 'in_progress'))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const past = (list.data ?? []).filter((a) => !upcoming.includes(a)).slice(0, 10)

  return (
    <section className="mt-10" aria-labelledby="meus-agendamentos">
      <h2 id="meus-agendamentos" className="font-sans text-sm font-semibold tracking-[0.16em] text-ink-500 uppercase">
        Meus agendamentos
      </h2>
      {cancel.isError ? <div className="mt-4"><Alert tone="error">{friendlyError(cancel.error)}</Alert></div> : null}
      {list.isLoading ? (
        <div className="mt-4"><Spinner /></div>
      ) : list.isError ? (
        <div className="mt-4"><Alert tone="error">{friendlyError(list.error)}</Alert></div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <p className="mt-4 text-ink-300">Você ainda não tem agendamentos. Abra a página de uma barbearia para marcar seu horário.</p>
      ) : (
        <ul className="mt-4 border-b border-ink-700">
          {[...upcoming, ...past].map((a) => {
            const isUpcoming = upcoming.includes(a)
            return (
              <li key={a.id} className={`flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 py-4 ${isUpcoming ? '' : 'opacity-60'}`}>
                <div>
                  <b className="block font-medium">
                    {formatDay(dayOf(a.starts_at, a.shop.timezone))} às {formatTime(a.starts_at, a.shop.timezone)}
                  </b>
                  <small className="text-ink-300">
                    {a.service} com {a.staff} · <Link to={`/${a.shop.slug}`} className="underline underline-offset-2">{a.shop.name}</Link> · {formatBRL(a.price_cents)}
                  </small>
                </div>
                {isUpcoming && (a.can_cancel || a.can_reschedule || a.contact_whatsapp) ? (
                  <div className="flex flex-wrap gap-4">
                  {a.contact_whatsapp ? (
                    <a
                      href={whatsappLink(a.contact_whatsapp, `Olá, ${a.staff.split(' ')[0]}! Sobre meu horário de ${a.service} em ${formatDay(dayOf(a.starts_at, a.shop.timezone)).toLowerCase()} às ${formatTime(a.starts_at, a.shop.timezone)}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center text-gold-300 underline underline-offset-4"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {a.can_reschedule ? (
                    <button type="button" onClick={() => setMoving(a)} className="min-h-11 text-gold-300 underline underline-offset-4">
                      Remarcar
                    </button>
                  ) : null}
                  {a.can_cancel ? (
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => {
                      if (window.confirm('Cancelar este agendamento?')) cancel.mutate(a.id)
                    }}
                    className="min-h-11 text-gold-300 underline underline-offset-4 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  ) : null}
                  </div>
                ) : (
                  <span className="text-sm text-ink-300">
                    {isUpcoming ? 'Prazo de cancelamento online encerrado' : STATUS[a.status]}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {moving ? <RescheduleDialog appt={moving} onClose={() => setMoving(null)} /> : null}
    </section>
  )
}
