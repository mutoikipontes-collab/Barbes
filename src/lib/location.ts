// Endereço da barbearia: mapa, rotas e "salvar na agenda" (sem chave de API).

export type Address = {
  line: string | null
  city: string | null
  state: string | null
  postal_code?: string | null
  latitude: number | null
  longitude: number | null
}

export function addressText(a: Address | null | undefined): string {
  if (!a) return ''
  const cityState = [a.city, a.state].filter(Boolean).join(' – ')
  return [a.line, cityState].filter(Boolean).join(', ')
}

export function hasLocation(a: Address | null | undefined): boolean {
  return !!a && (!!a.line || (a.latitude !== null && a.longitude !== null))
}

/** O que o mapa procura: coordenadas, se houver; senão nome + endereço. */
function mapQuery(name: string, a: Address): string {
  if (a.latitude !== null && a.longitude !== null) return `${a.latitude},${a.longitude}`
  return `${name}, ${addressText(a)}`
}

export function mapEmbedUrl(name: string, a: Address): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(name, a))}&z=16&output=embed`
}

export function googleMapsUrl(name: string, a: Address): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(name, a))}`
}

export function wazeUrl(name: string, a: Address): string {
  if (a.latitude !== null && a.longitude !== null) return `https://waze.com/ul?ll=${a.latitude},${a.longitude}&navigate=yes`
  return `https://waze.com/ul?q=${encodeURIComponent(mapQuery(name, a))}&navigate=yes`
}

type CalendarEvent = { title: string; startsAt: string; endsAt: string; location: string; details: string }

const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${utcStamp(e.startsAt)}/${utcStamp(e.endsAt)}`,
    location: e.location,
    details: e.details,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`)

/** Baixa um arquivo .ics: no iPhone e no Android abre "Adicionar à agenda" com hora e endereço. */
export function downloadIcs(e: CalendarEvent, filename: string) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BARBER OS//Agendamento//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@barber-os`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(e.startsAt)}`,
    `DTEND:${utcStamp(e.endsAt)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `LOCATION:${icsEscape(e.location)}`,
    `DESCRIPTION:${icsEscape(e.details)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(e.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "2 horas antes", "30 minutos antes", "a qualquer momento antes". */
export function formatLimit(min: number): string {
  if (min <= 0) return 'a qualquer momento antes do horário'
  if (min < 60) return `até ${min} minutos antes do horário`
  const h = min / 60
  if (h >= 24 && h % 24 === 0) return `até ${h / 24} dia${h / 24 > 1 ? 's' : ''} antes do horário`
  return `até ${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} hora${h > 1 ? 's' : ''} antes do horário`
}
