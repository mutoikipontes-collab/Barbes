// Testa os dois sites ligados: cliente (barbes-three) e barbearia (barbes-painel).
// Enquanto o endereço da barbearia não existe, o navegador do teste serve esse
// endereço com o mesmo site publicado (o código decide o modo pelo endereço).
import { chromium } from 'playwright'
import fs from 'node:fs'

const CLIENT = 'https://barbes-three.vercel.app'
const BUSINESS = process.env.BUSINESS_URL || 'https://barbes-painel.vercel.app'
const stamp = Date.now().toString(36)
const email = `e2e-${stamp}@example.com`
const password = 'Teste12345'
const slug = `e2e-${stamp}`
const log = [`conta: ${email}`, `barbearia: /${slug}`]
let n = 0
fs.mkdirSync('shots', { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'pt-BR' })
if (!process.env.BUSINESS_URL) {
  const host = new URL(BUSINESS).host
  await ctx.route(`https://${host}/**`, async (route) => {
    const u = new URL(route.request().url())
    const r = await fetch(`${CLIENT}${u.pathname}${u.search}`)
    route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'text/html' }, body: Buffer.from(await r.arrayBuffer()) })
  })
}
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

async function step(name, fn) {
  n++
  try {
    await fn()
    log.push(`OK   ${n}. ${name}`)
  } catch (e) {
    log.push(`FALHA ${n}. ${name}: ${String(e.message).split('\n')[0]}`)
  }
  await page.screenshot({ path: `shots/${String(n).padStart(2, '0')}-${name}.png` }).catch(() => {})
}
const expect = (c, msg) => { if (!c) throw new Error(msg) }

await step('cliente-inicio', async () => {
  await page.goto(CLIENT)
  await page.getByRole('heading', { name: /Encontre sua barbearia/ }).waitFor()
  const href = await page.getByRole('link', { name: /Site da barbearia/ }).getAttribute('href')
  expect(href === `${BUSINESS}/`, `link do rodapé: ${href}`)
})

await step('cliente-para-barbearias-vai-pro-outro-site', async () => {
  await page.goto(`${CLIENT}/para-barbearias`)
  await page.waitForURL(`${BUSINESS}/**`, { timeout: 15000 })
  await page.getByRole('heading', { name: 'Área da barbearia' }).waitFor()
})

await step('barbearia-inicio', async () => {
  await page.goto(BUSINESS)
  await page.getByRole('heading', { name: 'Área da barbearia' }).waitFor()
  const href = await page.getByRole('link', { name: /Sou cliente/ }).getAttribute('href')
  expect(href === `${CLIENT}/`, `link Sou cliente: ${href}`)
})

await step('menu-cliente-cadastrar-barbearia', async () => {
  await page.goto(CLIENT)
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.screenshot({ path: 'shots/04a-menu-aberto.png' })
  await page.getByRole('link', { name: 'Cadastrar minha barbearia' }).click()
  await page.waitForURL(`${BUSINESS}/cadastro`, { timeout: 15000 })
  await page.getByLabel('Nome completo').fill('Teste Dois Sites')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /Criar conta|Cadastrar/ }).click()
  await page.getByLabel('Nome da barbearia').waitFor({ timeout: 20000 })
  expect(page.url().startsWith(BUSINESS), `ficou em ${page.url()}`)
})

await step('barbearia-cria-barbearia', async () => {
  await page.getByLabel('Nome da barbearia').fill(`E2E ${stamp}`)
  await page.getByLabel('Endereço da página').fill(slug)
  await page.getByRole('button', { name: 'Cadastrar barbearia' }).click()
  await page.getByText(`Endereço reservado: /${slug}`).waitFor({ timeout: 15000 })
  const href = await page.getByRole('link', { name: `E2E ${stamp}` }).getAttribute('href')
  expect(href === `${CLIENT}/${slug}`, `link da barbearia: ${href}`)
})

await step('barbearia-abre-painel', async () => {
  await page.getByRole('link', { name: 'Abrir painel' }).first().click()
  await page.getByRole('link', { name: 'Ver página pública' }).waitFor({ timeout: 15000 })
  const href = await page.getByRole('link', { name: 'Ver página pública' }).getAttribute('href')
  expect(href === `${CLIENT}/${slug}`, `Ver página pública: ${href}`)
})

await step('barbearia-pagina-de-barbearia-vai-pro-cliente', async () => {
  await page.goto(`${BUSINESS}/${slug}`)
  await page.waitForURL(`${CLIENT}/${slug}`, { timeout: 15000 })
  await page.getByText(`E2E ${stamp}`).first().waitFor()
})

await step('cliente-painel-vai-pra-barbearia', async () => {
  await page.goto(`${CLIENT}/painel/x`)
  await page.waitForURL(`${BUSINESS}/painel/x`, { timeout: 15000 })
})

await step('cliente-conta-sem-painel', async () => {
  await page.goto(`${CLIENT}/entrar`)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('link', { name: 'Ir para o site da barbearia' }).waitFor({ timeout: 15000 })
  expect((await page.getByText('Minhas barbearias').count()) === 0, 'mostrou Minhas barbearias no site do cliente')
  expect((await page.getByRole('heading', { name: /Cadastrar barbearia/ }).count()) === 0, 'mostrou cadastro de barbearia no site do cliente')
})

log.push(errors.length ? `erros na página: ${errors.join(' | ')}` : 'sem erros na página')
fs.writeFileSync('shots/resultado-doissites.txt', log.join('\n') + '\n')
console.log(log.join('\n'))
await browser.close()
