import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { Alert, Spinner, Wordmark } from '@/components/ui'
import { SiteLink } from '@/lib/site'
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
  min_price_cents: number | null
  barbers: number
}

/** Site do cliente: encontrar uma barbearia e agendar. A área do dono é o outro site (site da barbearia). */
export function HomePage() {
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') ?? '')
  const [query, setQuery] = useState(params.get('q') ?? '')

  // espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(text.trim())
      setParams(text.trim() ? { q: text.trim() } : {}, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [text, setParams])

  const shops = useQuery({
    queryKey: ['public-shops', query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_public_shops', { p_query: query || undefined })
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
          <h1 className="max-w-[16ch] text-[clamp(2.6rem,9vw,4.8rem)] leading-[1.02] tracking-[-0.015em]">Encontre sua barbearia e agende.</h1>
          <p className="mt-5 max-w-[34rem] text-[1.08rem] text-ink-300">Escolha o serviço, o barbeiro e o horário. Sem ligar, sem esperar resposta no WhatsApp.</p>

          <label className="mt-8 block max-w-xl">
            <span className="sr-only">Buscar barbearia por nome ou cidade</span>
            <span className="relative block">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nome da barbearia ou cidade"
                enterKeyHint="search"
                className="min-h-14 w-full rounded-xs border border-ink-700 bg-ink-900 pr-4 pl-12 text-base text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
              />
            </span>
          </label>
        </section>

        <section aria-labelledby="lista" className="pb-16">
          <h2 id="lista" className="mb-4 flex items-center gap-3 font-sans text-sm font-semibold tracking-[0.16em] text-ink-500 uppercase">
            {query ? `Resultados para “${query}”` : 'Barbearias'}
            {shops.isFetching ? <Spinner label="Buscando" /> : null}
          </h2>

          {shops.isError ? (
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
            <p className="rounded-xs border border-dashed border-ink-700 px-4 py-8 text-center text-ink-300">
              {query ? 'Nenhuma barbearia encontrada. Tente outro nome ou cidade.' : 'Nenhuma barbearia disponível ainda.'}
            </p>
          )}
        </section>
      </main>

      <footer className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-3 border-t border-ink-700 px-5 pt-8 pb-10 text-sm text-ink-300">
        <span>
          <Link to="/termos" className="underline underline-offset-4">Termos de Uso</Link> ·{' '}
          <Link to="/privacidade" className="underline underline-offset-4">Privacidade</Link>
        </span>
        <SiteLink site="business" to="/" className="text-gold-300 underline underline-offset-4">É dono de barbearia? Site da barbearia</SiteLink>
      </footer>
    </>
  )
}

function ShopCard({ shop }: { shop: PublicShopCard }) {
  const place = [shop.city, shop.state].filter(Boolean).join(' – ') || shop.address_line
  return (
    <Link
      to={`/${shop.slug}`}
      className="group block overflow-hidden rounded-xs border border-ink-700 bg-ink-900 transition-colors hover:border-gold-500"
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
    </Link>
  )
}
