// Guarda de qual barbearia veio a indicação (?ref=endereço), para registrar no cadastro.
const KEY = 'barberos.ref'

export function captureRef(search: string) {
  const ref = new URLSearchParams(search).get('ref')
  if (!ref || !/^[a-z0-9-]{3,40}$/.test(ref)) return
  try {
    localStorage.setItem(KEY, ref)
  } catch {
    // sem armazenamento: a indicação só não é registrada
  }
}

export function getRef(): string | undefined {
  try {
    return localStorage.getItem(KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nada a limpar
  }
}
