import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { formatBRL } from '@/lib/format'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import type { Tables } from '@/types/database'
import { usePanel } from './context'
import { useServices, useStaff, useStaffServices } from './queries'
import { Card, Empty, SectionTitle, SmallButton, TextArea, Toggle } from './ui'

type Service = Tables<'services'>

/** "45,90" ou "45" -> 4590 centavos */
function parsePrice(v: string): number | null {
  const clean = v.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!clean) return null
  const n = Math.round(Number(clean) * 100)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function ServicesPage() {
  const { shop } = usePanel()
  const services = useServices()
  const staff = useStaff()
  const links = useStaffServices()
  const [editing, setEditing] = useState<Service | 'new' | null>(null)

  const bookable = (staff.data ?? []).filter((b) => b.active && b.bookable)

  return (
    <section>
      <SectionTitle action={editing ? null : <SmallButton tone="gold" onClick={() => setEditing('new')}>Novo serviço</SmallButton>}>Serviços</SectionTitle>

      {editing ? (
        <ServiceForm
          key={editing === 'new' ? 'new' : editing.id}
          service={editing === 'new' ? null : editing}
          staff={bookable}
          linkedStaffIds={editing === 'new' ? bookable.map((b) => b.id) : (links.data ?? []).filter((l) => l.service_id === editing.id).map((l) => l.staff_id)}
          onDone={() => setEditing(null)}
        />
      ) : services.isLoading ? (
        <Spinner />
      ) : services.isError ? (
        <Alert tone="error">{friendlyError(services.error)}</Alert>
      ) : services.data && services.data.length > 0 ? (
        <ul className="border-b border-ink-700">
          {services.data.map((s) => {
            const who = (links.data ?? []).filter((l) => l.service_id === s.id).length
            return (
              <li key={s.id} className={`flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 py-4 ${s.active ? '' : 'opacity-50'}`}>
                <div>
                  <b className="font-display text-lg font-medium">{s.name}</b>
                  <small className="block text-ink-300">
                    {s.duration_min} min · {formatBRL(s.price_cents)} · {who === 0 ? 'nenhum barbeiro faz' : `${who} barbeiro${who > 1 ? 's' : ''}`}
                    {s.active ? '' : ' · desativado'}
                  </small>
                </div>
                <SmallButton onClick={() => setEditing(s)}>Editar</SmallButton>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty>Nenhum serviço ainda. Cadastre o primeiro para abrir os agendamentos em /{shop.slug}.</Empty>
      )}
    </section>
  )
}

function ServiceForm(props: {
  service: Service | null
  staff: Tables<'staff'>[]
  linkedStaffIds: string[]
  onDone: () => void
}) {
  const { service, staff, linkedStaffIds, onDone } = props
  const { shop } = usePanel()
  const queryClient = useQueryClient()
  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [duration, setDuration] = useState(String(service?.duration_min ?? 30))
  const [price, setPrice] = useState(service ? (service.price_cents / 100).toFixed(2).replace('.', ',') : '')
  const [active, setActive] = useState(service?.active ?? true)
  const [who, setWho] = useState<string[]>(linkedStaffIds)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['panel', shop.id] })
    queryClient.invalidateQueries({ queryKey: ['public-shop', shop.slug] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const priceCents = parsePrice(price)!
      const row = {
        name: name.trim(),
        description: description.trim() || null,
        duration_min: Number(duration),
        price_cents: priceCents,
        active,
      }
      let id = service?.id
      if (id) {
        const { error } = await supabase.from('services').update(row).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('services').insert({ ...row, shop_id: shop.id }).select('id').single()
        if (error) throw error
        id = data.id
      }
      // Quem faz este serviço: remove os que saíram e adiciona os que entraram.
      const removed = linkedStaffIds.filter((s) => !who.includes(s))
      const added = who.filter((s) => !linkedStaffIds.includes(s))
      if (removed.length) {
        const { error } = await supabase.from('staff_services').delete().eq('service_id', id).in('staff_id', removed)
        if (error) throw error
      }
      if (added.length) {
        const { error } = await supabase.from('staff_services').insert(added.map((staff_id) => ({ staff_id, service_id: id!, shop_id: shop.id })))
        if (error) throw error
      }
    },
    onSuccess: () => {
      refresh()
      onDone()
    },
  })

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('services').delete().eq('id', service!.id)
      if (error) throw error
    },
    onSuccess: () => {
      refresh()
      onDone()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const d = Number(duration)
    if (name.trim().length < 2) return setFormError('Informe o nome do serviço.')
    if (!Number.isInteger(d) || d < 5 || d > 480) return setFormError('A duração precisa ficar entre 5 e 480 minutos.')
    if (parsePrice(price) === null) return setFormError('Informe o preço. Ex.: 45,00')
    save.mutate()
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <h3 className="font-display text-xl">{service ? 'Editar serviço' : 'Novo serviço'}</h3>
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        {save.isError ? <Alert tone="error">{friendlyError(save.error)}</Alert> : null}
        {remove.isError ? (
          <Alert tone="error">Não foi possível excluir: este serviço já tem agendamentos. Desative-o em vez de excluir.</Alert>
        ) : null}
        <Field label="Nome" name="sv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Corte masculino" />
        <TextArea label="Descrição (opcional)" rows={2} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duração (minutos)" name="sv-duration" type="number" inputMode="numeric" min={5} max={480} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Field label="Preço (R$)" name="sv-price" inputMode="decimal" placeholder="45,00" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-300">Quem faz este serviço</legend>
          {staff.length === 0 ? (
            <p className="text-sm text-ink-300">Nenhum barbeiro cadastrado ainda. Cadastre na aba Equipe.</p>
          ) : (
            staff.map((b) => (
              <Toggle
                key={b.id}
                label={b.display_name}
                checked={who.includes(b.id)}
                onChange={(v) => setWho((w) => (v ? [...w, b.id] : w.filter((x) => x !== b.id)))}
              />
            ))
          )}
        </fieldset>
        <Toggle label="Disponível para agendamento" checked={active} onChange={setActive} />
        <div className="flex flex-wrap gap-3">
          <div className="min-w-48 flex-1 sm:flex-none">
            <Button type="submit" loading={save.isPending}>Salvar</Button>
          </div>
          <SmallButton onClick={onDone} className="min-h-12">Cancelar</SmallButton>
          {service ? (
            <SmallButton
              tone="danger"
              className="min-h-12 sm:ml-auto"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Excluir o serviço "${service.name}"?`)) remove.mutate()
              }}
            >
              Excluir
            </SmallButton>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
