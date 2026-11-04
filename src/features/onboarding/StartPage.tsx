import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError, functionErrorMessage } from '@/lib/errors'
import { slugify } from '@/lib/format'
import { captureRef, clearRef, getRef } from '@/lib/referral'
import { Alert, Button, Field, FullPageLoading } from '@/components/ui'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAuth } from '@/features/auth/AuthProvider'

/** Cadastro rápido: conta + barbearia num formulário só, e cai direto no painel. */
export function StartPage() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useEffect(() => captureRef(location.search), [location.search])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [ownerCuts, setOwnerCuts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <FullPageLoading />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!session) {
      if (fullName.trim().length < 2) return setError('Informe seu nome.')
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Informe um e-mail válido.')
      if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    }
    if (shopName.trim().length < 2) return setError('Informe o nome da barbearia.')
    if (slug.length < 3) return setError('O endereço da página precisa ter pelo menos 3 letras.')

    setBusy(true)
    try {
      if (!session) {
        const { error: fnError } = await supabase.functions.invoke('signup', {
          body: { full_name: fullName.trim(), email: email.trim(), password },
        })
        if (fnError) throw new Error(await functionErrorMessage(fnError))
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (loginError) throw new Error(friendlyError(loginError))
      }
      const { data, error: shopError } = await supabase.rpc('create_shop', {
        p_name: shopName.trim(),
        p_slug: slug,
        p_ref: getRef(),
        p_owner_cuts: ownerCuts,
      })
      if (shopError) throw new Error(friendlyError(shopError))
      clearRef()
      await queryClient.invalidateQueries({ queryKey: ['my-shops'] })
      navigate(`/painel/${(data as { id: string }).id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Crie a página da sua barbearia"
      subtitle="Grátis para testar, sem cartão. Em seguida você cadastra os serviços e já pode receber agendamentos."
      footer={
        session ? null : (
          <>
            Já tem conta? <Link to="/entrar" state={{ from: '/comecar' }} className="font-semibold text-gold-400">Entrar</Link>
          </>
        )
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {!session ? (
          <>
            <Field label="Seu nome" name="st-full" autoComplete="name" maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Field label="E-mail" name="st-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Senha" name="st-pass" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <p className="text-ink-300">Criando com a conta <b className="text-ink-100">{session.user.email}</b>.</p>
        )}
        <Field
          label="Nome da barbearia"
          name="st-shop"
          maxLength={80}
          value={shopName}
          onChange={(e) => {
            setShopName(e.target.value)
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
        />
        <Field
          label="Endereço da sua página"
          name="st-slug"
          autoCapitalize="none"
          maxLength={40}
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }}
          hint={<>Seus clientes vão acessar: <b className="text-ink-100">{window.location.host}/{slug || 'sua-barbearia'}</b></>}
        />
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={ownerCuts} onChange={(e) => setOwnerCuts(e.target.checked)} className="size-5 accent-[#c8a04a]" />
          Eu também corto cabelo (atendo clientes)
        </label>
        <Button type="submit" loading={busy}>Criar minha página</Button>
        <p className="text-center text-xs text-ink-300">Ao criar, você concorda em usar o BARBER OS de forma honesta com seus clientes.</p>
      </form>
    </AuthLayout>
  )
}
