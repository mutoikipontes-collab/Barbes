import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[clamp(1.6rem,5vw,2.1rem)]">{children}</h2>
      {action}
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-ink-300">{children}</span>
}

export function Select({ label, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select
        {...rest}
        className="min-h-12 w-full rounded-xs border border-ink-700 bg-ink-950 px-3 text-base text-ink-100 focus:border-gold-500 focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}

export function TextArea({ label, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        {...rest}
        className="w-full rounded-xs border border-ink-700 bg-ink-950 px-4 py-3 text-base text-ink-100 focus:border-gold-500 focus:outline-none"
      />
    </label>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#c8a04a]" />
      <span>{label}</span>
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xs border border-ink-700 bg-ink-900/60 p-4 ${className}`}>{children}</div>
}

export function SmallButton({
  children,
  tone = 'ghost',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'ghost' | 'gold' | 'danger' }) {
  const styles = {
    ghost: 'border border-ink-700 hover:border-gold-500',
    gold: 'btn-gold',
    danger: 'border border-danger/50 text-danger hover:border-danger',
  }[tone]
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-10 items-center justify-center rounded-xs px-4 text-sm font-semibold disabled:opacity-50 ${styles} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xs border border-dashed border-ink-700 px-4 py-6 text-center text-ink-300">{children}</p>
}
