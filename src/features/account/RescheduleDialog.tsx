import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatDay, formatTime, monthStart, todayIn } from '@/lib/time'
import { Spinner } from '@/components/ui'
import { CalendarStep, TimeStep } from '@/features/booking/BookingDialog'
import type { PublicShop } from '@/features/booking/types'

export type RescheduleTarget = {
  id: string
  service_id: string
  staff_id: string
  service: string
  staff: string
  shop: { slug: string; timezone: string }
}

export function RescheduleDialog({ appt, onClose }: { appt: RescheduleTarget; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(monthStart(todayIn(appt.shop.timezone)))
  const [date, setDate] = useState<string | null>(null)
  const [startsAt, setStartsAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  const shop = useQuery({
    queryKey: ['public-shop', appt.shop.slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_shop', { p_slug: appt.shop.slug })
      if (error) throw error
      return data as unknown as PublicShop | null
    },
  })

  async function confirm() {
    if (!startsAt) return
    setError(null)
    setSaving(true)
    const { error } = await supabase.rpc('customer_reschedule_booking', { p_appointment_id: appt.id, p_new_starts_at: startsAt })
    setSaving(false)
    queryClient.invalidateQueries({ queryKey: ['available-slots'] })
    queryClient.invalidateQueries({ queryKey: ['available-days'] })
    if (error) {
      setError(friendlyError(error))
      if (error.message === 'slot_unavailable') setStartsAt(null)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    setDone(true)
  }

  const title = done ? 'Horário remarcado' : !date ? 'Escolha a nova data' : !startsAt ? 'Escolha o novo horário' : 'Confirme a mudança'

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      aria-labelledby="rs-title"
      className="rise m-auto h-dvh max-h-dvh w-full max-w-full overflow-hidden border-0 bg-ink-900 p-0 text-ink-100 sm:h-[min(100dvh,46rem)] sm:w-[min(100%,34rem)] sm:border sm:border-ink-700"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between py-2 pr-2 pl-5 text-sm text-ink-300">
          <span>Remarcar</span>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="grid size-11 place-items-center text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-6">
          <h2 id="rs-title" className="mb-2 text-[1.8rem]">{title}</h2>
          <p className="mb-5 text-sm text-ink-300">{appt.service} com {appt.staff}</p>
          {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}

          {shop.isLoading ? (
            <Spinner />
          ) : shop.isError || !shop.data ? (
            <p role="alert" className="text-danger">{shop.isError ? friendlyError(shop.error) : 'Barbearia indisponível no momento.'}</p>
          ) : done ? (
            <div className="space-y-5">
              <p>
                Novo horário: <b className="font-medium">{formatDay(date!)} às {formatTime(startsAt!, appt.shop.timezone)}</b>.
              </p>
              <button type="button" onClick={() => ref.current?.close()} className="btn-gold inline-flex min-h-12 w-full items-center justify-center rounded-xs font-semibold">Fechar</button>
            </div>
          ) : !date ? (
            <CalendarStep shop={shop.data} serviceId={appt.service_id} staffId={appt.staff_id} month={month} selected={date} onMonth={setMonth} onPick={setDate} />
          ) : !startsAt ? (
            <>
              <TimeStep shop={shop.data} serviceId={appt.service_id} staffId={appt.staff_id} date={date} selected={startsAt} onPick={setStartsAt} />
              <button type="button" onClick={() => setDate(null)} className="mt-6 inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold hover:border-gold-500">Voltar</button>
            </>
          ) : (
            <div className="space-y-6">
              <p>
                Mudar para <b className="font-medium">{formatDay(date)} às {formatTime(startsAt, appt.shop.timezone)}</b>?
              </p>
              <div className="flex justify-between gap-3">
                <button type="button" onClick={() => setStartsAt(null)} className="inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold hover:border-gold-500">Voltar</button>
                <button type="button" onClick={confirm} disabled={saving} className="btn-gold inline-flex min-h-12 items-center rounded-xs px-6 font-semibold disabled:opacity-60">
                  {saving ? <Spinner label="Remarcando" /> : 'Confirmar mudança'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
