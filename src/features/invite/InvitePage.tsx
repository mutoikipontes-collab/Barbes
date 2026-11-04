import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Button, FullPageLoading } from '@/components/ui'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useAuth } from '@/features/auth/AuthProvider'

export function InvitePage() {
  const { token = '' } = useParams()
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_staff_invite', { p_token: token })
      if (error) throw error
      return data as { shop_name: string; display_name: string } | null
    },
  })

  const accept = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('accept_staff_invite', { p_token: token })
      if (error) throw error
      return (data as { shop_id: string }).shop_id
    },
    onSuccess: async (shopId) => {
      await queryClient.invalidateQueries({ queryKey: ['my-shops'] })
      navigate(`/painel/${shopId}`, { replace: true })
    },
  })

  if (loading || invite.isLoading) return <FullPageLoading />

  if (invite.isError || !invite.data) {
    return (
      <AuthLayout title="Convite indisponível">
        <Alert tone="error">{invite.isError ? friendlyError(invite.error) : 'Este convite expirou ou já foi usado. Peça um novo ao proprietário da barbearia.'}</Alert>
      </AuthLayout>
    )
  }

  const back = { from: `/convite/${token}` }
  return (
    <AuthLayout title="Convite para a equipe" subtitle={`${invite.data.shop_name} convidou você para acessar a agenda como ${invite.data.display_name}.`}>
      {accept.isError ? <div className="mb-5"><Alert tone="error">{friendlyError(accept.error)}</Alert></div> : null}
      {session ? (
        <div className="space-y-4">
          <p className="text-ink-300">Você vai entrar com a conta <b className="text-ink-100">{session.user.email}</b>.</p>
          <Button type="button" onClick={() => accept.mutate()} loading={accept.isPending}>Aceitar convite</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="mb-2 text-ink-300">Para aceitar, crie sua conta ou entre. Depois você volta para esta página.</p>
          <Link to="/cadastro" state={back} className="btn-gold inline-flex min-h-12 items-center justify-center rounded-xs font-semibold">Criar conta</Link>
          <Link to="/entrar" state={back} className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold hover:border-gold-500">Entrar</Link>
        </div>
      )}
    </AuthLayout>
  )
}
