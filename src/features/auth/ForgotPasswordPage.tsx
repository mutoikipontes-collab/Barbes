import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Button, Field } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    setSent(true)
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={<Link to="/entrar" className="font-semibold text-gold-400">Voltar para o login</Link>}
    >
      {sent ? (
        // Mesma mensagem exista ou não a conta, para não revelar quais e-mails estão cadastrados.
        <Alert tone="success">Se houver uma conta com este e-mail, o link chegará em alguns minutos.</Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required />
          <Button type="submit" loading={loading}>Enviar link</Button>
        </form>
      )}
    </AuthLayout>
  )
}
