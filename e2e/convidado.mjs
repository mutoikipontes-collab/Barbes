// Agendamento sem conta: dono prepara a barbearia no site da barbearia;
// cliente (sem login) agenda informando nome, e-mail e celular, vê "Meus agendamentos",
// remarca, cancela e abre o link do agendamento em outro aparelho.
import { chromium } from 'playwright'
import fs from 'node:fs'

const CLIENT = 'https://barbes-three.vercel.app'
const BUSINESS = CLIENT
const stamp = Date.now().toString(36)
const email = `e2e-${stamp}@example.com`
const password = 'Teste12345'
const slug = `e2e-${stamp}`
const log = [`dono: ${email}`, `barbearia: /${slug}`]
let n = 0
fs.mkdirSync('shots', { recursive: true })

const browser = await chromium.launch()
async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
  if (false) {
    await ctx.route(`https://${new URL(BUSINESS).host}/**`, async (route) => {
      const u = new URL(route.request().url())
      const r = await fetch(`${CLIENT}${u.pathname}${u.search}`)
      route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'text/html' }, body: Buffer.from(await r.arrayBuffer()) })
    })
  }
  const page = await ctx.newPage()
  page.on('dialog', (d) => d.accept())
  page.on('pageerror', (e) => log.push(`ERRO NA PÁGINA: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') log.push(`console: ${m.text().slice(0, 200)}`) })
  return { ctx, page }
}
let page
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
  const owner = await newCtx()
  page = owner.page
  await step('dono-cadastro', async () => {
    await page.goto(CLIENT)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('link', { name: 'Cadastrar minha barbearia' }).click()
    await page.waitForURL(`${CLIENT}/cadastro`)
    await page.getByLabel('Nome completo').fill('Dono Teste')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await page.getByLabel('Nome da barbearia').fill(`E2E ${stamp}`)
    await page.getByLabel('Endereço da página').fill(slug)
    await page.getByRole('button', { name: 'Cadastrar barbearia' }).click()
    await page.getByText('Barbearia cadastrada').waitFor({ timeout: 15000 })
    await page.getByRole('link', { name: 'Abrir painel' }).first().click()
    await page.getByRole('link', { name: 'Equipe' }).waitFor()
  })
  await step('dono-equipe-servico', async () => {
    await page.getByRole('link', { name: 'Equipe' }).click()
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByLabel('Eu também atendo clientes').check()
    for (const d of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']) await page.getByLabel(d, { exact: true }).check()
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await page.getByRole('button', { name: 'Novo barbeiro' }).waitFor({ timeout: 15000 })
    await page.getByRole('link', { name: 'Serviços' }).click()
    await page.getByRole('button', { name: 'Novo serviço' }).click()
    await page.getByLabel('Nome', { exact: true }).fill('Corte teste')
    await page.getByLabel('Duração (minutos)').fill('30')
    await page.getByLabel('Preço (R$)').fill('30,00')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await page.getByText('Corte teste').waitFor({ timeout: 15000 })
    await page.getByRole('link', { name: 'Configurações' }).click()
    await page.getByLabel('Cidade', { exact: true }).fill('Açailândia')
    await page.getByLabel('UF', { exact: true }).fill('MA')
    await page.getByRole('button', { name: 'Salvar dados' }).click()
    await page.getByText('Alterações salvas').waitFor({ timeout: 15000 })
  })

  // cliente: outro navegador, sem conta
  const guest = await newCtx()
  page = guest.page
  await step('inicio-titulo', async () => {
    await page.goto(CLIENT)
    await page.getByRole('heading', { name: 'Encontre a melhor barbearia da região.' }).waitFor()
    await page.getByText('Escolha sua cidade para ver as barbearias.').waitFor()
  })
  await step('cidade-nao-existe', async () => {
    await page.getByLabel('Sua cidade').fill('Xyzlandia')
    await page.getByText('Cidade não encontrada.').waitFor()
  })
  await step('cidade-sem-barbearia', async () => {
    await page.getByLabel('Sua cidade').fill('Carolin')
    await page.getByRole('option', { name: /Carolina/ }).click()
    await page.getByText('Nenhuma barbearia encontrada.').waitFor({ timeout: 15000 })
  })
  await step('cidade-acai-sugere-acailandia', async () => {
    await page.getByRole('button', { name: 'Trocar' }).click()
    await page.getByLabel('Sua cidade').fill('Açai')
    const opt = page.getByRole('option', { name: /Açailândia/ })
    await opt.waitFor()
    const txt = await opt.textContent()
    if (!/[1-9]\d* barbearia/.test(txt ?? '')) throw new Error(`contagem: ${txt}`)
  })
  await step('cidade-lista-barbearias', async () => {
    await page.getByRole('option', { name: /Açailândia/ }).click()
    await page.getByRole('heading', { name: /Barbearias em Açailândia/ }).waitFor()
    await page.getByRole('link', { name: new RegExp(`E2E ${stamp}`) }).waitFor({ timeout: 15000 })
  })
  await step('busca-pelo-nome', async () => {
    await page.getByLabel('Buscar barbearia pelo nome').fill('nao-existe-xyz')
    await page.getByText('Nenhuma barbearia encontrada.').waitFor({ timeout: 15000 })
    await page.getByLabel('Buscar barbearia pelo nome').fill(`E2E ${stamp}`)
    await page.getByRole('link', { name: new RegExp(`E2E ${stamp}`) }).waitFor({ timeout: 15000 })
  })
  await step('cliente-abre-barbearia-sem-login', async () => {
    await page.getByRole('link', { name: new RegExp(`E2E ${stamp}`) }).click()
    await page.waitForURL(`**/${slug}`)
    await page.getByRole('button', { name: 'Agendar horário' }).click()
    await page.getByRole('heading', { name: 'Escolha o barbeiro' }).waitFor()
    await page.getByRole('dialog').getByRole('button', { name: /Dono Teste/ }).click()
    await page.getByRole('heading', { name: 'Escolha o tipo de corte' }).waitFor()
    await page.getByRole('dialog').getByRole('button', { name: /Corte teste/ }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('dialog').locator('.grid-cols-7 button:not([disabled])').nth(1).click()
    const slotBtn = page.getByRole('dialog').getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
    await slotBtn.waitFor({ timeout: 15000 })
    await slotBtn.click()
    await page.getByLabel('E-mail').waitFor()
    if (await page.getByRole('link', { name: 'Entrar' }).count()) throw new Error('ainda pede login')
  })
  await step('cliente-dados-obrigatorios', async () => {
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByText('Informe um e-mail válido.').waitFor()
    await page.getByText('Informe um celular com DDD.').waitFor()
  })
  await step('cliente-preenche-nome-email-celular', async () => {
    await page.getByLabel('Nome', { exact: true }).fill('Cliente Sem Conta')
    await page.getByLabel('E-mail').fill(`e2e-cliente-${stamp}@example.com`)
    await page.getByLabel('Celular com DDD').fill('11987654321')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByText(`e2e-cliente-${stamp}@example.com`).waitFor()
  })
  await step('cliente-confirma', async () => {
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()
    await page.getByRole('heading', { name: 'Agendamento confirmado' }).waitFor({ timeout: 15000 })
    await page.getByText(/Salvar na agenda/).first().waitFor()
  })
  let link = ''
  await step('cliente-link-do-agendamento', async () => {
    await guest.ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Copiar link do agendamento' }).click()
    await page.getByRole('button', { name: 'Link copiado' }).waitFor()
    link = await page.evaluate(() => navigator.clipboard.readText())
    if (!/\/meus-agendamentos\?abrir=[0-9a-f-]{36}\.[0-9a-f]{64}$/.test(link)) throw new Error(`link estranho: ${link}`)
  })
  await step('cliente-meus-agendamentos', async () => {
    await page.getByRole('link', { name: 'Ver meus agendamentos' }).click()
    await page.getByText('Corte teste com').first().waitFor({ timeout: 15000 })
    await page.getByRole('button', { name: 'Localização e salvar na agenda' }).click()
    await page.getByRole('button', { name: 'Salvar na agenda' }).waitFor()
  })
  await step('cliente-remarcar', async () => {
    await page.getByRole('button', { name: 'Remarcar' }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('dialog').locator('.grid-cols-7 button:not([disabled])').nth(1).click()
    const slotBtn = page.getByRole('dialog').getByRole('button', { name: /^\d{2}:\d{2}$/ }).nth(2)
    await slotBtn.waitFor({ timeout: 15000 })
    await slotBtn.click()
    await page.getByRole('button', { name: 'Confirmar mudança' }).click()
    await page.getByRole('heading', { name: 'Horário remarcado' }).waitFor({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).last().click()
  })
  await step('menu-meus-agendamentos', async () => {
    await page.goto(CLIENT)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('link', { name: 'Meus agendamentos' }).click()
    await page.getByText('Corte teste com').first().waitFor({ timeout: 15000 })
  })

  // outro aparelho: abre o link copiado
  const other = await newCtx()
  page = other.page
  await step('outro-aparelho-abre-link', async () => {
    await page.goto(link)
    await page.getByText('Corte teste com').first().waitFor({ timeout: 15000 })
    if (page.url().includes('abrir=')) throw new Error('código ficou no endereço')
  })
  await step('outro-aparelho-sem-link-nao-ve', async () => {
    const fresh = await newCtx()
    await fresh.page.goto(`${CLIENT}/meus-agendamentos`)
    await fresh.page.getByText('Nenhum agendamento feito neste celular ainda.').waitFor({ timeout: 15000 })
    await fresh.ctx.close()
  })
  await step('cliente-cancela', async () => {
    await page.getByRole('button', { name: 'Cancelar' }).first().click()
    await page.getByText('Cancelado').first().waitFor({ timeout: 15000 })
  })

  page = owner.page
  await step('dono-ve-cliente-com-email', async () => {
    await page.getByRole('link', { name: 'Clientes' }).click()
    await page.getByText('Cliente Sem Conta').first().waitFor({ timeout: 15000 })
  })
} catch {
  // falha já registrada
}
fs.writeFileSync('shots/resultado-convidado.txt', log.join('\n') + '\n')
console.log(log.join('\n'))
await browser.close()
