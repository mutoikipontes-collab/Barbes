import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Spinner } from '@/components/ui'
import { usePanel } from './context'
import { Card, SectionTitle, SmallButton } from './ui'

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <SmallButton
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        } catch {
          setDone(false)
        }
      }}
    >
      {done ? 'Copiado ✓' : label}
    </SmallButton>
  )
}

export function PromotePage() {
  const { shop, role } = usePanel()
  const link = `${window.location.origin}/${shop.slug}`
  const short = `${window.location.host}/${shop.slug}`
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(link, { width: 720, margin: 2, color: { dark: '#050505', light: '#ffffff' }, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(null))
  }, [link])

  const clientMsg = `Agora você pode marcar seu horário na ${shop.name} pelo celular, a qualquer hora: ${link}\nÉ só escolher o serviço, o barbeiro e o horário.`
  const bio = `✂️ Agende seu horário: ${short}`
  const statusMsg = `Agenda aberta! Marque seu corte pelo link: ${link}`

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle>Divulgar</SectionTitle>
        <p className="-mt-2 mb-5 text-ink-300">Quanto mais clientes conhecerem o link, menos você responde “tem horário?” no WhatsApp.</p>

        <Card>
          <p className="text-sm text-ink-300">Link da sua página</p>
          <p className="mt-1 font-display text-xl break-all text-gold-300">{short}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={link} label="Copiar link" />
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xs border border-ink-700 px-4 text-sm font-semibold hover:border-gold-500">
              Abrir página
            </a>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl">QR Code para o balcão</h3>
          <p className="mt-1 text-sm text-ink-300">Imprima e cole no espelho, no balcão ou na porta. O cliente aponta a câmera e agenda o próximo corte antes de sair.</p>
          {qr ? (
            <>
              <img src={qr} alt={`QR Code para ${short}`} className="mx-auto mt-4 w-48 rounded-xs bg-white p-2" />
              <a href={qr} download={`qrcode-${shop.slug}.png`} className="btn-gold mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xs font-semibold">
                Baixar QR Code
              </a>
            </>
          ) : (
            <div className="mt-4"><Spinner label="Gerando QR Code" /></div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="font-display text-xl">Mensagem para os clientes</h3>
            <p className="mt-2 text-sm whitespace-pre-line text-ink-300">{clientMsg}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(clientMsg)}`} target="_blank" rel="noreferrer" className="btn-gold inline-flex min-h-10 items-center rounded-xs px-4 text-sm font-semibold">
                Enviar no WhatsApp
              </a>
              <CopyButton text={clientMsg} />
            </div>
          </Card>
          <Card>
            <h3 className="font-display text-xl">Bio do Instagram</h3>
            <p className="mt-2 text-sm text-ink-300">{bio}</p>
            <div className="mt-3"><CopyButton text={bio} /></div>
          </Card>
          <Card>
            <h3 className="font-display text-xl">Status do WhatsApp</h3>
            <p className="mt-2 text-sm text-ink-300">{statusMsg}</p>
            <div className="mt-3"><CopyButton text={statusMsg} /></div>
          </Card>
        </div>
      </section>

      {role === 'owner' ? <Referrals /> : null}
    </div>
  )
}

function Referrals() {
  const { shop } = usePanel()
  const link = `${window.location.origin}/?ref=${shop.slug}`
  const msg = `Uso o BARBER OS na ${shop.name}: meus clientes agendam pelo link e eu paro de responder "tem horário?" o dia todo. Dá para testar grátis: ${link}`
  const list = useQuery({
    queryKey: ['panel', shop.id, 'referrals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_referrals', { p_shop_id: shop.id })
      if (error) throw error
      return (data ?? []) as unknown as { name: string; created_at: string; status: string }[]
    },
  })
  const paying = (list.data ?? []).filter((r) => r.status === 'active').length

  return (
    <section>
      <SectionTitle>Indique e ganhe</SectionTitle>
      <Card className="border-gold-500/50">
        <p>
          Conhece outro dono de barbearia? Mande seu link. Quando a barbearia indicada virar assinante, você ganha <b className="text-gold-300">1 mês grátis</b>.
        </p>
        <p className="mt-3 text-sm break-all text-ink-300">{link}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="btn-gold inline-flex min-h-10 items-center rounded-xs px-4 text-sm font-semibold">
            Indicar pelo WhatsApp
          </a>
          <CopyButton text={link} label="Copiar link" />
        </div>
        <div className="mt-5 border-t border-ink-700 pt-4">
          {list.isLoading ? (
            <Spinner />
          ) : list.isError ? (
            <Alert tone="error">{friendlyError(list.error)}</Alert>
          ) : list.data && list.data.length > 0 ? (
            <>
              <p className="text-sm text-ink-300">
                {list.data.length} indicação{list.data.length === 1 ? '' : 'ões'} · {paying} assinante{paying === 1 ? '' : 's'}
              </p>
              <ul className="mt-2 space-y-1">
                {list.data.map((r) => (
                  <li key={r.name + r.created_at} className="flex justify-between gap-3 text-sm">
                    <span>{r.name}</span>
                    <span className="text-ink-300">{r.status === 'active' ? 'Assinante ✓' : 'Em teste'}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-300">Nenhuma indicação ainda.</p>
          )}
        </div>
      </Card>
    </section>
  )
}
