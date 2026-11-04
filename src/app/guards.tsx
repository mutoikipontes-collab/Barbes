import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoading } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useIsPlatformAdmin } from '@/features/auth/queries'

// Proteção de rotas na tela. A proteção real dos dados está no banco (RLS):
// mesmo burlando a tela, ninguém lê o que não é seu.
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RedirectIfAuthenticated() {
  const { session, loading, recovering } = useAuth()
  if (loading) return <FullPageLoading />
  if (session && !recovering) return <Navigate to="/conta" replace />
  return <Outlet />
}

export function RequirePlatformAdmin() {
  const { data: isAdmin, isLoading } = useIsPlatformAdmin()
  if (isLoading) return <FullPageLoading />
  if (!isAdmin) return <Navigate to="/conta" replace />
  return <Outlet />
}
