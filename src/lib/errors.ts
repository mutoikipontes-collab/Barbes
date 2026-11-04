// Traduz erros do Supabase em mensagens claras em português.
// As funções do banco já devolvem o texto amigável em "details".
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.',
  over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  same_password: 'A nova senha precisa ser diferente da anterior.',
}

type MaybeError = { code?: string; message?: string; details?: string | null } | null | undefined

export function friendlyError(error: unknown): string {
  const e = error as MaybeError
  if (!e) return 'Algo deu errado. Tente novamente.'
  if ((e.code === 'P0001' || e.code === '42501') && e.details) return e.details
  if (e.code === '42501') return 'Você não tem permissão para esta ação.'
  if (e.code && AUTH_MESSAGES[e.code]) return AUTH_MESSAGES[e.code]
  if (e.message?.toLowerCase().includes('failed to fetch')) {
    return 'Sem conexão com o servidor. Verifique sua internet.'
  }
  return 'Algo deu errado. Tente novamente.'
}

// Erros das funções do servidor vêm com a mensagem em português no corpo da resposta.
export async function functionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown }).context
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: string }
      if (body.error) return body.error
    } catch {
      // corpo não é JSON: cai na mensagem genérica
    }
  }
  return friendlyError(error)
}
