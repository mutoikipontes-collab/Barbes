import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui'
import { Initials } from '@/features/booking/BookingDialog'
import { usePanel } from './context'

const MAX_SIDE = 720

/** Reduz a foto no próprio celular antes de enviar (mais rápido e economiza espaço). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível ler a imagem.'))), 'image/jpeg', 0.85),
  )
}

export function PhotoPicker({ name, value, onChange }: { name: string; value: string | null; onChange: (url: string | null) => void }) {
  const { shop } = usePanel()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) return setError('Escolha uma imagem.')
    setBusy(true)
    try {
      const blob = await shrink(file)
      const path = `${shop.id}/${crypto.randomUUID()}.jpg`
      const { error: upError } = await supabase.storage.from('staff-photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (upError) throw upError
      onChange(supabase.storage.from('staff-photos').getPublicUrl(path).data.publicUrl)
    } catch (e) {
      console.error(e)
      setError('Não foi possível enviar a foto. Tente outra imagem (até 2 MB depois de reduzida).')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {value ? (
          <img src={value} alt={`Foto de ${name}`} className="size-24 rounded-full border border-gold-500 object-cover" />
        ) : (
          <div className="scale-[1.85] p-5"><Initials name={name} /></div>
        )}
        {busy ? <span className="absolute inset-0 grid place-items-center rounded-full bg-ink-950/70"><Spinner label="Enviando foto" /></span> : null}
      </div>
      <div className="space-y-2">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void pick(f)
            e.target.value = ''
          }}
        />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="block min-h-11 font-semibold text-gold-300 underline underline-offset-4">
          {value ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {value ? (
          <button type="button" disabled={busy} onClick={() => onChange(null)} className="block min-h-11 text-sm text-ink-300 underline underline-offset-4">
            Remover foto
          </button>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-xs text-ink-300">Aparece na página da barbearia. A foto só vale depois de tocar em Salvar.</p>}
      </div>
    </div>
  )
}
