export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Gera um endereço público a partir do nome: "Navalha & Cia" -> "navalha-cia"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

/** Celular brasileiro para o formato do WhatsApp: "+5599912345678". Retorna null se inválido. */
export function toWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) d = '55' + d
  return d.length >= 12 && d.length <= 15 ? `+${d}` : null
}

export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, '')}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
