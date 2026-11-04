import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Wordmark } from '@/components/ui'
import { MyAppointments } from '@/features/account/MyAppointments'
import { parseGuestBookingParam, saveGuestBooking } from '@/lib/guestBookings'

/** Agendamentos feitos neste celular (sem conta). O link "?abrir=" traz um agendamento de outro aparelho. */
export function GuestAppointmentsPage() {
  const [params, setParams] = useSearchParams()
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const b = parseGuestBookingParam(params.get('abrir'))
    if (!b) return
    saveGuestBooking(b)
    setParams({}, { replace: true })
    setRefresh((n) => n + 1)
  }, [params, setParams])

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Início"><Wordmark /></Link>
        <Link to="/" className="text-sm text-gold-300 underline underline-offset-4">Encontrar barbearia</Link>
      </header>
      <MyAppointments mode="device" refresh={refresh} />
      <p className="mt-6 text-sm text-ink-300">
        Aparecem aqui os horários marcados neste celular. Marcou em outro aparelho? Abra o link do agendamento que você copiou.
      </p>
    </main>
  )
}
