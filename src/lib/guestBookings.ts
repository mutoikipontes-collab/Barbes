// Agendamentos feitos sem conta ficam guardados neste aparelho (id + código secreto).
// O código é o que permite ver, remarcar e cancelar; no banco só fica o "hash" dele.

export type GuestBooking = { id: string; token: string }

const KEY = 'barberos.bookings'

export function loadGuestBookings(): GuestBooking[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((b): b is GuestBooking => typeof b?.id === 'string' && typeof b?.token === 'string').slice(0, 50)
  } catch {
    return []
  }
}

export function saveGuestBooking(b: GuestBooking): void {
  try {
    const list = loadGuestBookings().filter((x) => x.id !== b.id)
    localStorage.setItem(KEY, JSON.stringify([b, ...list].slice(0, 50)))
  } catch {
    // sem armazenamento: o cliente ainda tem o link do agendamento
  }
}

/** Link que abre o agendamento em qualquer aparelho. */
export function guestBookingLink(b: GuestBooking): string {
  return `${window.location.origin}/meus-agendamentos?abrir=${b.id}.${b.token}`
}

/** Lê o "?abrir=id.codigo" do link e guarda no aparelho. */
export function parseGuestBookingParam(v: string | null): GuestBooking | null {
  const m = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(v ?? '')
  return m ? { id: m[1], token: m[2] } : null
}
