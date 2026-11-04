import { Link } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useMyShops } from '@/features/auth/queries'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { SiteLink } from '@/lib/site'

/** Página inicial do site da barbearia: entrada de donos e barbeiros. */
export function OwnerEntryPage() {
  const { session } = useAuth()
  const shops = useMyShops()
  const mine = shops.data ?? []

  return (
    <AuthLayout
      title="Área da barbearia"
      subtitle="Para donos e barbeiros: agenda, serviços, equipe, clientes e a página de agendamento da sua barbearia."
      footer={<SiteLink site="client" to="/" className="font-semibold text-gold-300">Sou cliente: quero agendar um horário</SiteLink>}
    >
      {session ? (
        <div className="grid gap-3">
          {mine.map((s) => (
            <Link key={s.id} to={`/painel/${s.id}`} className="btn-gold inline-flex min-h-12 items-center justify-center rounded-xs font-semibold">
              Abrir painel: {s.name}
            </Link>
          ))}
          <Link
            to="/conta?nova-barbearia=1"
            className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold hover:border-gold-500"
          >
            Cadastrar {mine.length ? 'outra' : 'minha'} barbearia
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          <Link to="/entrar" state={{ from: '/' }} className="btn-gold inline-flex min-h-12 items-center justify-center rounded-xs font-semibold">
            Entrar
          </Link>
          <Link
            to="/cadastro"
            state={{ from: '/conta?nova-barbearia=1' }}
            className="inline-flex min-h-12 items-center justify-center rounded-xs border border-ink-700 font-semibold hover:border-gold-500"
          >
            Cadastrar minha barbearia
          </Link>
          <p className="mt-2 text-sm text-ink-300">Primeiro você cria sua conta; em seguida cadastra a barbearia. O período de teste é grátis.</p>
        </div>
      )}
    </AuthLayout>
  )
}
