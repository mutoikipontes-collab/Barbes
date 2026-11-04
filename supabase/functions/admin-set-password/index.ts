// Cópia versionada da função publicada no Supabase (nome: admin-set-password, verify_jwt: false;
// a própria função confere o login e se quem chama é administrador do BARBER OS).
// Ver o código publicado com: Supabase → Edge Functions → admin-set-password.

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

function tempPassword(): string {
  // sem letras ambíguas (0/O, 1/l), fácil de ditar pelo WhatsApp
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'Método não permitido.' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: caller, error: authError } = await admin.auth.getUser(token)
  if (authError || !caller.user) return reply(401, { error: 'Entre na sua conta.' })

  const { data: isAdmin } = await admin.from('platform_admins').select('user_id').eq('user_id', caller.user.id).maybeSingle()
  if (!isAdmin) return reply(403, { error: 'Acesso restrito à administração do BARBER OS.' })

  let email = ''
  try {
    email = String((await req.json()).email ?? '').trim().toLowerCase()
  } catch {
    return reply(400, { error: 'Dados inválidos.' })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, { error: 'Informe um e-mail válido.' })

  let userId: string | null = null
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return reply(500, { error: 'Não foi possível consultar os usuários.' })
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null
    if (data.users.length < 1000) break
  }
  if (!userId) return reply(404, { error: 'Nenhuma conta com este e-mail.' })

  const password = tempPassword()
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) {
    console.error('updateUserById failed', error.message)
    return reply(500, { error: 'Não foi possível trocar a senha agora.' })
  }
  return reply(200, { password })
})
