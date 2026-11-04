import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/ui'

const UPDATED = '4 de novembro de 2026'

function Layout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link to="/" aria-label="Início"><Wordmark /></Link>
      <h1 className="mt-10 text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-300">Última atualização: {UPDATED}</p>
      <div className="mt-8 space-y-6 leading-relaxed text-ink-100 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink-300 [&_li]:text-ink-300">
        {children}
      </div>
      <p className="mt-12 text-sm text-ink-300">
        <Link to="/termos" className="underline underline-offset-4">Termos de Uso</Link> ·{' '}
        <Link to="/privacidade" className="underline underline-offset-4">Política de Privacidade</Link>
      </p>
    </main>
  )
}

export function TermsPage() {
  return (
    <Layout title="Termos de Uso">
      <p>Estes termos valem para quem usa o BARBER OS: barbearias (proprietários e barbeiros) e clientes que agendam horários.</p>
      <h2>1. O que é o BARBER OS</h2>
      <p>Uma plataforma de agendamento e gestão para barbearias. Cada barbearia tem sua página, sua agenda e seus dados, separados das demais.</p>
      <h2>2. Conta</h2>
      <ul>
        <li>Você é responsável pelos dados que informa e por manter sua senha em segredo.</li>
        <li>Use seu nome e um contato verdadeiros. Contas falsas ou em nome de outra pessoa podem ser removidas.</li>
      </ul>
      <h2>3. Para clientes</h2>
      <ul>
        <li>O agendamento é um compromisso com a barbearia. Cancele ou remarque dentro do prazo que ela definir.</li>
        <li>Preço, atendimento e pagamento do serviço são de responsabilidade da barbearia.</li>
      </ul>
      <h2>4. Para barbearias</h2>
      <ul>
        <li>O uso é por assinatura mensal, com período de teste grátis. Sem fidelidade: é possível cancelar quando quiser.</li>
        <li>Mensalidade não paga após o vencimento e a tolerância pode suspender a página de agendamento até a regularização.</li>
        <li>A barbearia é responsável pelas informações que publica (serviços, preços, fotos, horários) e por tratar os dados dos clientes de acordo com a lei.</li>
      </ul>
      <h2>5. Uso proibido</h2>
      <ul>
        <li>Tentar acessar dados de outras barbearias ou de outros clientes.</li>
        <li>Publicar conteúdo ilegal, ofensivo ou que não seja seu (por exemplo, fotos de terceiros sem autorização).</li>
        <li>Usar o sistema para enviar mensagens em massa não solicitadas.</li>
      </ul>
      <h2>6. Disponibilidade</h2>
      <p>Trabalhamos para manter o sistema no ar e os dados protegidos, mas podem ocorrer falhas e manutenções. Não nos responsabilizamos por perdas causadas por indisponibilidade temporária.</p>
      <h2>7. Mudanças nestes termos</h2>
      <p>Podemos atualizar estes termos. Mudanças importantes serão avisadas no sistema.</p>
      <h2>8. Contato</h2>
      <p>Dúvidas sobre estes termos: fale com o suporte do BARBER OS.</p>
    </Layout>
  )
}

export function PrivacyPage() {
  return (
    <Layout title="Política de Privacidade">
      <p>Esta política explica quais dados o BARBER OS coleta, para que usa e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><b>Agendamento (clientes, sem conta):</b> nome, e-mail, celular, serviço, barbeiro, data, horário e observações que você escrever.</li>
        <li><b>Neste aparelho:</b> um código do seu agendamento fica salvo no navegador, para você ver, remarcar e cancelar em “Meus agendamentos”. Quem tiver o link do agendamento também consegue abri-lo; não compartilhe.</li>
        <li><b>Conta (barbearias):</b> nome, e-mail e senha (guardada de forma criptografada; ninguém consegue lê-la).</li>
        <li><b>Barbearia:</b> dados da empresa, endereço, serviços, preços, horários e fotos publicadas pelo proprietário.</li>
        <li><b>Uso técnico:</b> informações de acesso necessárias para o sistema funcionar com segurança.</li>
      </ul>
      <h2>2. Para que usamos</h2>
      <ul>
        <li>Fazer, mostrar, remarcar e cancelar agendamentos.</li>
        <li>Permitir que a barbearia e o barbeiro entrem em contato com você sobre o seu horário (por exemplo, pelo WhatsApp).</li>
        <li>Manter a sua conta segura e prestar suporte.</li>
        <li>Cobrar a assinatura das barbearias.</li>
      </ul>
      <p>Não vendemos seus dados e não os usamos para publicidade de terceiros.</p>
      <h2>3. Quem vê os seus dados</h2>
      <ul>
        <li>Clientes: a barbearia onde você agendou (proprietário e barbeiro que vai atender) vê seu nome, e-mail, celular e histórico naquela barbearia. Outras barbearias não veem.</li>
        <li>Barbearias: os dados de cada barbearia ficam separados das demais.</li>
        <li>Provedores que fazem o sistema funcionar (hospedagem e banco de dados), apenas para essa finalidade.</li>
      </ul>
      <h2>4. Por quanto tempo guardamos</h2>
      <p>Enquanto sua conta existir, enquanto a barbearia mantiver o histórico de atendimentos ou enquanto for necessário para cumprir obrigações legais. Depois disso, os dados são excluídos ou anonimizados.</p>
      <h2>5. Seus direitos</h2>
      <p>Você pode pedir a qualquer momento: acesso aos seus dados, correção, exclusão da conta, informação sobre com quem compartilhamos e revogação de consentimento. Para clientes, a correção ou exclusão pode ser pedida à barbearia onde você agendou ou ao suporte do BARBER OS.</p>
      <h2>6. Segurança</h2>
      <p>Usamos conexão criptografada, senhas protegidas e regras no banco de dados que impedem que uma barbearia ou um cliente veja dados de outro.</p>
      <h2>7. Contato</h2>
      <p>Para exercer seus direitos ou tirar dúvidas, fale com o suporte do BARBER OS.</p>
    </Layout>
  )
}
