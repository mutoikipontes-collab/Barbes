export type PublicService = { id: string; name: string; description: string | null; duration_min: number; price_cents: number }
export type PublicStaff = {
  id: string
  display_name: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  service_ids: string[]
}
export type PublicShop = {
  id: string
  slug: string
  name: string
  description: string | null
  timezone: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: { line: string | null; city: string | null; state: string | null; postal_code: string | null; latitude: number | null; longitude: number | null }
  logo_url: string | null
  cover_url: string | null
  booking: { slot_step_min: number; min_notice_min: number; max_advance_days: number; cancel_limit_min: number }
  hours: { weekday: number; opens_at: string; closes_at: string }[]
  services: PublicService[]
  staff: PublicStaff[]
}

/** Seleção guardada enquanto o cliente entra na conta, para retomar o agendamento depois. */
export type PendingBooking = { serviceId: string; staffId: string | null; date: string; startsAt: string }
