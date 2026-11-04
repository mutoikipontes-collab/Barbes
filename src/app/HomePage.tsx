import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { Wordmark } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { captureRef } from '@/lib/referral'
import { whatsappLink } from '@/lib/format'

const SUPPORT = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined

const STEPS = [
  { n: '1', t: 'Crie sua página', d: 'Nome da barbearia, serviços, preços e barbeiros. Leva poucos minutos, pelo celular.' },
  { n: '2', t: 'Divulgue o link', d: 'Na bio do Instagram, no status do WhatsApp e num QR Code no balcão.' },
  { n: '3', t: 'Receba agendamentos', d: 'O cliente escolhe serviço, barbeiro e horário. Tudo cai organizado na sua agenda.' },
]

const FEATURES = [
  { t: 'Agenda sem conflito', d: 'O sistema só oferece horários livres. Dois clientes nunca marcam o mesmo horário com o mesmo barbeiro.' },
  { t: 'Cada barbeiro com a sua agenda', d: 'Expediente, folgas e serviços de cada um. O barbeiro pode ter login próprio e ver só o que é dele.' },
  { t: 'Conversa direto no WhatsApp', d: 'Depois de agendar, o cliente chama o barbeiro com um toque. Lembretes com mensagem pronta.' },
  { t: 'Bloqueios e feriados', d: 'Fechou para almoço, folga ou feriado? Bloqueie o período e ninguém agenda ali.' },
  { t: 'Seus clientes organizados', d: 'Histórico de visitas, faltas e anotações que só a equipe vê.' },
  { t: 'Números do mês', d: 'Atendimentos do dia, faturamento previsto e os serviços mais procurados.' },
]

const FAQ = [
  { q: 'Preciso de computador?', a: 'Não. Tudo funciona pelo celular: criar a página, cadastrar serviços e acompanhar a agenda.' },
  { q: 'Meu cliente precisa baixar aplicativo?', a: 'Não. Ele abre o link da sua barbearia no navegador e agenda em menos de um minuto.' },
  { q: 'Como eu pago a mensalidade?', a: 'Por Pix. Você começa no período de teste, sem cartão, e só paga se decidir continuar.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Não tem fidelidade nem multa.' },
  { q: 'E se um cliente faltar?', a: 'Você marca a falta na agenda e ela fica no histórico do cliente.' },
]

