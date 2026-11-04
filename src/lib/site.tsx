import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

// Dois sites, o mesmo código e o mesmo banco:
//  - cliente: encontrar barbearia e agendar  (ex.: barbes-three.vercel.app)
//  - barbearia: entrar, painel, administração (ex.: barbes-painel.vercel.app)
// O site é escolhido pelo endereço: se tiver "painel" no nome, é o da barbearia.
// VITE_APP_MODE=client|business força um dos dois (útil para testes).

export type Site = 'client' | 'business'

const forced = import.meta.env.VITE_APP_MODE as string | undefined
const host = typeof window === 'undefined' ? '' : window.location.hostname

export const SITE: Site = forced === 'business' || forced === 'client' ? forced : /painel/.test(host) ? 'business' : 'client'

const clean = (u: string) => u.replace(/\/+$/, '')
export const CLIENT_URL = clean((import.meta.env.VITE_CLIENT_URL as string | undefined) || 'https://barbes-three.vercel.app')
export const BUSINESS_URL = clean((import.meta.env.VITE_BUSINESS_URL as string | undefined) || 'https://barbes-painel.vercel.app')

/** Endereço completo de uma página no site indicado. */
export function siteUrl(site: Site, path: string): string {
  return site === SITE ? path : `${site === 'client' ? CLIENT_URL : BUSINESS_URL}${path}`
}

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { site: Site; to: string; children: ReactNode }

/** Link que funciona dentro do mesmo site ou leva para o outro site. */
export function SiteLink({ site, to, children, ...rest }: Props) {
  if (site === SITE) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={siteUrl(site, to)} {...rest}>
      {children}
    </a>
  )
}
