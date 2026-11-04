import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <p className="font-display text-5xl text-gold-500">404</p>
      <p className="mt-4 text-ink-300">Esta página não existe.</p>
      <Link to="/" className="mt-8 font-semibold text-gold-400">Voltar ao início</Link>
    </main>
  )
}