export function HomePage() {
  const { session } = useAuth()
  const location = useLocation()
  useEffect(() => captureRef(location.search), [location.search])

  const cta = (
    <Link to="/comecar" className="btn-gold inline-flex min-h-[52px] items-center justify-center rounded-xs px-7 text-[16px] font-semibold">
      Criar minha página grátis
    </Link>
  )

  return (
    <>
      <header className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-5 py-5">
        <Wordmark />
        <nav aria-label="Principal" className="flex items-center gap-5 text-[15px]">
          <a href="#precos" className="hidden hover:text-gold-300 sm:inline">Preço</a>
          <Link to={session ? '/conta' : '/entrar'} className="hover:text-gold-300">{session ? 'Minha conta' : 'Entrar'}</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[68rem] items-center gap-12 px-5 pt-[clamp(2.5rem,8vw,5.5rem)] pb-16 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="gold-line mb-8" />
            <h1 className="max-w-[15ch] text-[clamp(2.7rem,9.5vw,5.4rem)] leading-[1.02] tracking-[-0.015em]">
              A agenda da sua barbearia, aberta 24 horas.
            </h1>
            <p className="mt-6 mb-8 max-w-[34rem] text-[1.1rem] text-ink-300">
              Seus clientes marcam pelo link, escolhem o barbeiro e o horário. Você para de responder “tem horário?” o dia inteiro no WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              {cta}
              <Link to="/casa-ebano" className="text-gold-300 underline underline-offset-4">Ver uma página de exemplo</Link>
            </div>
            <p className="mt-6 text-sm text-ink-300">Teste grátis · sem cartão · R$ 29,90/mês depois, se gostar</p>
          </div>
          <PhoneMock />
        </section>

        <section className="mx-auto max-w-[68rem] px-5 py-14">
          <h2 className="mb-8 text-[clamp(1.8rem,5vw,2.5rem)]">Como funciona</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xs border border-ink-700 bg-ink-900/60 p-5">
                <span className="font-display text-4xl text-gold-500">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-ink-300">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[68rem] px-5 py-14">
          <h2 className="mb-8 text-[clamp(1.8rem,5vw,2.5rem)]">Feito para o dia a dia da barbearia</h2>
          <ul className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.t} className="border-t border-ink-700 pt-5">
                <h3 className="font-display text-xl">{f.t}</h3>
                <p className="mt-1 text-ink-300">{f.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="precos" className="mx-auto max-w-[68rem] px-5 py-14">
          <div className="mx-auto max-w-md rounded-xs border border-gold-500/60 bg-[linear-gradient(165deg,#212227,#0b0b0d_72%)] p-7 shadow-[inset_0_1px_0_rgba(230,207,147,0.12)]">
            <p className="text-sm tracking-[0.16em] text-gold-300 uppercase">Plano Essencial</p>
            <p className="mt-3 font-display text-5xl">
              R$ 29,90<span className="font-sans text-base text-ink-300">/mês</span>
            </p>
            <p className="mt-2 text-ink-300">Uma barbearia, barbeiros e agendamentos sem limite.</p>
            <ul className="mt-6 space-y-2">
              {['Página de agendamento com a sua cara', 'Agenda de cada barbeiro', 'Cadastro de serviços e preços', 'Clientes e histórico', 'Painel com números do mês', 'Suporte pelo WhatsApp'].map((i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className="text-gold-500">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            <div className="mt-7 grid">{cta}</div>
            <p className="mt-3 text-center text-sm text-ink-300">Comece grátis. Pagamento por Pix, sem fidelidade.</p>
          </div>
        </section>

        <section className="mx-auto max-w-[68rem] px-5 py-14">
          <div className="rounded-xs border border-ink-700 p-6 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="text-[clamp(1.6rem,4.5vw,2.1rem)]">Indique e ganhe</h2>
              <p className="mt-2 max-w-xl text-ink-300">
                Conhece outro dono de barbearia? Cada barbearia ganha um link de indicação no painel. Indicou e ela virou assinante, você ganha 1 mês grátis.
              </p>
            </div>
            <div className="mt-5 md:mt-0">{cta}</div>
          </div>
        </section>

        <section className="mx-auto max-w-[68rem] px-5 py-14">
          <h2 className="mb-6 text-[clamp(1.8rem,5vw,2.5rem)]">Perguntas frequentes</h2>
          <div className="border-b border-ink-700">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-t border-ink-700 py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg">
                  {f.q}
                  <span aria-hidden="true" className="text-gold-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-ink-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[68rem] px-5 pt-6 pb-20 text-center">
          <h2 className="mx-auto max-w-[18ch] text-[clamp(2rem,6vw,3.2rem)] leading-tight">Sua próxima cadeira vazia pode ser um agendamento.</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            {cta}
            {SUPPORT ? (
              <a href={whatsappLink(SUPPORT, 'Olá! Quero saber mais sobre o BARBER OS para a minha barbearia.')} target="_blank" rel="noreferrer" className="text-gold-300 underline underline-offset-4">
                Tirar dúvidas no WhatsApp
              </a>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[68rem] flex-wrap justify-between gap-2 border-t border-ink-700 px-5 pt-8 pb-10 text-sm text-ink-300">
        <span>© {new Date().getFullYear()} BARBER OS</span>
        <span>Agenda e gestão para barbearias</span>
      </footer>
    </>
  )
}

/** Ilustração de um celular com a tela de agendamento (desenhada em HTML, sem dados reais). */
function PhoneMock() {
  const slots = ['09:00', '09:30', '10:15', '11:00', '14:30', '15:15']
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-[19rem] rotate-[2deg] rounded-[2.4rem] border border-ink-700 bg-ink-950 p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(200,160,74,0.15)]">
      <div className="rounded-[1.9rem] border border-ink-800 bg-ink-900 px-4 pt-6 pb-5">
        <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-ink-700" />
        <p className="text-xs text-ink-300">Etapa 4 de 6</p>
        <div className="mt-2 h-[3px] bg-ink-700"><i className="block h-full w-2/3 bg-gold-500" /></div>
        <p className="mt-4 font-display text-xl">Escolha o horário</p>
        <p className="text-xs text-ink-300">Corte + barba com o barbeiro</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {slots.map((t, i) => (
            <span
              key={t}
              className={`rounded-xs border py-2.5 text-center text-sm ${i === 2 ? 'border-gold-500 bg-[#2a2518] text-gold-300 shadow-[inset_3px_0_0_var(--color-gold-500)]' : 'border-ink-700 bg-ink-800'}`}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="btn-gold mt-5 block rounded-xs py-3 text-center text-sm font-semibold">Confirmar agendamento</span>
      </div>
    </div>
  )
}
