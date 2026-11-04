import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError, functionErrorMessage } from '@/lib/errors'
import { Alert, Button, Field } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
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
    // A conta é criada já confirmada por uma função no servidor (sem e-mail de confirmação).
    const { error: fnError } = await supabase.functions.invoke('signup', {
      body: { full_name: fullName, email, password },
    })
    if (fnError) {
      setLoading(false)
      return setError(await functionErrorMessage(fnError))
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    navigate('/conta', { replace: true })
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
