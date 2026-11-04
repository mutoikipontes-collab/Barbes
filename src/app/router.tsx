import { createBrowserRouter } from 'react-router'
import { FullPageLoading } from '@/components/ui'
import { RedirectIfAuthenticated, RequireAuth, RequirePlatformAdmin } from './guards'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { ShopPage } from '@/features/booking/ShopPage'
import { OwnerOnly } from '@/features/panel/OwnerOnly'

// Um site só. A página inicial é do cliente (encontrar barbearia e agendar, sem conta).
// A parte da barbearia (cadastro, painel) fica em páginas próprias, abertas pelo menu.
//
// Início e página da barbearia vêm no primeiro carregamento (é o que o cliente usa).
// O resto (painel, administração, entrar, páginas de texto) só é baixado quando a pessoa abre.
export const router = createBrowserRouter([
  {
    HydrateFallback: FullPageLoading,
    children: [
      // cliente
      { path: '/', element: <HomePage /> },
      { path: '/meus-agendamentos', lazy: () => import('@/features/guest/GuestAppointmentsPage').then((m) => ({ Component: m.GuestAppointmentsPage })) },
      { path: '/sobre', lazy: () => import('@/features/about/AboutPage').then((m) => ({ Component: m.AboutPage })) },
      { path: '/planos', lazy: () => import('@/features/plans/PlansPage').then((m) => ({ Component: m.PlansPage })) },
      // barbearia
      { path: '/para-barbearias', lazy: () => import('@/features/owner/OwnerEntryPage').then((m) => ({ Component: m.OwnerEntryPage })) },
      {
        element: <RedirectIfAuthenticated />,
        children: [
          { path: '/entrar', lazy: () => import('@/features/auth/LoginPage').then((m) => ({ Component: m.LoginPage })) },
          { path: '/cadastro', lazy: () => import('@/features/auth/SignupPage').then((m) => ({ Component: m.SignupPage })) },
          { path: '/recuperar-senha', lazy: () => import('@/features/auth/ForgotPasswordPage').then((m) => ({ Component: m.ForgotPasswordPage })) },
        ],
      },
      { path: '/redefinir-senha', lazy: () => import('@/features/auth/ResetPasswordPage').then((m) => ({ Component: m.ResetPasswordPage })) },
      { path: '/convite/:token', lazy: () => import('@/features/invite/InvitePage').then((m) => ({ Component: m.InvitePage })) },
      { path: '/termos', lazy: () => import('@/features/legal/LegalPage').then((m) => ({ Component: m.TermsPage })) },
      { path: '/privacidade', lazy: () => import('@/features/legal/LegalPage').then((m) => ({ Component: m.PrivacyPage })) },
      {
        element: <RequireAuth />,
        children: [
          { path: '/conta', lazy: () => import('@/features/account/AccountPage').then((m) => ({ Component: m.AccountPage })) },
          {
            path: '/painel/:shopId',
            lazy: () => import('@/features/panel/PanelLayout').then((m) => ({ Component: m.PanelLayout })),
            children: [
              { index: true, lazy: () => import('@/features/panel/PanelIndex').then((m) => ({ Component: m.PanelIndex })) },
              { path: 'agenda', lazy: () => import('@/features/panel/AgendaPage').then((m) => ({ Component: m.AgendaPage })) },
              { path: 'clientes', lazy: () => import('@/features/panel/CustomersPage').then((m) => ({ Component: m.CustomersPage })) },
              {
                element: <OwnerOnly />,
                children: [
                  { path: 'servicos', lazy: () => import('@/features/panel/ServicesPage').then((m) => ({ Component: m.ServicesPage })) },
                  { path: 'equipe', lazy: () => import('@/features/panel/TeamPage').then((m) => ({ Component: m.TeamPage })) },
                  { path: 'configuracoes', lazy: () => import('@/features/panel/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
                  { path: 'plano', lazy: () => import('@/features/panel/PlanPage').then((m) => ({ Component: m.PlanPage })) },
                ],
              },
            ],
          },
          {
            element: <RequirePlatformAdmin />,
            children: [{ path: '/admin', lazy: () => import('@/features/platform-admin/PlatformAdminPage').then((m) => ({ Component: m.PlatformAdminPage })) }],
          },
        ],
      },
      // página pública de cada barbearia
      { path: '/:slug', element: <ShopPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
