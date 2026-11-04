import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { WEEKDAYS_LONG } from '@/lib/time'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import { usePanel } from './context'
import { useShopHours } from './queries'
import { Card, Select, SectionTitle, TextArea, Toggle } from './ui'

export function SettingsPage() {
  return (
    <div className="space-y-12">
      <ShopForm />
      <ShopHoursForm />
    </div>
  )
}

function ShopForm() {
  const { shop } = usePanel()
  const queryClient = useQueryClient()
  const [f, setF] = useState({
    name: shop.name,
    description: shop.description ?? '',
    phone: shop.phone ?? '',
    whatsapp: shop.whatsapp ?? '',
    email: shop.email ?? '',
    address_line: shop.address_line ?? '',
    city: shop.city ?? '',
    state: shop.state ?? '',
    postal_code: shop.postal_code ?? '',
    slot_step_min: String(shop.slot_step_min),
    min_notice_min: String(shop.min_notice_min),
    max_advance_days: String(shop.max_advance_days),
    cancel_limit_min: String(shop.cancel_limit_min),
  })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setSaved(false)
    setF((s) => ({ ...s, [k]: e.target.value }) as typeof f)
  }

  const save = useMutation({
    mutationFn: async () => {
      const opt = (v: string) => (v.trim() ? v.trim() : null)
      const { error } = await supabase
        .from('shops')
        .update({
          name: f.name.trim(),
          description: opt(f.description),
          phone: opt(f.phone),
          whatsapp: opt(f.whatsapp.replace(/[^\d+]/g, '')),
          email: opt(f.email),
          address_line: opt(f.address_line),
          city: opt(f.city),
          state: opt(f.state.toUpperCase()),
          postal_code: opt(f.postal_code),
          slot_step_min: Number(f.slot_step_min),
          min_notice_min: Number(f.min_notice_min),
          max_advance_days: Number(f.max_advance_days),
          cancel_limit_min: Number(f.cancel_limit_min),
        })
        .eq('id', shop.id)
      if (error) throw error
    },
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'shop'] })
      queryClient.invalidateQueries({ queryKey: ['public-shop', shop.slug] })
      queryClient.invalidateQueries({ queryKey: ['my-shops'] })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  return (
    <section>
      <SectionTitle>Dados da barbearia</SectionTitle>
      <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2" noValidate>
        <div className="md:col-span-2 space-y-3">
          {save.isError ? <Alert tone="error">{friendlyError(save.error)}</Alert> : null}
          {saved ? <Alert tone="success">Alterações salvas. A página pública já mostra os novos dados.</Alert> : null}
        </div>
        <Field label="Nome" name="name" value={f.name} onChange={set('name')} maxLength={80} required />
        <Field label="Endereço da página" name="slug" value={`/${shop.slug}`} disabled hint="O endereço não muda depois de criado." />
        <div className="md:col-span-2">
          <TextArea label="Apresentação (aparece no topo da página)" rows={3} maxLength={300} value={f.description} onChange={set('description')} />
        </div>
        <Field label="WhatsApp com DDD" name="whatsapp" inputMode="tel" placeholder="+55 99 91234-5678" value={f.whatsapp} onChange={set('whatsapp')} hint="Use +55 e o DDD, para o link do WhatsApp funcionar." />
        <Field label="Telefone" name="phone" inputMode="tel" value={f.phone} onChange={set('phone')} />
        <Field label="E-mail" name="email" type="email" value={f.email} onChange={set('email')} />
        <Field label="Endereço (rua, número, bairro)" name="address_line" value={f.address_line} onChange={set('address_line')} />
        <Field label="Cidade" name="city" value={f.city} onChange={set('city')} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="UF" name="state" maxLength={2} value={f.state} onChange={set('state')} />
          <Field label="CEP" name="postal_code" inputMode="numeric" value={f.postal_code} onChange={set('postal_code')} />
        </div>

        <h3 className="mt-4 font-display text-xl md:col-span-2">Regras de agendamento</h3>
        <Select label="Intervalo entre horários oferecidos" value={f.slot_step_min} onChange={set('slot_step_min')}>
          {[5, 10, 15, 20, 30, 60].map((m) => (
            <option key={m} value={m}>de {m} em {m} minutos</option>
          ))}
        </Select>
        <Select label="Antecedência mínima para agendar" value={f.min_notice_min} onChange={set('min_notice_min')}>
          {[0, 15, 30, 60, 120, 180, 360, 720, 1440].map((m) => (
            <option key={m} value={m}>{m === 0 ? 'Sem antecedência' : m < 60 ? `${m} minutos` : `${m / 60} hora${m > 60 ? 's' : ''}`}</option>
          ))}
        </Select>
        <Select label="Agenda aberta até" value={f.max_advance_days} onChange={set('max_advance_days')}>
          {[7, 14, 30, 45, 60, 90].map((d) => (
            <option key={d} value={d}>{d} dias à frente</option>
          ))}
        </Select>
        <Select label="Cliente pode cancelar online até" value={f.cancel_limit_min} onChange={set('cancel_limit_min')}>
          {[0, 30, 60, 120, 180, 360, 720, 1440, 2880].map((m) => (
            <option key={m} value={m}>{m === 0 ? 'A qualquer momento antes' : m < 60 ? `${m} minutos antes` : `${m / 60} hora${m > 60 ? 's' : ''} antes`}</option>
          ))}
        </Select>
        <div className="md:col-span-2 md:max-w-xs">
          <Button type="submit" loading={save.isPending} disabled={f.name.trim().length < 2}>Salvar dados</Button>
        </div>
      </form>
    </section>
  )
}

