/** "Açailândia" -> "acailandia" (sem acento, minúsculo), igual ao private.fold do banco. */
export function fold(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}
