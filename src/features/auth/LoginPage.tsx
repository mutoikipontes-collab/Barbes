import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Button, Field } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/conta'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para agendar ou gerenciar sua barbearia."
      footer={
        <>
          Ainda não tem conta? <Link to="/cadastro" state={location.state} className="font-semibold text-gold-400">Criar conta</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" loading={loading}>Entrar</Button>
        <p className="text-center text-sm">
          <Link to="/recuperar-senha" className="text-ink-300 underline-offset-4 hover:underline">Esqueci minha senha</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
