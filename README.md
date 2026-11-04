# BARBER OS

SaaS de agendamento e gestão para barbearias.

- Interface: React + TypeScript (Vite) + Tailwind CSS
- Backend: Supabase (Auth, PostgreSQL com RLS, funções no banco)
- Hospedagem: Cloudflare Pages (build `npm run build`, pasta `dist`)

## Variáveis de ambiente

Veja `.env.example`. Somente a chave pública (publishable) do Supabase vai para o site.
A chave `service_role` nunca entra neste repositório.

## Rotas atuais (Fase 2)

| Rota | Acesso |
| --- | --- |
| `/` | Público |
| `/entrar`, `/cadastro`, `/recuperar-senha` | Só sem login |
| `/redefinir-senha` | Pelo link enviado por e-mail |
| `/conta` | Com login: minhas barbearias e cadastro de barbearia |
| `/admin` | Só administradores do BARBER OS |
