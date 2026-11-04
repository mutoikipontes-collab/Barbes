import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Button, Field } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/conta` },
    })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    // Com confirmação de e-mail ligada, a sessão só existe depois do clique no link.
    if (data.session) navigate('/conta', { replace: true })
    else setSentTo(email)
  }

  if (sentTo) {
    return (
      <AuthLayout title="Confirme seu e-mail" footer={<Link to="/entrar" className="font-semibold text-gold-400">Ir para o login</Link>}>
        <Alert tone="success">
          Enviamos um link para <strong>{sentTo}</strong>. Abra o e-mail e toque no link para ativar sua conta. Se não
          encontrar, olhe a caixa de spam.
        </Alert>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Uma conta serve para agendar como cliente e para cadastrar sua barbearia."
      footer={
        <>
          Já tem conta? <Link to="/entrar" className="font-semibold text-gold-400">Entrar</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field label="Nome completo" name="full_name" autoComplete="name" required maxLength={80} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required />
        <Field label="Senha" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Mínimo de 8 caracteres." />
        <Button type="submit" loading={loading}>Criar conta</Button>
      </form>
    </AuthLayout>
  )
}
