import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL, slugify } from '@/lib/format'
import { Alert, Button, Field, Spinner, Wordmark } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useIsPlatformAdmin, useMyShops, useProfile } from '@/features/auth/queries'

const STATUS_LABEL: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento pendente',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
}

export function AccountPage() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const profile = useProfile()
  const shops = useMyShops()
  const isAdmin = useIsPlatformAdmin()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Início"><Wordmark /></Link>
        <button onClick={signOut} className="min-h-11 rounded-lg px-3 text-sm text-ink-300 hover:text-ink-100">
          Sair
        </button>
      </header>

      <h1 className="mt-10 font-display text-4xl font-semibold">
        Olá{profile.data?.full_name ? `, ${profile.data.full_name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-ink-300">{session?.user.email}</p>

      {notice ? <div className="mt-6"><Alert tone="success">{notice}</Alert></div> : null}

      {isAdmin.data ? (
        <Link to="/admin" className="mt-6 block rounded-lg border border-gold-500/40 px-4 py-3 text-gold-300">
          Administração do BARBER OS
        </Link>
      ) : null}

      <section className="mt-10" aria-labelledby="minhas-barbearias">
        <h2 id="minhas-barbearias" className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
          Minhas barbearias
        </h2>
        {shops.isLoading ? (
          <div className="mt-4"><Spinner /></div>
        ) : shops.isError ? (
          <div className="mt-4"><Alert tone="error">{friendlyError(shops.error)}</Alert></div>
        ) : shops.data && shops.data.length > 0 ? (
          <ul className="mt-4 divide-y divide-ink-800 rounded-lg border border-ink-800">
            {shops.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-ink-500">
                    /{s.slug} · {s.role === 'owner' ? 'Proprietário' : 'Barbeiro'}
                  </p>
                </div>
                <span className="text-sm text-gold-300">
                  {STATUS_LABEL[s.subscription.status] ?? s.subscription.status} · {formatBRL(s.subscription.price_cents)}/mês
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-ink-300">Você ainda não tem uma barbearia cadastrada.</p>
        )}
      </section>

      <CreateShopForm />
    </main>
  )
}

function CreateShopForm() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_shop', { p_name: name.trim(), p_slug: slug })
      if (error) throw error
      return data as { id: string; slug: string }
    },
    onSuccess: (data) => {
      setCreated(data.slug)
      setName('')
      setSlug('')
      setSlugTouched(false)
      queryClient.invalidateQueries({ queryKey: ['my-shops'] })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setCreated(null)
    mutation.mutate()
  }

  return (
    <section className="mt-12" aria-labelledby="nova-barbearia">
      <h2 id="nova-barbearia" className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
        Cadastrar barbearia
      </h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-5" noValidate>
        {mutation.isError ? <Alert tone="error">{friendlyError(mutation.error)}</Alert> : null}
        {created ? <Alert tone="success">Barbearia cadastrada. Endereço reservado: /{created}</Alert> : null}
        <Field
          label="Nome da barbearia"
          name="shop_name"
          value={name}
          maxLength={80}
          onChange={(e) => {
            setName(e.target.value)
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
          required
        />
        <Field
          label="Endereço da página"
          name="shop_slug"
          value={slug}
          maxLength={40}
          autoCapitalize="none"
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }}
          hint="Letras minúsculas, números e hífen. Ex.: navalha-e-cia"
          required
        />
        <Button type="submit" loading={mutation.isPending} disabled={name.trim().length < 2 || slug.length < 3}>
          Cadastrar barbearia
        </Button>
        <p className="text-sm text-ink-500">A barbearia começa no período de teste. Nenhuma cobrança é feita agora.</p>
      </form>
    </section>
  )
}
