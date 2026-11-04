import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatBRL, whatsappLink } from '@/lib/format'
import { usePanel } from './context'

type Billing = {
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled'
  current_period_end: string | null
  days_left: number | null
  plan: string
  price_cents: number
  pix_key: string | null
  pix_holder: string | null
  pix_code: string | null
  support_whatsapp: string | null
  grace_days: number
}

const dateBR = (ymd: string) => ymd.split('-').reverse().join('/')

/** Aviso de mensalidade, só para o dono: teste grátis, vencimento próximo ou vencido, com o Pix para pagar. */
export function BillingBanner() {
  const { shop, role } = usePanel()
  const [copied, setCopied] = useState<'key' | 'code' | null>(null)
  const [open, setOpen] = useState(false)
  const billing = useQuery({
    queryKey: ['panel', shop.id, 'billing'],
    enabled: role === 'owner',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shop_billing', { p_shop_id: shop.id })
      if (error) throw error
      return data as unknown as Billing | null
    },
  })

  const b = billing.data
  if (role !== 'owner' || !b || !b.current_period_end) return null
  const left = b.days_left ?? 0
  const due = dateBR(b.current_period_end)
  const price = formatBRL(b.price_cents)

  let tone = 'border-ink-700'
  let text: string
  if (b.status === 'trialing') {
    text = left > 0 ? `Teste grátis: faltam ${left} dia${left === 1 ? '' : 's'} (até ${due}).` : left === 0 ? 'Seu teste grátis termina hoje.' : `Seu teste grátis terminou em ${due}.`
    if (left <= 3) tone = 'border-gold-500/60'
  } else if (b.status === 'active') {
    if (left > 5) return null
    text = left >= 0 ? `Sua mensalidade de ${price} vence ${left === 0 ? 'hoje' : `em ${left} dia${left === 1 ? '' : 's'} (${due})`}.` : `Sua mensalidade venceu em ${due}.`
    tone = left < 0 ? 'border-danger/60' : 'border-gold-500/60'
  } else if (b.status === 'past_due') {
    text = `Pagamento pendente desde ${due}. Regularize para manter sua página no ar.`
    tone = 'border-danger/60'
  } else if (b.status === 'suspended') {
    text = 'Sua página está suspensa por falta de pagamento. Pague a mensalidade para reativar.'
    tone = 'border-danger/60'
  } else {
    return null
  }

  const receiptMsg = `Olá! Paguei a mensalidade do BARBER OS da barbearia ${shop.name} (${price}). Segue o comprovante.`

  return (
    <div className={`mb-6 rounded-xs border bg-ink-900 px-4 py-3 text-sm ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>{text}</p>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-h-10 font-semibold text-gold-300 underline underline-offset-4">
          {open ? 'Fechar' : b.status === 'trialing' ? 'Como assinar' : 'Pagar com Pix'}
        </button>
      </div>
      {open ? (
        <div className="mt-3 space-y-3 border-t border-ink-700 pt-3">
          <p className="text-ink-300">
            Plano {b.plan}: <b className="text-ink-100">{price}/mês</b>. Pague por Pix e envie o comprovante. A liberação é feita em seguida.
          </p>
          {b.pix_code ? (
            <div className="space-y-2">
              <p className="text-ink-300">Pix copia e cola (o valor já vem preenchido):</p>
              <p className="max-h-20 overflow-auto rounded-xs bg-ink-950 px-3 py-2 font-mono text-xs break-all select-all">{b.pix_code}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(b.pix_code!)
                    setCopied('code')
                  } catch {
                    setCopied(null)
                  }
                }}
                className="btn-gold inline-flex min-h-11 w-full items-center justify-center rounded-xs px-4 font-semibold sm:w-auto"
              >
                {copied === 'code' ? 'Código copiado ✓ Cole no app do banco' : 'Copiar Pix copia e cola'}
              </button>
            </div>
          ) : null}
          {b.pix_key ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xs bg-ink-950 px-3 py-2 font-mono break-all select-all">{b.pix_key}</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(b.pix_key!)
                    setCopied('key')
                  } catch {
                    setCopied(null)
                  }
                }}
                className="inline-flex min-h-10 items-center rounded-xs border border-ink-700 px-4 font-semibold hover:border-gold-500"
              >
                {copied === 'key' ? 'Chave copiada ✓' : 'Copiar chave Pix'}
              </button>
              {b.pix_holder ? <span className="text-ink-300">Titular: {b.pix_holder}</span> : null}
            </div>
          ) : (
            <p className="text-ink-300">A chave Pix ainda não foi informada pelo BARBER OS. Fale com o suporte.</p>
          )}
          {b.support_whatsapp ? (
            <a href={whatsappLink(b.support_whatsapp, receiptMsg)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xs border border-ink-700 px-4 font-semibold hover:border-gold-500">
              Enviar comprovante no WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
