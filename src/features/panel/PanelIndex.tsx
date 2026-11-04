import { Navigate } from 'react-router'
import { usePanel } from './context'
import { DashboardPage } from './DashboardPage'

/** Dono abre no resumo; barbeiro abre direto na agenda. */
export function PanelIndex() {
  const { role } = usePanel()
  return role === 'owner' ? <DashboardPage /> : <Navigate to="agenda" replace />
}
