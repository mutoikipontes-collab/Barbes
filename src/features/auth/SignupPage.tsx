import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError, functionErrorMessage } from '@/lib/errors'
import { Alert, Button, Field } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/conta'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const fullName = String(form.get('full_name')).trim().replace(/\s+/g, ' ')
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    setError(null)

    if (fullName.length < 2 || fullName.length > 80) return setError('Informe seu nome (de 2 a 80 caracteres).')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Informe um e-mail válido.')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (!accepted) return setError('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.')

    setLoading(true)
    // A conta é criada já confirmada por uma função no servidor (sem e-mail de confirmação).
    const { error: fnError } = await supabase.functions.invoke('signup', {
      body: { full_name: fullName, email, password, terms_accepted_at: new Date().toISOString() },
    })
    if (fnError) {
      setLoading(false)
      return setError(await functionErrorMessage(fnError))
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Uma conta serve para agendar como cliente e para cadastrar sua barbearia."
      footer={
        <>
          Já tem conta? <Link to="/entrar" state={location.state} className="font-semibold text-gold-400">Entrar</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field label="Nome completo" name="full_name" autoComplete="name" required maxLength={80} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Mínimo de 8 caracteres." />
        <label className="flex items-start gap-3 text-sm text-ink-300">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-5 flex-none accent-[#c8a04a]" />
          <span>
            Li e aceito os{' '}
            <Link to="/termos" target="_blank" className="text-gold-300 underline underline-offset-2">Termos de Uso</Link> e a{' '}
            <Link to="/privacidade" target="_blank" className="text-gold-300 underline underline-offset-2">Política de Privacidade</Link>.
          </span>
        </label>
        <Button type="submit" loading={loading}>Criar conta</Button>
      </form>
    </AuthLayout>
  )
}
