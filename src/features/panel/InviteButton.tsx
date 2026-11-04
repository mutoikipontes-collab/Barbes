import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert } from '@/components/ui'
import type { Tables } from '@/types/database'
import { usePanel } from './context'
import { SmallButton } from './ui'
import { siteUrl } from '@/lib/site'

/** Gera o link de convite para o barbeiro entrar no painel com a conta dele. */
export function InviteButton({ member }: { member: Tables<'staff'> }) {
  const { shop } = usePanel()
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_staff_invite', { p_staff_id: member.id })
      if (error) throw error
      return new URL(siteUrl('business', `/convite/${data}`), window.location.origin).href
    },
    onSuccess: setLink,
  })

  if (member.user_id) return <p className="text-sm text-success">Tem acesso ao painel com login próprio.</p>

  const message = link
    ? `Olá, ${member.display_name.split(' ')[0]}! Este é o seu convite para a agenda da ${shop.name} no BARBER OS: ${link} (vale por 7 dias).`
    : ''

  return (
    <div className="space-y-3 rounded-xs border border-ink-700 p-3">
      <p className="text-sm text-ink-300">
        Acesso ao painel: o barbeiro vê a própria agenda, marca atendimentos e bloqueia os próprios horários.
      </p>
      {create.isError ? <Alert tone="error">{friendlyError(create.error)}</Alert> : null}
      {!link ? (
        <SmallButton onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? 'Gerando…' : 'Gerar convite'}
        </SmallButton>
      ) : (
        <>
          <p className="break-all rounded-xs bg-ink-950 px-3 py-2 text-sm">{link}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-gold inline-flex min-h-10 items-center rounded-xs px-4 text-sm font-semibold"
            >
              Enviar pelo WhatsApp
            </a>
            <SmallButton
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link)
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'Copiado' : 'Copiar link'}
            </SmallButton>
          </div>
          <p className="text-xs text-ink-300">Gerar um convite novo invalida o anterior. O barbeiro precisa criar uma conta (ou entrar) para aceitar.</p>
        </>
      )}
    </div>
  )
}
