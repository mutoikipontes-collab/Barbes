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
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-gold-500 text-ink-950 hover:bg-gold-400'
      : 'border border-ink-700 text-ink-100 hover:border-gold-500/60'
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
        className="min-h-12 w-full rounded-lg border border-ink-700 bg-ink-900 px-4 text-base text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
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
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border bg-ink-900 px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function Wordmark() {
  return (
    <span className="font-display text-2xl font-semibold tracking-[0.18em] text-ink-100">
      BARBER <span className="text-gold-500">OS</span>
    </span>
  )
}
