import { Navigate, Outlet } from 'react-router'
import { usePanel } from './context'

export function OwnerOnly() {
  const { role } = usePanel()
  return role === 'owner' ? <Outlet /> : <Navigate to=".." replace relative="path" />
}
