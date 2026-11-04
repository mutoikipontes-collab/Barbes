import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { Alert, Spinner } from '@/components/ui'
import { usePanel } from './context'
import { Card, Empty, SectionTitle, SmallButton } from './ui'

export function CustomersPage() {
  const { shop, role } = usePanel()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const data = useQuery({
    queryKey: ['panel', shop.id, 'customers'],
    queryFn: async () => {
      const c = await supabase.from('customers').select('*').eq('shop_id', shop.id).order('name')
      if (c.error) throw c.error
      const a = await supabase.from('appointments').select('customer_id,status,starts_at').eq('shop_id', shop.id)
      if (a.error) throw a.error
      const stats = new Map<string, { visits: number; noShows: number; last: string | null }>()
      for (const x of a.data) {
        const s = stats.get(x.customer_id) ?? { visits: 0, noShows: 0, last: null }
        if (x.status === 'completed') s.visits++
        if (x.status === 'no_show') s.noShows++
        if (x.status !== 'cancelled' && (!s.last || Date.parse(x.starts_at) > Date.parse(s.last))) s.last = x.starts_at
        stats.set(x.customer_id, s)
      }
      return c.data.map((x) => ({ ...x, ...(stats.get(x.id) ?? { visits: 0, noShows: 0, last: null }) }))
    },
  })

  const saveNotes = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase.from('customers').update({ notes: value.trim() || null }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'customers'] })
    },
  })

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const digits = term.replace(/\D/g, '')
    return (data.data ?? []).filter((c) => !term || c.name.toLowerCase().includes(term) || (digits && c.phone.includes(digits)))
  }, [data.data, q])

  return (
    <section>
      <SectionTitle>Clientes</SectionTitle>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome ou celular"
        aria-label="Buscar cliente"
        className="mb-4 min-h-12 w-full rounded-xs border border-ink-700 bg-ink-950 px-4 text-base focus:border-gold-500 focus:outline-none"
      />
      {saveNotes.isError ? <div className="mb-3"><Alert tone="error">{friendlyError(saveNotes.error)}</Alert></div> : null}
      {data.isLoading ? (
        <Spinner />
      ) : data.isError ? (
        <Alert tone="error">{friendlyError(data.error)}</Alert>
      ) : list.length === 0 ? (
        <Empty>{q ? 'Nenhum cliente encontrado.' : 'Os clientes aparecem aqui depois do primeiro agendamento.'}</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <b className="font-medium">{c.name}</b>
                    <small className="block text-ink-300">
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gold-300 underline underline-offset-2">
                        {c.phone}
                      </a>
                      {c.email ? ` · ${c.email}` : ''}
                    </small>
                    <small className="block text-ink-300">
                      {c.visits} atendimento{c.visits === 1 ? '' : 's'} concluído{c.visits === 1 ? '' : 's'}
                      {c.noShows ? ` · ${c.noShows} falta${c.noShows === 1 ? '' : 's'}` : ''}
                      {c.last ? ` · último: ${new Date(c.last).toLocaleDateString('pt-BR', { timeZone: shop.timezone })}` : ''}
                    </small>
                  </div>
                  {role === 'owner' && editing !== c.id ? (
                    <SmallButton
                      onClick={() => {
                        setEditing(c.id)
                        setNotes(c.notes ?? '')
                      }}
                    >
                      Anotações
                    </SmallButton>
                  ) : null}
                </div>
                {editing === c.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      aria-label={`Anotações sobre ${c.name}`}
                      placeholder="Preferências, alergias a produtos, como gosta do corte… (o cliente não vê)"
                      className="w-full rounded-xs border border-ink-700 bg-ink-950 px-4 py-3 text-base focus:border-gold-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <SmallButton tone="gold" disabled={saveNotes.isPending} onClick={() => saveNotes.mutate({ id: c.id, value: notes })}>Salvar</SmallButton>
                      <SmallButton onClick={() => setEditing(null)}>Cancelar</SmallButton>
                    </div>
                  </div>
                ) : c.notes ? (
                  <p className="mt-2 text-sm text-ink-300">{c.notes}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
