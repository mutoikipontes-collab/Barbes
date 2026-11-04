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
import { PanelLayout } from '@/features/panel/PanelLayout'
import { PanelIndex } from '@/features/panel/PanelIndex'
import { AgendaPage } from '@/features/panel/AgendaPage'
import { ServicesPage } from '@/features/panel/ServicesPage'
import { TeamPage } from '@/features/panel/TeamPage'
import { CustomersPage } from '@/features/panel/CustomersPage'
import { SettingsPage } from '@/features/panel/SettingsPage'
import { OwnerOnly } from '@/features/panel/OwnerOnly'
import { InvitePage } from '@/features/invite/InvitePage'
import { PrivacyPage, TermsPage } from '@/features/legal/LegalPage'
import { OwnerEntryPage } from '@/features/owner/OwnerEntryPage'
import { GuestAppointmentsPage } from '@/features/guest/GuestAppointmentsPage'

// Um site só. A página inicial é do cliente (encontrar barbearia e agendar, sem conta).
// A parte da barbearia (cadastro, painel) fica em páginas próprias, abertas pelo menu.
export const router = createBrowserRouter([
  // cliente
  { path: '/', element: <HomePage /> },
  { path: '/meus-agendamentos', element: <GuestAppointmentsPage /> },
  // barbearia
  { path: '/para-barbearias', element: <OwnerEntryPage /> },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <SignupPage /> },
      { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/redefinir-senha', element: <ResetPasswordPage /> },
  { path: '/convite/:token', element: <InvitePage /> },
  { path: '/termos', element: <TermsPage /> },
  { path: '/privacidade', element: <PrivacyPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/conta', element: <AccountPage /> },
      {
        path: '/painel/:shopId',
        element: <PanelLayout />,
        children: [
          { index: true, element: <PanelIndex /> },
          { path: 'agenda', element: <AgendaPage /> },
          { path: 'clientes', element: <CustomersPage /> },
          {
            element: <OwnerOnly />,
            children: [
              { path: 'servicos', element: <ServicesPage /> },
              { path: 'equipe', element: <TeamPage /> },
              { path: 'configuracoes', element: <SettingsPage /> },
            ],
          },
        ],
      },
      { element: <RequirePlatformAdmin />, children: [{ path: '/admin', element: <PlatformAdminPage /> }] },
    ],
  },
  // página pública de cada barbearia
  { path: '/:slug', element: <ShopPage /> },
  { path: '*', element: <NotFoundPage /> },
])