type DayRow = { open: boolean; opens: string; closes: string; lunch: boolean; lunchStart: string; lunchEnd: string }

function ShopHoursForm() {
  const { shop } = usePanel()
  const hours = useShopHours()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<DayRow[] | null>(null)
  const [saved, setSaved] = useState(false)

  // Monta o formulário a partir do banco: até dois turnos por dia (manhã e tarde = intervalo de almoço).
  const current: DayRow[] =
    rows ??
    Array.from({ length: 7 }, (_, d) => {
      const list = (hours.data ?? []).filter((h) => h.weekday === d)
      if (list.length === 0) return { open: false, opens: '09:00', closes: '19:00', lunch: false, lunchStart: '12:00', lunchEnd: '13:00' }
      const first = list[0]
      const lastRow = list[list.length - 1]
      return {
        open: true,
        opens: first.opens_at.slice(0, 5),
        closes: lastRow.closes_at.slice(0, 5),
        lunch: list.length > 1,
        lunchStart: list.length > 1 ? first.closes_at.slice(0, 5) : '12:00',
        lunchEnd: list.length > 1 ? list[1].opens_at.slice(0, 5) : '13:00',
      }
    })

  const update = (d: number, patch: Partial<DayRow>) => {
    setSaved(false)
    setRows(current.map((r, i) => (i === d ? { ...r, ...patch } : r)))
  }

  const save = useMutation({
    mutationFn: async () => {
      const inserts: { shop_id: string; weekday: number; opens_at: string; closes_at: string }[] = []
      current.forEach((r, d) => {
        if (!r.open) return
        if (r.closes <= r.opens) throw new Error(`${WEEKDAYS_LONG[d]}: o fechamento precisa ser depois da abertura.`)
        if (r.lunch) {
          if (!(r.opens < r.lunchStart && r.lunchStart < r.lunchEnd && r.lunchEnd < r.closes)) {
            throw new Error(`${WEEKDAYS_LONG[d]}: o almoço precisa ficar dentro do expediente.`)
          }
          inserts.push({ shop_id: shop.id, weekday: d, opens_at: r.opens, closes_at: r.lunchStart })
          inserts.push({ shop_id: shop.id, weekday: d, opens_at: r.lunchEnd, closes_at: r.closes })
        } else {
          inserts.push({ shop_id: shop.id, weekday: d, opens_at: r.opens, closes_at: r.closes })
        }
      })
      const del = await supabase.from('shop_hours').delete().eq('shop_id', shop.id)
      if (del.error) throw del.error
      if (inserts.length) {
        const ins = await supabase.from('shop_hours').insert(inserts)
        if (ins.error) throw ins.error
      }
    },
    onSuccess: () => {
      setSaved(true)
      setRows(null)
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id, 'shop_hours'] })
      queryClient.invalidateQueries({ queryKey: ['public-shop', shop.slug] })
    },
  })

  const order = [1, 2, 3, 4, 5, 6, 0]

  return (
    <section>
      <SectionTitle>Horário de funcionamento</SectionTitle>
      {hours.isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {save.isError ? <Alert tone="error">{save.error instanceof Error && !('code' in save.error) ? save.error.message : friendlyError(save.error)}</Alert> : null}
          {saved ? <Alert tone="success">Horários salvos.</Alert> : null}
          {order.map((d) => {
            const r = current[d]
            return (
              <Card key={d}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <b className="font-medium">{WEEKDAYS_LONG[d]}</b>
                  <Toggle checked={r.open} onChange={(v) => update(d, { open: v })} label={r.open ? 'Aberto' : 'Fechado'} />
                </div>
                {r.open ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <TimeInput label="Abre" value={r.opens} onChange={(v) => update(d, { opens: v })} />
                      <TimeInput label="Fecha" value={r.closes} onChange={(v) => update(d, { closes: v })} />
                    </div>
                    <Toggle checked={r.lunch} onChange={(v) => update(d, { lunch: v })} label="Pausa para almoço" />
                    {r.lunch ? (
                      <div className="grid grid-cols-2 gap-3">
                        <TimeInput label="Pausa começa" value={r.lunchStart} onChange={(v) => update(d, { lunchStart: v })} />
                        <TimeInput label="Pausa termina" value={r.lunchEnd} onChange={(v) => update(d, { lunchEnd: v })} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            )
          })}
          <div className="md:max-w-xs">
            <Button type="button" onClick={() => save.mutate()} loading={save.isPending}>Salvar horários</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ink-300">{label}</span>
      <input
        type="time"
        step={300}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-xs border border-ink-700 bg-ink-950 px-3 text-base text-ink-100 focus:border-gold-500 focus:outline-none"
      />
    </label>
  )
}
