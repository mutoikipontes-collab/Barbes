// Planos Plus/Premium e "Sobre nós".
// PHASE=setup: menu > Sobre nós; cria conta + barbearia.
// PHASE=admin (depois de a conta virar administradora por SQL): muda o plano para Premium,
// confere o aviso de mensalidade (R$ 79,90 e o Pix certo) e salva "Cobrança e suporte".
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'https://barbes-three.vercel.app'
const PHASE = process.env.PHASE ?? 'setup'
const stamp = process.env.STAMP || Date.now().toString(36)
const email = `e2e-${stamp}@example.com`
const password = 'Teste12345'
const slug = `e2e-${stamp}`
const log = [`fase: ${PHASE}`, `conta: ${email}`, `barbearia: /${slug}`]
let n = PHASE === 'admin' ? 50 : 0
fs.mkdirSync('shots', { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
page.on('pageerror', (e) => log.push(`ERRO NA PÁGINA: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') log.push(`console: ${m.text().slice(0, 200)}`) })

async function step(name, fn) {
  n++
  try {
    await fn()
    log.push(`OK   ${n}. ${name}`)
    await page.screenshot({ path: `shots/${String(n).padStart(2, '0')}-${name}.png`, fullPage: true })
  } catch (e) {
    log.push(`FALHOU ${n}. ${name}: ${String(e.message).split('\n')[0]}`)
    await page.screenshot({ path: `shots/${String(n).padStart(2, '0')}-FALHA-${name}.png`, fullPage: true }).catch(() => {})
    throw e
  }
}

try {
  if (PHASE === 'setup') {
    await step('menu-sobre-nos', async () => {
      await page.goto(BASE)
      await page.getByRole('button', { name: 'Menu' }).click()
      await page.getByRole('link', { name: 'Sobre nós' }).click()
      await page.waitForURL(`${BASE}/sobre`)
      await page.getByRole('heading', { name: 'Por que fomos criados' }).waitFor()
    })
    await step('menu-planos', async () => {
      await page.goto(BASE)
      await page.getByRole('button', { name: 'Menu' }).click()
      await page.getByRole('link', { name: 'Planos para barbearias' }).click()
      await page.waitForURL(`${BASE}/planos`)
      for (const [nome, preco] of [['Básico', '29,90'], ['Plus', '49,90'], ['Premium', '79,90']]) {
        await page.getByRole('heading', { name: nome, exact: true }).waitFor({ timeout: 15000 })
        await page.getByText(new RegExp(`R\\$\\s?${preco}`)).first().waitFor()
      }
      await page.goto(`${BASE}/sobre`)
    })
    await step('sobre-nos-botao-cadastrar', async () => {
      await page.getByRole('link', { name: 'Cadastrar minha barbearia' }).click()
      await page.waitForURL(`${BASE}/cadastro`)
      await page.getByLabel('Nome completo').fill('Dono Planos')
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha').fill(password)
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Criar conta' }).click()
      await page.getByLabel('Nome da barbearia').fill(`E2E ${stamp}`)
      await page.getByLabel('Endereço da página').fill(slug)
      await page.getByRole('button', { name: 'Cadastrar barbearia' }).click()
      await page.getByText('Barbearia cadastrada').waitFor({ timeout: 15000 })
    })
    await step('aviso-plano-basico', async () => {
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
      await page.getByRole('button', { name: 'Como assinar' }).click()
      await page.getByText(/Plano Básico: R\$\s?29,90\/mês/).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: 'Copiar Pix copia e cola' }).click()
      const code = await page.evaluate(() => navigator.clipboard.readText())
      if (!code.endsWith('FB3F') || !code.includes('Iolanda dos Santos Pontes')) throw new Error(`Pix do Básico errado: ${code.slice(-30)}`)
    })
    await step('dono-escolhe-premium-no-painel', async () => {
      await page.getByRole('link', { name: 'Ver e escolher plano' }).click()
      await page.getByRole('heading', { name: 'Plano', exact: true }).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: 'Escolher Premium' }).click()
      await page.getByText('Aguardando pagamento.').waitFor({ timeout: 15000 })
      await page.getByText(/Você escolheu o plano Premium/).waitFor()
      await page.getByRole('button', { name: 'Copiar Pix copia e cola' }).click()
      const code = await page.evaluate(() => navigator.clipboard.readText())
      if (!code.endsWith('6D00')) throw new Error(`Pix do Premium errado: ${code.slice(-20)}`)
    })
  } else {
    await step('entrar', async () => {
      await page.goto(`${BASE}/entrar`)
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha').fill(password)
      await page.getByRole('button', { name: 'Entrar' }).click()
      await page.waitForURL('**/conta', { timeout: 20000 })
    })
    await step('admin-ve-pedido-e-registra-pagamento', async () => {
      await page.goto(`${BASE}/admin`)
      const row = page.locator('li').filter({ hasText: `/${slug}` })
      await row.getByText(/Pediu o plano Premium/).waitFor({ timeout: 15000 })
      await row.getByText(/Plano Básico · R\$\s?29,90\/mês/).waitFor()
      await row.getByRole('button', { name: 'Registrar pagamento' }).click()
      await row.getByText(/Plano Premium · R\$\s?79,90\/mês/).waitFor({ timeout: 15000 })
      if (await row.getByText(/Pediu o plano/).count()) throw new Error('pedido não foi limpo')
    })
    await step('aba-plano-mostra-premium', async () => {
      await page.goto(`${BASE}/conta`)
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
      await page.getByRole('link', { name: 'Plano', exact: true }).click()
      await page.getByText(/Plano atual: Premium/).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: 'Copiar Pix copia e cola' }).click()
      const code = await page.evaluate(() => navigator.clipboard.readText())
      if (!code.endsWith('6D00') || !code.includes('540579.90')) throw new Error(`Pix do Premium errado: ${code.slice(-30)}`)
    })
    await step('admin-muda-para-plus', async () => {
      await page.goto(`${BASE}/admin`)
      const row = page.locator('li').filter({ hasText: `/${slug}` })
      await row.getByLabel('Plano').selectOption('plus')
      await row.getByText(/Plano Plus · R\$\s?49,90\/mês/).waitFor({ timeout: 15000 })
      await page.goto(`${BASE}/conta`)
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
      await page.getByRole('link', { name: 'Plano', exact: true }).click()
      await page.getByText(/Plano atual: Plus/).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: 'Copiar Pix copia e cola' }).click()
      const code = await page.evaluate(() => navigator.clipboard.readText())
      if (!code.endsWith('AF90')) throw new Error(`Pix do Plus errado: ${code.slice(-30)}`)
    })
    await step('admin-salva-cobranca-sem-estragar-pix', async () => {
      await page.goto(`${BASE}/admin`)
      for (const [label, end] of [['Pix copia e cola – plano Básico (R$ 29,90)', 'FB3F'], ['Pix copia e cola – plano Plus (R$ 49,90)', 'AF90'], ['Pix copia e cola – plano Premium (R$ 79,90)', '6D00']]) {
        const v = await page.getByLabel(label).inputValue()
        if (!v.endsWith(end)) throw new Error(`${label} não carregou`)
      }
      await page.getByRole('button', { name: 'Salvar', exact: true }).click()
      await page.getByText('Configurações salvas.').waitFor({ timeout: 15000 })
      await page.reload()
      const v = await page.getByLabel('Pix copia e cola – plano Básico (R$ 29,90)').inputValue()
      if (!v.includes('Iolanda dos Santos Pontes6009SAO PAULO')) throw new Error(`espaços sumiram: ${v}`)
    })
  }
} catch {
  // falha registrada
}
fs.writeFileSync(`shots/resultado-planos-${PHASE}.txt`, log.join('\n') + '\n')
console.log(log.join('\n'))
await browser.close()
