import { createBrowserRouter, type RouteObject } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth, RequirePlatformAdmin } from './guards'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { ExternalRedirect } from './ExternalRedirect'
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
import { SITE } from '@/lib/site'

// Páginas que existem nos dois sites
const shared: RouteObject[] = [
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <SignupPage /> },
      { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/redefinir-senha', element: <ResetPasswordPage /> },
  { path: '/termos', element: <TermsPage /> },
  { path: '/privacidade', element: <PrivacyPage /> },
]

// Site do cliente: encontrar barbearia, agendar, meus agendamentos
const clientRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  ...shared,
  { element: <RequireAuth />, children: [{ path: '/conta', element: <AccountPage /> }] },
  // páginas da barbearia moram no outro site
  { path: '/para-barbearias', element: <ExternalRedirect site="business" /> },
  { path: '/painel/*', element: <ExternalRedirect site="business" /> },
  { path: '/admin', element: <ExternalRedirect site="business" /> },
  { path: '/convite/*', element: <ExternalRedirect site="business" /> },
  // página pública de cada barbearia: <endereço do site>/<barbearia>
  { path: '/:slug', element: <ShopPage /> },
  { path: '*', element: <NotFoundPage /> },
]

// Site da barbearia: entrar, painel, administração, convites
const businessRoutes: RouteObject[] = [
  { path: '/', element: <OwnerEntryPage /> },
  ...shared,
  { path: '/convite/:token', element: <InvitePage /> },
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
  { path: '/para-barbearias', element: <OwnerEntryPage /> },
  // página de barbearia aberta por engano aqui: leva para o site do cliente
  { path: '/:slug', element: <ExternalRedirect site="client" /> },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(SITE === 'business' ? businessRoutes : clientRoutes)
