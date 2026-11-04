import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Button, Field, FullPageLoading } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './AuthProvider'

export function ResetPasswordPage() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authLoading) return <FullPageLoading />

  if (!session) {
    return (
      <AuthLayout title="Entre primeiro" footer={<Link to="/recuperar-senha" className="font-semibold text-gold-400">Recuperar acesso</Link>}>
        <Alert tone="error">Para trocar a senha, entre na sua conta (pode ser com a senha temporária).</Alert>
      </AuthLayout>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    setError(null)
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (password !== String(form.get('confirm'))) return setError('As senhas não conferem.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    navigate('/conta', { replace: true, state: { notice: 'Senha alterada com sucesso.' } })
  }

  return (
    <AuthLayout title="Trocar senha" footer={<Link to="/conta" className="font-semibold text-gold-400">Voltar para minha conta</Link>}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field label="Nova senha" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <Field label="Repita a nova senha" name="confirm" type="password" autoComplete="new-password" required />
        <Button type="submit" loading={loading}>Salvar nova senha</Button>
      </form>
    </AuthLayout>
  )
}
