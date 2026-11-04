import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/ui'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-10">
      <Link to="/" className="self-center" aria-label="BARBER OS, página inicial">
        <Wordmark />
      </Link>
      <div className="mt-12 flex-1">
        <h1 className="font-display text-4xl font-semibold text-ink-100">{title}</h1>
        {subtitle ? <p className="mt-2 text-ink-300">{subtitle}</p> : null}
        <div className="mt-8">{children}</div>
      </div>
      {footer ? <div className="mt-10 text-center text-sm text-ink-300">{footer}</div> : null}
    </main>
  )
}
