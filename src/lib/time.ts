// Datas e horas sempre no fuso da barbearia (o banco guarda tudo em UTC).

/** Data de hoje no fuso informado, no formato AAAA-MM-DD. */
export function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function monthStart(ymd: string): string {
  return ymd.slice(0, 8) + '01'
}

export function addMonths(ymdMonthStart: string, months: number): string {
  const [y, m] = ymdMonthStart.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1 + months, 1))
  return dt.toISOString().slice(0, 10)
}

/** Dia da semana (0 = domingo) de uma data AAAA-MM-DD. */
export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function daysInMonth(ymdMonthStart: string): number {
  const [y, m] = ymdMonthStart.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Quinta-feira, 6 de novembro" a partir de AAAA-MM-DD. */
export function formatDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return cap(
    new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )
}

export function formatMonth(ymdMonthStart: string): string {
  const [y, m] = ymdMonthStart.split('-').map(Number)
  return cap(new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' }))
}

/** "14:30" de um instante ISO, no fuso da barbearia. */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** AAAA-MM-DD de um instante ISO, no fuso da barbearia. */
export function dayOf(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

/** "08:30:00" -> "8h30"; "09:00:00" -> "9h" */
export function formatClock(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
