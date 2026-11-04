import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL, toWhatsapp } from '@/lib/format'
import { Alert, Button, Field, Spinner, Wordmark } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useIsPlatformAdmin, useMyShops, useProfile } from '@/features/auth/queries'
import { MyAppointments } from './MyAppointments'

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
        <button onClick={signOut} className="min-h-11 rounded-xs px-3 text-sm text-ink-300 hover:text-ink-100">
          Sair
        </button>
      </header>

      <h1 className="mt-10 font-display text-4xl font-semibold">
        Olá{profile.data?.full_name ? `, ${profile.data.full_name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-ink-300">{session?.user.email}</p>

      {notice ? <div className="mt-6"><Alert tone="success">{notice}</Alert></div> : null}

      {isAdmin.data ? (
        <Link to="/admin" className="mt-6 block rounded-xs border border-gold-500/40 px-4 py-3 text-gold-300">
          Administração do BARBER OS
        </Link>
      ) : null}

      <MyAppointments />

      {shops.isError ? (
        <div className="mt-6"><Alert tone="error">{friendlyError(shops.error)}</Alert></div>
      ) : shops.data && shops.data.length > 0 ? (
        <section className="mt-10" aria-labelledby="minhas-barbearias">
          <h2 id="minhas-barbearias" className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
            Minhas barbearias
          </h2>
          <ul className="mt-4 divide-y divide-ink-800 rounded-xs border border-ink-800">
            {shops.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
                <div>
                  <Link to={`/${s.slug}`} className="font-semibold hover:text-gold-300">{s.name}</Link>
                  <p className="text-sm text-ink-500">
                    /{s.slug} · {s.role === 'owner' ? 'Proprietário' : 'Barbeiro'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {s.role === 'owner' ? (
                    <span className="text-sm text-gold-300">
                      {STATUS_LABEL[s.subscription.status] ?? s.subscription.status} · {formatBRL(s.subscription.price_cents)}/mês
                    </span>
                  ) : null}
                  <Link to={`/painel/${s.id}`} className="btn-gold inline-flex min-h-10 items-center rounded-xs px-4 text-sm font-semibold">
                    Abrir painel
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProfileForm />

      {shops.isLoading ? <div className="mt-6"><Spinner /></div> : <CreateShopForm />}
    </main>
  )
}

function CreateShopForm() {
  return (
    <section className="mt-12 rounded-xs border border-ink-700 p-4">
      <p className="text-ink-300">Tem uma barbearia? Crie sua página e receba agendamentos online. Teste grátis, sem cartão.</p>
      <Link to="/comecar" className="mt-3 inline-flex min-h-11 items-center font-semibold text-gold-300 underline underline-offset-4">
        Cadastrar minha barbearia
      </Link>
    </section>
  )
}

function ProfileForm() {
  const { session } = useAuth()
  const profile = useProfile()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim().replace(/\s+/g, ' '), phone: phone.trim() ? toWhatsapp(phone) : null })
        .eq('id', session!.user.id)
      if (error) throw error
    },
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  if (!profile.data) return null
  return (
    <section className="mt-10" aria-labelledby="meu-perfil">
      <h2 id="meu-perfil" className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">Meu perfil</h2>
      {!editing ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p>
            {profile.data.full_name ?? 'Sem nome'}
            <span className="block text-sm text-ink-300">{profile.data.phone ?? 'Celular não informado'}</span>
          </p>
          <div className="flex gap-4">
          <Link to="/redefinir-senha" className="inline-flex min-h-11 items-center text-gold-300 underline underline-offset-4">Trocar senha</Link>
          <button
            type="button"
            onClick={() => {
              setName(profile.data?.full_name ?? '')
              setPhone(profile.data?.phone ?? '')
              setErr(null)
              setEditing(true)
            }}
            className="min-h-11 text-gold-300 underline underline-offset-4"
          >
            Editar
          </button>
          </div>
        </div>
      ) : (
        <form
          className="mt-4 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setErr(null)
            const n = name.trim()
            if (n.length < 2 || n.length > 80) return setErr('Informe seu nome (de 2 a 80 caracteres).')
            if (phone.trim() && !toWhatsapp(phone)) return setErr('Celular inválido. Use o DDD, ex.: (99) 91234-5678.')
            save.mutate()
          }}
        >
          {err ? <Alert tone="error">{err}</Alert> : null}
          {save.isError ? <Alert tone="error">{friendlyError(save.error)}</Alert> : null}
          <Field label="Nome" name="pf-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          <Field label="Celular com DDD" name="pf-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(99) 91234-5678" />
          <div className="flex gap-3">
            <div className="min-w-40"><Button type="submit" loading={save.isPending}>Salvar</Button></div>
            <button type="button" onClick={() => setEditing(false)} className="min-h-12 px-4 text-ink-300">Cancelar</button>
          </div>
        </form>
      )}
    </section>
  )
}
