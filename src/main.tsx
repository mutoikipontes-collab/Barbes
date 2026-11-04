import './index.css'

const container = document.getElementById('root')!

function showFatal(title: string, detail: string) {
  container.innerHTML = `
    <main style="max-width:28rem;margin:0 auto;padding:4rem 1rem;font-family:system-ui,sans-serif;color:#ececee">
      <p style="color:#c8a45c;letter-spacing:.18em;font-weight:600">BARBER OS</p>
      <h1 style="font-size:1.5rem;margin:1.5rem 0 .75rem">${title}</h1>
      <p style="color:#a3a3aa;line-height:1.5">${detail}</p>
    </main>`
}

const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'].filter(
  (name) => !import.meta.env[name],
)

if (missing.length > 0) {
  // Sem as variáveis o site não consegue falar com o banco: mostramos o motivo em vez de uma tela vazia.
  showFatal(
    'Configuração incompleta',
    `Faltam as variáveis de ambiente: <strong>${missing.join(', ')}</strong>. Cadastre-as no painel da hospedagem e publique o site de novo (Redeploy).`,
  )
} else {
  import('./bootstrap')
    .then(({ start }) => start(container))
    .catch((error: unknown) => {
      console.error(error)
      showFatal('Não foi possível iniciar', 'Recarregue a página. Se o problema continuar, avise o suporte.')
    })
}
