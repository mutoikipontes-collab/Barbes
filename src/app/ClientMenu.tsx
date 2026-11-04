import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

/** Menu do topo do site do cliente. */
export function ClientMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // fecha ao tocar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = 'flex min-h-12 items-center px-4 text-[15px] hover:bg-ink-800 hover:text-gold-300'
  const close = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-cliente"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-ink-700 px-3 text-[15px] hover:border-gold-500"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        Menu
      </button>
      {open ? (
        <nav id="menu-cliente" aria-label="Menu" className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xs border border-ink-700 bg-ink-900 py-1 shadow-xl">
          <Link to="/meus-agendamentos" onClick={close} className={item}>
            Meus agendamentos
          </Link>
          <Link to="/sobre" onClick={close} className={item}>
            Sobre nós
          </Link>
          <div className="my-1 border-t border-ink-700" />
          <Link to="/cadastro" state={{ from: '/conta?nova-barbearia=1' }} onClick={close} className={`${item} font-semibold text-gold-300`}>
            Cadastrar minha barbearia
          </Link>
          <Link to="/para-barbearias" onClick={close} className={`${item} text-sm text-ink-300`}>
            Já tenho barbearia: entrar
          </Link>
        </nav>
      ) : null}
    </div>
  )
}
