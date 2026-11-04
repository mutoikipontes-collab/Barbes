import { createBrowserRouter } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth, RequirePlatformAdmin } from './guards'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { AccountPage } from '@/features/account/AccountPage'
import { PlatformAdminPage } from '@/features/platform-admin/PlatformAdminPage'
import { ShopPage } from '@/features/booking/ShopPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <SignupPage /> },
      { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/redefinir-senha', element: <ResetPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/conta', element: <AccountPage /> },
      { element: <RequirePlatformAdmin />, children: [{ path: '/admin', element: <PlatformAdminPage /> }] },
    ],
  },
  // Página pública de cada barbearia: barber-os/<endereço>. Rotas fixas acima têm prioridade.
  { path: '/:slug', element: <ShopPage /> },
  { path: '*', element: <NotFoundPage /> },
])
