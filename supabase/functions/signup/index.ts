// Cópia versionada da função publicada no Supabase (nome: signup, verify_jwt: false).
// Cadastro de conta já confirmada (sem e-mail de confirmação).
// Roda no servidor do Supabase: a chave service_role vem do ambiente da função e nunca vai para o site.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'Método não permitido.' })

  let payload: { full_name?: unknown; email?: unknown; password?: unknown }
  try {
    payload = await req.json()
  } catch {
    return reply(400, { error: 'Dados inválidos.' })
  }

  const fullName = String(payload.full_name ?? '').trim().replace(/\s+/g, ' ')
  const email = String(payload.email ?? '').trim().toLowerCase()
  const password = String(payload.password ?? '')

  if (fullName.length < 2 || fullName.length > 80) return reply(400, { error: 'Informe seu nome (de 2 a 80 caracteres).' })
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, { error: 'Informe um e-mail válido.' })
  if (password.length < 8 || password.length > 72) return reply(400, { error: 'A senha precisa ter de 8 a 72 caracteres.' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    const code = (error as { code?: string }).code
    if (code === 'email_exists' || /already/i.test(error.message)) {
      return reply(409, { error: 'Já existe uma conta com este e-mail. Use "Entrar".' })
    }
    if (code === 'weak_password') {
      return reply(400, { error: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.' })
    }
    console.error('createUser failed', code, error.message)
    return reply(500, { error: 'Não foi possível criar a conta agora. Tente novamente.' })
  }

  return reply(201, { ok: true })
})
