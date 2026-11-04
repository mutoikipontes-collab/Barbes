import { Link } from 'react-router'
import { Wordmark } from '@/components/ui'

/** Sobre nós: o que é o BARBER OS e por que foi criado. */
export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link to="/" aria-label="Início"><Wordmark /></Link>
      <div className="gold-line mt-10 mb-6" />
      <h1 className="text-4xl">Sobre nós</h1>

      <div className="mt-8 space-y-6 leading-relaxed text-ink-300 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink-100">
        <p className="text-lg text-ink-100">
          O BARBER OS nasceu para resolver um problema que todo mundo conhece: marcar um corte de cabelo ainda dá trabalho demais.
        </p>
        <p>
          O cliente manda mensagem no WhatsApp, espera resposta, pergunta se tem horário, e às vezes só descobre mais tarde que o barbeiro já estava ocupado. Do outro lado, o
          barbeiro para o atendimento para responder mensagens, anota horários no caderno e perde clientes que desistem de esperar.
        </p>

        <h2>Por que fomos criados</h2>
        <p>
          Criamos o BARBER OS para que encontrar uma boa barbearia e marcar o horário seja rápido e simples, e para que a barbearia tenha a agenda organizada sem gastar tempo com
          isso.
        </p>
        <ul className="space-y-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>
            <b className="text-ink-100">Para quem quer cortar:</b> escolher a cidade, a barbearia, o barbeiro, o tipo de corte e o horário livre, tudo pelo celular, sem precisar
            criar conta.
          </li>
          <li>
            <b className="text-ink-100">Para a barbearia:</b> agenda online que funciona 24 horas, equipe, serviços, clientes e horários em um só lugar, com a sua própria página
            de agendamento.
          </li>
        </ul>

        <h2>No que acreditamos</h2>
        <ul className="space-y-2 [&_li]:ml-5 [&_li]:list-disc">
          <li>Valorizar as barbearias da região, das grandes às de bairro.</li>
          <li>Respeitar o tempo do cliente e do barbeiro.</li>
          <li>Cuidar dos seus dados: não vendemos informações e cada barbearia só vê os próprios clientes.</li>
        </ul>

        <h2>Faça parte</h2>
        <p>Tem uma barbearia? Cadastre-se e comece a receber agendamentos online. Os primeiros dias são de teste, sem cobrança.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/" className="btn-gold inline-flex min-h-12 items-center rounded-xs px-6 font-semibold">
            Encontrar barbearia
          </Link>
          <Link
            to="/cadastro"
            state={{ from: '/conta?nova-barbearia=1' }}
            className="inline-flex min-h-12 items-center rounded-xs border border-ink-700 px-6 font-semibold text-ink-100 hover:border-gold-500"
          >
            Cadastrar minha barbearia
          </Link>
        </div>
      </div>

      <p className="mt-12 text-sm text-ink-300">
        <Link to="/termos" className="underline underline-offset-4">Termos de Uso</Link> ·{' '}
        <Link to="/privacidade" className="underline underline-offset-4">Política de Privacidade</Link>
      </p>
    </main>
  )
}
