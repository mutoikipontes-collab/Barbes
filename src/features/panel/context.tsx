import { createContext, useContext } from 'react'
import type { Tables } from '@/types/database'

export type PanelCtx = {
  shop: Tables<'shops'>
  role: 'owner' | 'barber'
  staffId: string
}

export const PanelContext = createContext<PanelCtx | null>(null)

export function usePanel() {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanel fora do painel')
  return ctx
}
