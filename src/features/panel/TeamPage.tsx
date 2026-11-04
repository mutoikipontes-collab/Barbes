import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { WEEKDAYS_LONG } from '@/lib/time'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import type { Tables } from '@/types/database'
import { Initials } from '@/features/booking/BookingDialog'
import { usePanel } from './context'
import { useServices, useShopHours, useStaff, useStaffHours, useStaffServices } from './queries'
import { TimeInput } from './SettingsPage'
import { InviteButton } from './InviteButton'
import { Card, Empty, SectionTitle, SmallButton, TextArea, Toggle } from './ui'

type Staff = Tables<'staff'>
type DayHours = { on: boolean; start: string; end: string }

const ORDER = [1, 2, 3, 4, 5, 6, 0]

export function TeamPage() {
  const staff = useStaff()
  const links = useStaffServices()
  const hours = useStaffHours()
  const [editing, setEditing] = useState<Staff | 'new' | null>(null)

  return (
    <section>
      <SectionTitle action={editing ? null : <SmallButton tone="gold" onClick={() => setEditing('new')}>Novo barbeiro</SmallButton>}>Equipe</SectionTitle>

      {editing ? (
        <StaffForm key={editing === 'new' ? 'new' : editing.id} member={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      ) : staff.isLoading ? (
        <Spinner />
      ) : staff.isError ? (
        <Alert tone="error">{friendlyError(staff.error)}</Alert>
      ) : staff.data && staff.data.length > 0 ? (
        <ul className="border-b border-ink-700">
          {staff.data.map((b) => {
            const nServices = (links.data ?? []).filter((l) => l.staff_id === b.id).length
            const nDays = new Set((hours.data ?? []).filter((h) => h.staff_id === b.id).map((h) => h.weekday)).size
            return (
              <li key={b.id} className={`flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 py-4 ${b.active ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <Initials name={b.display_name} />
                  <div>
                    <b className="font-display text-lg font-medium">{b.display_name}</b>
                    <small className="block text-ink-300">
                      {b.role === 'owner' ? 'Proprietário' : 'Barbeiro'}
                      {b.bookable ? ` · ${nServices} serviço${nServices === 1 ? '' : 's'} · ${nDays} dia${nDays === 1 ? '' : 's'} na semana` : ' · não atende'}
                      {b.active ? '' : ' · inativo'}
                      {b.role !== 'owner' && b.user_id ? ' · com acesso' : ''}
                    </small>
                  </div>
                </div>
                <SmallButton onClick={() => setEditing(b)}>Editar</SmallButton>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty>Nenhum barbeiro ainda.</Empty>
      )}
      <p className="mt-6 text-sm text-ink-300">
        Barbeiros cadastrados aqui aparecem na sua página e recebem agendamentos. Para dar acesso ao painel, abra o barbeiro e toque em “Gerar convite”.
      </p>
    </section>
  )
}

/** Espera os dados carregarem antes de montar o formulário (os valores iniciais vêm deles). */
function StaffForm(props: { member: Staff | null; onDone: () => void }) {
  const services = useServices()
  const links = useStaffServices()
  const staffHours = useStaffHours()
  const shopHours = useShopHours()
  if (services.isLoading || links.isLoading || staffHours.isLoading || shopHours.isLoading) return <Spinner />
  return <StaffFormInner {...props} />
}

function StaffFormInner({ member, onDone }: { member: Staff | null; onDone: () => void }) {
  const { shop } = usePanel()
  const queryClient = useQueryClient()
  const services = useServices()
  const links = useStaffServices()
  const staffHours = useStaffHours()
  const shopHours = useShopHours()

  const initialServices = member ? (links.data ?? []).filter((l) => l.staff_id === member.id).map((l) => l.service_id) : (services.data ?? []).filter((s) => s.active).map((s) => s.id)

  // Expediente inicial: o que já existe, ou (barbeiro novo) o horário de funcionamento da barbearia.
  const initialHours: DayHours[] = Array.from({ length: 7 }, (_, d) => {
    if (member) {
      const h = (staffHours.data ?? []).find((x) => x.staff_id === member.id && x.weekday === d)
      return h ? { on: true, start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) } : { on: false, start: '09:00', end: '19:00' }
    }
    const list = (shopHours.data ?? []).filter((x) => x.weekday === d)
    return list.length
      ? { on: true, start: list[0].opens_at.slice(0, 5), end: list[list.length - 1].closes_at.slice(0, 5) }
      : { on: false, start: '09:00', end: '19:00' }
  })

  const [name, setName] = useState(member?.display_name ?? '')
  const [bio, setBio] = useState(member?.bio ?? '')
  const [specialties, setSpecialties] = useState((member?.specialties ?? []).join(', '))
  const [bookable, setBookable] = useState(member?.bookable ?? true)
  const [active, setActive] = useState(member?.active ?? true)
  const [svc, setSvc] = useState<string[]>(initialServices)
  const [days, setDays] = useState<DayHours[]>(initialHours)
  const [formError, setFormError] = useState<string | null>(null)

  const setDay = (d: number, patch: Partial<DayHours>) => setDays((all) => all.map((x, i) => (i === d ? { ...x, ...patch } : x)))

  const save = useMutation({
    mutationFn: async () => {
      const row = {
        display_name: name.trim(),
        bio: bio.trim() || null,
        specialties: specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 6),
        bookable,
        active,
      }
      let id = member?.id
      if (id) {
        const { error } = await supabase.from('staff').update(row).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('staff').insert({ ...row, shop_id: shop.id, role: 'barber' }).select('id').single()
        if (error) throw error
        id = data.id
      }
      // Serviços
      const before = member ? (links.data ?? []).filter((l) => l.staff_id === id).map((l) => l.service_id) : []
      const removed = before.filter((s) => !svc.includes(s))
      const added = svc.filter((s) => !before.includes(s))
      if (removed.length) {
        const { error } = await supabase.from('staff_services').delete().eq('staff_id', id).in('service_id', removed)
        if (error) throw error
      }
      if (added.length) {
        const { error } = await supabase.from('staff_services').insert(added.map((service_id) => ({ staff_id: id!, service_id, shop_id: shop.id })))
        if (error) throw error
      }
      // Expediente: substitui a semana inteira
      const del = await supabase.from('staff_hours').delete().eq('staff_id', id)
      if (del.error) throw del.error
      const rows = days
        .map((d, weekday) => ({ ...d, weekday }))
        .filter((d) => d.on)
        .map((d) => ({ shop_id: shop.id, staff_id: id!, weekday: d.weekday, start_time: d.start, end_time: d.end }))
      if (rows.length) {
        const { error } = await supabase.from('staff_hours').insert(rows)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id] })
      queryClient.invalidateQueries({ queryKey: ['public-shop', shop.slug] })
      onDone()
    },
  })

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('staff').delete().eq('id', member!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panel', shop.id] })
      queryClient.invalidateQueries({ queryKey: ['public-shop', shop.slug] })
      onDone()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (name.trim().length < 2) return setFormError('Informe o nome do barbeiro.')
    const bad = days.findIndex((d) => d.on && d.end <= d.start)
    if (bad >= 0) return setFormError(`${WEEKDAYS_LONG[bad]}: o fim do expediente precisa ser depois do início.`)
    save.mutate()
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <h3 className="font-display text-xl">{member ? `Editar ${member.display_name}` : 'Novo barbeiro'}</h3>
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        {save.isError ? <Alert tone="error">{friendlyError(save.error)}</Alert> : null}
        {remove.isError ? <Alert tone="error">Não foi possível excluir: este barbeiro já tem atendimentos. Marque como inativo.</Alert> : null}

        <Field label="Nome que aparece para o cliente" name="st-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Field label="Especialidades (separe por vírgula)" name="st-spec" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Degradê, navalha" />
        <TextArea label="Apresentação curta (opcional)" rows={2} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />

        <Toggle label={member?.role === 'owner' ? 'Eu também atendo clientes' : 'Atende clientes (recebe agendamentos)'} checked={bookable} onChange={setBookable} />

        {bookable ? (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-300">Serviços que faz</legend>
              {(services.data ?? []).length === 0 ? (
                <p className="text-sm text-ink-300">Nenhum serviço cadastrado. Cadastre na aba Serviços.</p>
              ) : (
                (services.data ?? []).map((s) => (
                  <Toggle key={s.id} label={s.name} checked={svc.includes(s.id)} onChange={(v) => setSvc((all) => (v ? [...all, s.id] : all.filter((x) => x !== s.id)))} />
                ))
              )}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-ink-300">Expediente (a pausa de almoço da barbearia já é respeitada)</legend>
              {ORDER.map((d) => (
                <div key={d} className="rounded-xs border border-ink-700 p-3">
                  <Toggle label={WEEKDAYS_LONG[d]} checked={days[d].on} onChange={(v) => setDay(d, { on: v })} />
                  {days[d].on ? (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <TimeInput label="Início" value={days[d].start} onChange={(v) => setDay(d, { start: v })} />
                      <TimeInput label="Fim" value={days[d].end} onChange={(v) => setDay(d, { end: v })} />
                    </div>
                  ) : null}
                </div>
              ))}
            </fieldset>
          </>
        ) : null}

        {member?.role !== 'owner' ? <Toggle label="Ativo na equipe" checked={active} onChange={setActive} /> : null}

        {member && member.role !== 'owner' && member.active ? <InviteButton member={member} /> : null}

        <div className="flex flex-wrap gap-3">
          <div className="min-w-48 flex-1 sm:flex-none">
            <Button type="submit" loading={save.isPending}>Salvar</Button>
          </div>
          <SmallButton onClick={onDone} className="min-h-12">Cancelar</SmallButton>
          {member && member.role !== 'owner' ? (
            <SmallButton
              tone="danger"
              className="min-h-12 sm:ml-auto"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Excluir ${member.display_name}?`)) remove.mutate()
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
