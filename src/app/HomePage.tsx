import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { fold } from '@/lib/fold'
import { CIDADES_MA } from '@/data/cidadesMA'
import { Alert, Spinner, Wordmark } from '@/components/ui'
import { ClientMenu } from './ClientMenu'

type PublicShopCard = {
  slug: string
  name: string
  description: string | null
  city: string | null
  state: string | null
  address_line: string | null
  logo_url: string | null
  cover_url: string | null
  tier: 'basico' | 'plus' | 'premium'
  min_price_cents: number | null
  barbers: number
}

const CITIES = CIDADES_MA.map((name) => ({ name, key: fold(name) }))

/** Página inicial do cliente: escolher a cidade e a barbearia. */
export function HomePage() {
  const [params, setParams] = useSearchParams()
  const city = params.get('cidade') ?? ''
  const [nameText, setNameText] = useState(params.get('q') ?? '')
  const [name, setName] = useState(params.get('q') ?? '')

  // espera parar de digitar o nome antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setName(nameText.trim()), 350)
    return () => clearTimeout(t)
  }, [nameText])

  useEffect(() => {
    const next = new URLSearchParams()
    if (city) next.set('cidade', city)
    if (name) next.set('q', name)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [city, name, params, setParams])

  const chooseCity = (c: string) => {
    const next = new URLSearchParams()
    if (c) next.set('cidade', c)
    if (name) next.set('q', name)
    setParams(next, { replace: true })
  }

  const counts = useQuery({
    queryKey: ['city-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_city_counts')
      if (error) throw error
      return (data ?? {}) as Record<string, number>
    },
  })

  const searching = !!city || !!name
  const shops = useQuery({
    queryKey: ['public-shops', city, name],
    enabled: searching,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_public_shops', { p_city: city || undefined, p_query: name || undefined })
      if (error) throw error
      return (data ?? []) as unknown as PublicShopCard[]
    },
    placeholderData: (prev) => prev,
  })

  return (
    <>
      <header className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-5 py-5">
        <Wordmark />
        <ClientMenu />
      </header>

      <main className="mx-auto max-w-[68rem] px-5">
        <section className="pt-[clamp(2rem,7vw,4.5rem)] pb-8">
          <div className="gold-line mb-7" />
          <h1 className="max-w-[16ch] text-[clamp(2.4rem,8.5vw,4.6rem)] leading-[1.02] tracking-[-0.015em]">Encontre a melhor barbearia da região.</h1>
          <p className="mt-5 max-w-[34rem] text-[1.08rem] text-ink-300">Escolha sua cidade, a barbearia, o barbeiro e o horário. Sem ligar e sem esperar resposta.</p>

          <div className="mt-8 grid max-w-xl gap-4">
            <CityPicker value={city} counts={counts.data} onFocus={() => void counts.refetch()} onChange={chooseCity} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Buscar barbearia pelo nome</span>
              <span className="relative block">
                <SearchIcon />
                <input
                  type="search"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  placeholder="Nome da barbearia"
                  enterKeyHint="search"
                  className="min-h-14 w-full rounded-xs border border-ink-700 bg-ink-900 pr-4 pl-12 text-base text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
                />
              </span>
            </label>
          </div>
        </section>

        <section aria-labelledby="lista" className="pb-16">
          <h2 id="lista" className="mb-4 flex items-center gap-3 font-sans text-sm font-semibold tracking-[0.16em] text-ink-500 uppercase">
            {city ? `Barbearias em ${city}` : name ? `Resultados para “${name}”` : 'Barbearias'}
            {shops.isFetching ? <Spinner label="Buscando" /> : null}
          </h2>

          {!searching ? (
            <p className="rounded-xs border border-dashed border-ink-700 px-4 py-8 text-center text-ink-300">Escolha sua cidade para ver as barbearias.</p>
          ) : shops.isError ? (
            <Alert tone="error">{friendlyError(shops.error)}</Alert>
          ) : shops.isLoading ? (
            <Spinner />
          ) : shops.data && shops.data.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shops.data.map((s) => (
                <li key={s.slug}>
                  <ShopCard shop={s} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xs border border-dashed border-ink-700 px-4 py-8 text-center text-ink-300">Nenhuma barbearia encontrada.</p>
          )}
        </section>
      </main>

      <footer className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-3 border-t border-ink-700 px-5 pt-8 pb-10 text-sm text-ink-300">
        <span>
          <Link to="/termos" className="underline underline-offset-4">Termos de Uso</Link> ·{' '}
          <Link to="/privacidade" className="underline underline-offset-4">Privacidade</Link>
        </span>
        <Link to="/para-barbearias" className="text-gold-300 underline underline-offset-4">É dono de barbearia? Área da barbearia</Link>
      </footer>
    </>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

/** Campo de cidade com sugestões das cidades do Maranhão. */
function CityPicker({ value, counts, onFocus, onChange }: { value: string; counts?: Record<string, number>; onFocus: () => void; onChange: (c: string) => void }) {
  const id = useId()
  const [text, setText] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => setText(value), [value])

  const matches = useMemo(() => {
    const t = fold(text)
    if (!t) return []
    const starts = CITIES.filter((c) => c.key.startsWith(t))
    const contains = CITIES.filter((c) => !c.key.startsWith(t) && c.key.includes(t))
    return [...starts, ...contains].slice(0, 8)
  }, [text])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const pick = (name: string) => {
    setText(name)
    setOpen(false)
    onChange(name)
  }
  const count = (key: string) => counts?.[key] ?? 0
  const showList = open && fold(text) !== '' && fold(text) !== fold(value)

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor={`${id}-city`} className="mb-1.5 block text-sm font-medium">Sua cidade</label>
      <span className="relative block">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <input
          id={`${id}-city`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={text}
          placeholder="Digite o nome da cidade"
          onFocus={() => {
            setOpen(true)
            onFocus()
          }}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            setActive(0)
            if (!e.target.value.trim() && value) onChange('')
          }}
          onKeyDown={(e) => {
            if (!showList) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, matches.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && matches[active]) {
              e.preventDefault()
              pick(matches[active].name)
            } else if (e.key === 'Escape') setOpen(false)
          }}
          className="min-h-14 w-full rounded-xs border border-ink-700 bg-ink-900 pr-24 pl-12 text-base text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setText('')
              onChange('')
            }}
            className="absolute top-1/2 right-2 min-h-10 -translate-y-1/2 px-3 text-sm text-gold-300 underline underline-offset-4"
          >
            Trocar
          </button>
        ) : null}
      </span>
      {showList ? (
        <ul id={`${id}-list`} role="listbox" aria-label="Cidades" className="absolute right-0 left-0 z-20 mt-1 overflow-hidden rounded-xs border border-ink-700 bg-ink-900 shadow-xl">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-ink-300">Cidade não encontrada.</li>
          ) : (
            matches.map((c, i) => (
              <li key={c.key} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(c.name)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left ${i === active ? 'bg-ink-800 text-gold-300' : ''}`}
                >
                  <span>
                    {c.name} <span className="text-ink-500">– MA</span>
                  </span>
                  <span className="text-sm whitespace-nowrap text-ink-300">
                    {count(c.key) === 0 ? 'nenhuma ainda' : `${count(c.key)} barbearia${count(c.key) > 1 ? 's' : ''}`}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

function ShopCard({ shop }: { shop: PublicShopCard }) {
  const place = [shop.city, shop.state].filter(Boolean).join(' – ') || shop.address_line
  return (
    <Link
      to={`/${shop.slug}`}
      className={`group block overflow-hidden rounded-xs border bg-ink-900 transition-colors hover:border-gold-500 ${shop.tier === 'premium' ? 'border-gold-500/60' : 'border-ink-700'}`}
    >
      <div className="relative aspect-[16/9] bg-[linear-gradient(165deg,#212227,#0b0b0d_72%)]">
        {shop.cover_url ? (
          <img src={shop.cover_url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span
            aria-hidden="true"
            className="absolute right-3 -bottom-6 font-display text-[7rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(200,160,74,0.35)]"
          >
            {shop.name[0]}
          </span>
        )}
        {shop.tier === 'premium' ? (
          <span className="absolute top-3 left-3 rounded-xs bg-gold-500 px-2 py-1 text-xs font-semibold tracking-wide text-ink-950 uppercase">Destaque</span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 p-4">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt="" loading="lazy" className="size-12 flex-none rounded-full border border-gold-500 object-cover" />
        ) : (
          <span aria-hidden="true" className="grid size-12 flex-none place-items-center rounded-full border border-gold-500 font-display text-lg text-gold-300">
            {shop.name[0]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl group-hover:text-gold-300">{shop.name}</p>
          <p className="truncate text-sm text-ink-300">
            {[place, `${shop.barbers} barbeiro${shop.barbers === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        {shop.min_price_cents !== null ? (
          <p className="text-right text-xs whitespace-nowrap text-ink-300">
            a partir de
            <span className="block font-display text-base text-gold-300">{formatBRL(shop.min_price_cents)}</span>
          </p>
        ) : null}
      </div>
      <p className="border-t border-ink-700 px-4 py-3 text-sm font-semibold text-gold-300 group-hover:underline">Escolher esta barbearia →</p>
    </Link>
  )
}
