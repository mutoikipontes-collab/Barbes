import { Link } from 'react-router'
import { whatsappLink } from '@/lib/format'
import { AuthLayout } from './AuthLayout'
import { usePlatformInfo } from './platform'


// Enquanto a recuperação por e-mail não está configurada no Supabase, o acesso é recuperado
// pelo suporte: o administrador gera uma senha temporária e a pessoa troca depois de entrar.
export function ForgotPasswordPage() {
  const SUPPORT = usePlatformInfo().data?.support_whatsapp ?? null
  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Peça uma senha temporária ao suporte do BARBER OS. Depois de entrar, troque por uma senha sua em Minha conta."
      footer={<Link to="/entrar" className="font-semibold text-gold-300">Voltar para o login</Link>}
    >
      <ol className="list-decimal space-y-2 pl-5 text-ink-300">
        <li>Fale com o suporte informando o e-mail da sua conta.</li>
        <li>Você recebe uma senha temporária.</li>
        <li>Entre com ela e toque em “Trocar senha” em Minha conta.</li>
      </ol>
      {SUPPORT ? (
        <a
          href={whatsappLink(SUPPORT, 'Olá! Preciso recuperar o acesso à minha conta do BARBER OS. Meu e-mail é: ')}
          target="_blank"
          rel="noreferrer"
          className="btn-gold mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xs font-semibold"
        >
          Falar com o suporte no WhatsApp
        </a>
      ) : (
        <p className="mt-8 text-sm text-ink-300">Se você agenda numa barbearia, peça o contato do suporte a ela.</p>
      )}
    </AuthLayout>
  )
}
