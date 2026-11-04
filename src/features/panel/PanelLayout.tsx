import { Link, NavLink, Navigate, Outlet, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, FullPageLoading, Wordmark } from '@/components/ui'
import { useMyShops } from '@/features/auth/queries'
import { PanelContext } from './context'

const TABS = [
  { to: '', label: 'Início', end: true, ownerOnly: true },
  { to: 'agenda', label: 'Agenda', end: false, ownerOnly: false },
  { to: 'servicos', label: 'Serviços', end: false, ownerOnly: true },
  { to: 'equipe', label: 'Equipe', end: false, ownerOnly: true },
  { to: 'clientes', label: 'Clientes', end: false, ownerOnly: false },
  { to: 'divulgar', label: 'Divulgar', end: false, ownerOnly: false },
  { to: 'configuracoes', label: 'Configurações', end: false, ownerOnly: true },
]

export function PanelLayout() {
  const { shopId = '' } = useParams()
  const myShops = useMyShops()
  const membership = myShops.data?.find((s) => s.id === shopId)

  const shop = useQuery({
    queryKey: ['panel', shopId, 'shop'],
    enabled: !!membership,
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single()
      if (error) throw error
      return data
    },
  })

  if (myShops.isLoading || (membership && shop.isLoading)) return <FullPageLoading />
  if (myShops.isError) return <ErrorPage message={friendlyError(myShops.error)} />
  if (!membership) return <Navigate to="/conta" replace />
  if (shop.isError || !shop.data) return <ErrorPage message={friendlyError(shop.error)} />

  const role = membership.role
  const tabs = TABS.filter((t) => role === 'owner' || !t.ownerOnly)

  return (
    <PanelContext.Provider value={{ shop: shop.data, role, staffId: membership.staff_id }}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-[68rem] items-center justify-between gap-3 px-4 pt-4">
            <Link to="/conta" aria-label="Minha conta"><Wordmark className="text-[14px]" /></Link>
            <Link to={`/${shop.data.slug}`} className="truncate text-sm text-gold-300 underline underline-offset-4">
              Ver página pública
            </Link>
          </div>
          <div className="mx-auto max-w-[68rem] px-4 pt-3">
            <p className="font-display text-xl">{shop.data.name}</p>
          </div>
          <nav aria-label="Painel" className="mx-auto flex max-w-[68rem] gap-1 overflow-x-auto px-2 [scrollbar-width:none]">
            {tabs.map((t) => (
              <NavLink
                key={t.label}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex min-h-12 items-center border-b-2 px-3 text-[15px] whitespace-nowrap ${isActive ? 'border-gold-500 text-ink-100' : 'border-transparent text-ink-300 hover:text-ink-100'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[68rem] px-4 py-8">
          <Outlet />
        </main>
      </div>
    </PanelContext.Provider>
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <Alert tone="error">{message}</Alert>
      <Link to="/conta" className="mt-6 inline-block text-gold-300">Voltar para minha conta</Link>
    </main>
  )
}
