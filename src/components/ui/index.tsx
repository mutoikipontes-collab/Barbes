import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-block size-5 animate-spin rounded-full border-2 border-ink-500 border-t-gold-400" />
  )
}

export function FullPageLoading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner />
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'ghost' }

export function Button({ loading, variant = 'primary', disabled, children, className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xs px-6 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'primary' ? 'btn-gold' : 'border border-ink-700 text-ink-100 hover:border-gold-500'
  return (
    <button {...rest} disabled={disabled || loading} className={`${base} ${styles} ${className}`}>
      {loading ? <Spinner label="Enviando" /> : children}
    </button>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }

export function Field({ label, hint, error, id, ...rest }: FieldProps) {
  const fieldId = id ?? rest.name
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink-300">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        {...rest}
        className="min-h-12 w-full rounded-xs border border-ink-700 bg-ink-950 px-4 text-base text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : hint ? <p className="text-sm text-ink-500">{hint}</p> : null}
    </div>
  )
}

export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-danger/40 text-danger',
    success: 'border-success/40 text-success',
    info: 'border-gold-500/40 text-gold-300',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xs border bg-ink-900 px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center font-display text-[17px] font-medium tracking-[0.2em] text-gold-500 ${className}`}>
      BARBER
      <span className="ml-2 border border-gold-500 py-0.5 pr-1.5 pl-2.5">OS</span>
    </span>
  )
}
