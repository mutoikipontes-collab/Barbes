import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { addDays, formatClock, formatDay, formatTime, todayIn, WEEKDAYS_LONG } from '@/lib/time'
import { Alert, FullPageLoading, Wordmark } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useMyShops } from '@/features/auth/queries'
import { BookingDialog, pendingKey, type BookingStart } from './BookingDialog'
import { LocationCard } from '@/components/LocationCard'
import type { PendingBooking, PublicShop } from './types'

export function ShopPage() {
  const { slug = '' } = useParams()
  const { session } = useAuth()
  const [booking, setBooking] = useState<BookingStart | null>(null)
  const myShops = useMyShops()

  const shop = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_shop', { p_slug: slug })
      if (error) throw error
      return (data ?? null) as unknown as PublicShop | null
    },
  })

  // Voltou do login no meio de um agendamento: retoma de onde parou.
  useEffect(() => {
    if (!session || !shop.data) return
    try {
      const saved = sessionStorage.getItem(pendingKey(shop.data.slug))
      if (saved) {
        sessionStorage.removeItem(pendingKey(shop.data.slug))
        setBooking({ pending: JSON.parse(saved) as PendingBooking })
      }
    } catch {
      // sem armazenamento: nada a retomar
    }
  }, [session, shop.data])

  useEffect(() => {
    if (shop.data) document.title = `${shop.data.name} · Agende seu horário`
    return () => {
      document.title = 'BARBER OS'
    }
  }, [shop.data])

  if (shop.isLoading) return <FullPageLoading />
  if (shop.isError) {
    return (
      <main className="mx-auto max-w-md px-4 py-20">
        <Alert tone="error">{friendlyError(shop.error)}</Alert>
      </main>
    )
  }
  if (!shop.data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <h1 className="text-4xl">Agendamento indisponível</h1>
        <p className="mt-4 text-ink-300">Confira o endereço digitado. Se ele estiver certo, fale direto com a barbearia para marcar seu horário.</p>
        <Link to="/" className="mt-8 font-semibold text-gold-300">Ir para o início</Link>
      </main>
    )
  }

  // Só mostra serviço que algum barbeiro faz, e barbeiro que faz algum serviço ativo:
  // assim o cliente nunca escolhe uma combinação sem horários.
  const raw = shop.data
  const staffList = raw.staff.filter((b) => b.service_ids.length > 0)
  const s: PublicShop = {
    ...raw,
    staff: staffList,
    services: raw.services.filter((sv) => staffList.some((b) => b.service_ids.includes(sv.id))),
  }
  const canBook = s.services.length > 0 && s.staff.length > 0
  const mine = myShops.data?.find((m) => m.id === s.id && m.role === 'owner')
  const missing = !canBook
    ? raw.services.length === 0
      ? 'Cadastre pelo menos um serviço (aba Serviços).'
      : raw.staff.length === 0
        ? 'Cadastre um barbeiro que atende (aba Equipe) com expediente.'
        : 'Ligue os serviços aos barbeiros: em Equipe, abra o barbeiro e marque os serviços que ele faz.'
    : null
  const open = (start: BookingStart = {}) => {
    try {
      sessionStorage.removeItem(pendingKey(s.slug))
    } catch {
      // ignorar
    }
    setBooking(start)
  }
  const address = [s.address.line, [s.address.city, s.address.state].filter(Boolean).join(' – ')].filter(Boolean).join(', ')
  const whatsappUrl = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : null

  return (
    <>
      <header className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-5 py-5">
        <span className="font-display text-[17px] font-medium tracking-[0.14em] text-gold-500">{s.name}</span>
        <nav aria-label="Principal" className="flex items-center gap-4 text-[15px]">
          <a href="#servicos" className="hidden hover:text-gold-300 sm:inline">Serviços</a>
          <a href="#barbeiros" className="hidden hover:text-gold-300 sm:inline">Barbeiros</a>
          <Link to={session ? '/conta' : '/entrar'} state={{ from: `/${s.slug}` }} className="hover:text-gold-300">
            {session ? 'Minha conta' : 'Entrar'}
          </Link>
          {canBook ? (
            <button type="button" onClick={() => open()} className="btn-gold inline-flex min-h-[38px] items-center rounded-xs px-4 font-semibold">
              Agendar
            </button>
          ) : null}
        </nav>
      </header>

      <main>
        {mine && missing ? (
          <div className="mx-auto max-w-[68rem] px-5">
            <div className="rounded-xs border border-gold-500/50 bg-ink-900 px-4 py-3 text-sm">
              <b className="font-semibold text-gold-300">Só você vê este aviso.</b> Sua página ainda não recebe agendamentos. {missing}{' '}
              <Link to={`/painel/${s.id}`} className="font-semibold text-gold-300 underline underline-offset-4">Abrir painel</Link>
            </div>
          </div>
        ) : null}
        <section className="mx-auto grid max-w-[68rem] items-center gap-x-12 px-5 pt-[clamp(3rem,10vw,6.5rem)] pb-[clamp(2rem,6vw,4rem)] md:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="gold-line mb-8" />
            <h1 className="max-w-[14ch] text-[clamp(3rem,11vw,6.4rem)] leading-[0.98] tracking-[-0.015em]">Seu próximo corte começa aqui.</h1>
            <p className="mt-6 mb-8 max-w-[34rem] text-[1.1rem] text-ink-300">
              {s.description ?? `${s.name}: escolha o serviço, o barbeiro e o horário em menos de um minuto.`}
            </p>
            {canBook ? (
              <div className="flex flex-wrap items-center gap-6">
                <button type="button" onClick={() => open()} className="btn-gold inline-flex min-h-[46px] items-center rounded-xs px-6 font-semibold">
                  Agendar horário
                </button>
                <a href="#servicos" className="text-gold-300 underline underline-offset-4">Ver serviços</a>
              </div>
            ) : (
              <p className="text-ink-300">Os agendamentos online ainda não foram abertos por esta barbearia.</p>
            )}
            {canBook ? <NextFree shop={s} /> : null}
          </div>
          <Razor />
        </section>

        {s.services.length > 0 ? (
          <section id="servicos" className="mx-auto max-w-[68rem] px-5 py-[3.25rem]">
            <h2 className="mb-5 text-[clamp(1.7rem,5vw,2.3rem)]">Serviços</h2>
            <div className="border-b border-ink-700">
              {s.services.map((sv) => (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => open({ serviceId: sv.id })}
                  className="group block w-full border-t border-ink-700 py-[1.1rem] text-left"
                >
                  <span className="flex items-baseline gap-3">
                    <b className="font-display text-[1.3rem] font-medium group-hover:text-gold-300">{sv.name}</b>
                    <span className="dots-leader" aria-hidden="true" />
                    <span className="font-display text-[1.2rem] whitespace-nowrap text-gold-300">{formatBRL(sv.price_cents)}</span>
                  </span>
                  <small className="mt-1 block text-[.85rem] text-ink-300">
                    {sv.duration_min} min.{sv.description ? ` ${sv.description}` : ''}
                  </small>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {s.staff.length > 0 ? (
          <section id="barbeiros" className="mx-auto max-w-[68rem] px-5 py-[3.25rem]">
            <h2 className="mb-5 text-[clamp(1.7rem,5vw,2.3rem)]">Barbeiros</h2>
            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
              {s.staff.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => open({ staffId: b.id, serviceId: b.service_ids.length === 1 ? b.service_ids[0] : undefined })}
                  className="group relative flex aspect-[3/4] flex-[0_0_72%] snap-start flex-col justify-end gap-1 overflow-hidden rounded-xs border border-ink-700 bg-[linear-gradient(165deg,#212227,#0b0b0d_72%)] p-5 text-left shadow-[inset_0_1px_0_rgba(230,207,147,0.12)] hover:border-gold-500 md:flex-none"
                >
                  {b.photo_url ? (
                    <>
                      <img src={b.photo_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(5,5,5,0.92))]" />
                    </>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute -top-[0.12em] right-[0.04em] font-display text-[12rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(200,160,74,0.4)] group-hover:[-webkit-text-stroke-color:rgba(230,207,147,0.8)]"
                    >
                      {b.display_name[0]}
                    </span>
                  )}
                  <b className="relative font-display text-[1.5rem] font-medium">{b.display_name}</b>
                  {b.specialties.length > 0 ? <small className="relative text-ink-100/80">{b.specialties.join(' · ')}</small> : null}
                  {b.bio ? <small className="relative line-clamp-2 text-ink-300">{b.bio}</small> : null}
                  <span className="relative mt-2 text-sm font-semibold text-gold-300">Agendar com {b.display_name.split(' ')[0]} →</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section id="contato" className="mx-auto max-w-[68rem] px-5 py-[3.25rem]">
          <h2 className="mb-5 text-[clamp(1.7rem,5vw,2.3rem)]">Onde e quando</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {address ? (
              <div className="md:row-span-2">
                <LocationCard shopName={s.name} address={s.address} />
              </div>
            ) : null}
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-ink-300">Horário</h3>
              <Hours hours={s.hours} />
            </div>
            {whatsappUrl || s.phone ? (
              <div>
                <h3 className="mb-1.5 text-sm font-semibold text-ink-300">Contato</h3>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-gold-300 underline underline-offset-4">WhatsApp</a>
                ) : null}
                {s.phone ? <p>{s.phone}</p> : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-2 border-t border-ink-700 px-5 pt-8 pb-10 text-sm text-ink-300">
        <span>
          © {new Date().getFullYear()} {s.name} ·{' '}
          <Link to="/privacidade" className="underline underline-offset-2">Privacidade</Link>
        </span>
        <Link to="/" className="inline-flex items-center gap-2">
          Agenda por <Wordmark className="text-[13px]" />
        </Link>
      </footer>

      {booking ? <BookingDialog shop={s} start={booking} onClose={() => setBooking(null)} /> : null}
    </>
  )
}

function Hours({ hours }: { hours: PublicShop['hours'] }) {
  if (hours.length === 0) return <p className="text-ink-300">Não informado.</p>
  const byDay = new Map<number, string[]>()
  for (const h of hours) byDay.set(h.weekday, [...(byDay.get(h.weekday) ?? []), `${formatClock(h.opens_at)} às ${formatClock(h.closes_at)}`])
  const order = [1, 2, 3, 4, 5, 6, 0]
  return (
    <ul className="space-y-1">
      {order.map((d) => (
        <li key={d} className="flex justify-between gap-4">
          <span className="text-ink-300">{WEEKDAYS_LONG[d]}</span>
          <span>{byDay.get(d)?.join(', ') ?? 'Fechado'}</span>
        </li>
      ))}
    </ul>
  )
}

/** Próximo horário livre (para o primeiro serviço do cardápio), consultado de verdade na agenda. */
function NextFree({ shop }: { shop: PublicShop }) {
  const service = shop.services[0]
  const next = useQuery({
    queryKey: ['next-free', shop.id, service.id],
    queryFn: async () => {
      const today = todayIn(shop.timezone)
      const { data: days, error } = await supabase.rpc('get_available_days', {
        p_shop_id: shop.id,
        p_service_id: service.id,
        p_from: today,
        p_to: addDays(today, 13),
      })
      if (error) throw error
      const first = days?.[0]?.day
      if (!first) return null
      const { data: slots, error: e2 } = await supabase.rpc('get_available_slots', {
        p_shop_id: shop.id,
        p_service_id: service.id,
        p_date: first,
      })
      if (e2) throw e2
      const earliest = [...(slots ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
      if (!earliest) return null
      const staff = shop.staff.find((b) => b.id === earliest.staff_id)
      const when = first === today ? 'hoje' : first === addDays(today, 1) ? 'amanhã' : formatDay(first).toLowerCase()
      return `${when} às ${formatTime(earliest.starts_at, shop.timezone)}${staff ? `, com ${staff.display_name}` : ''}`
    },
    staleTime: 60_000,
  })
  if (next.isError || next.data === null) return null
  return (
    <p className="mt-8 flex items-center gap-2.5 text-[15px] text-ink-300">
      <span aria-hidden="true" className="size-[7px] flex-none rounded-full bg-gold-500 shadow-[0_0_0_4px_rgba(200,160,74,0.18)]" />
      Próximo horário livre:&nbsp;<span className="text-ink-100">{next.data ?? '…'}</span>
    </p>
  )
}

function Razor() {
  return (
    <svg viewBox="0 0 440 300" aria-hidden="true" className="mx-auto mt-10 h-auto w-full max-w-[30rem] drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] md:mt-0">
      <defs>
        <linearGradient id="gSt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2b2c31" />
          <stop offset=".42" stopColor="#f1eee6" />
          <stop offset=".58" stopColor="#8e8c86" />
          <stop offset="1" stopColor="#2b2c31" />
        </linearGradient>
        <linearGradient id="gHd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2b30" />
          <stop offset="1" stopColor="#0d0d0f" />
        </linearGradient>
        <radialGradient id="gGl">
          <stop offset="0" stopColor="#c8a04a" stopOpacity=".35" />
          <stop offset="1" stopColor="#c8a04a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="220" cy="246" rx="190" ry="24" fill="url(#gGl)" />
      <g transform="rotate(-20 220 150)">
        <path d="M34 128 L250 120 L250 160 L74 160 Q30 156 34 128Z" fill="url(#gSt)" />
        <path d="M52 132 L250 125" stroke="#050505" strokeOpacity=".35" fill="none" />
        <path d="M78 158 L250 158" stroke="#fff" strokeOpacity=".55" fill="none" />
        <path d="M250 112 L372 106 Q396 108 396 138 Q396 168 372 170 L250 168Z" fill="url(#gHd)" stroke="#c8a04a" strokeOpacity=".7" />
        <path d="M262 122 L376 118 M262 156 L376 156" stroke="#c8a04a" strokeOpacity=".35" fill="none" />
        <circle cx="250" cy="140" r="9" fill="#c8a04a" />
        <circle cx="250" cy="140" r="3.5" fill="#0d0d0f" />
        <circle cx="378" cy="138" r="4" fill="#c8a04a" />
      </g>
    </svg>
  )
}
