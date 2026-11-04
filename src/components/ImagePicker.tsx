import { useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui'

/** Reduz a imagem no próprio celular antes de enviar (mais rápido e economiza espaço). */
export async function shrinkImage(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível ler a imagem.'))), 'image/jpeg', 0.86),
  )
}

type Props = {
  bucket: 'staff-photos' | 'shop-media'
  folder: string
  maxSide: number
  value: string | null
  onChange: (url: string | null) => void
  preview: (url: string | null, busy: ReactNode) => ReactNode
  labels: { add: string; change: string; hint: string }
}

export function ImagePicker({ bucket, folder, maxSide, value, onChange, preview, labels }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) return setError('Escolha uma imagem.')
    setBusy(true)
    try {
      const blob = await shrinkImage(file, maxSide)
      const path = `${folder}/${crypto.randomUUID()}.jpg`
      const { error: upError } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (upError) throw upError
      onChange(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl)
    } catch (e) {
      console.error(e)
      setError('Não foi possível enviar a imagem. Tente outra (até 2 MB depois de reduzida).')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {preview(value, busy ? <span className="absolute inset-0 grid place-items-center bg-ink-950/70"><Spinner label="Enviando imagem" /></span> : null)}
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
      <div className="flex flex-wrap gap-4">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="min-h-11 font-semibold text-gold-300 underline underline-offset-4">
          {value ? labels.change : labels.add}
        </button>
        {value ? (
          <button type="button" disabled={busy} onClick={() => onChange(null)} className="min-h-11 text-sm text-ink-300 underline underline-offset-4">
            Remover
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-xs text-ink-300">{labels.hint}</p>}
    </div>
  )
}
