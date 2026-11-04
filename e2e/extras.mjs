// Testes complementares: envio de imagens, "Salvar na agenda" (.ics) e cobrança/Administração.
// PHASE=setup cria conta + barbearia e testa imagens e .ics.
// PHASE=admin (depois de a conta virar administradora por SQL) testa aviso de cobrança e "Registrar pagamento".
import { chromium } from 'playwright'
import fs from 'node:fs'
import zlib from 'node:zlib'

const BASE = process.env.BASE_URL ?? 'https://barbes-three.vercel.app'
const PHASE = process.env.PHASE ?? 'setup'
const stamp = process.env.STAMP || Date.now().toString(36)
const email = `e2e-${stamp}@example.com`
const password = 'Teste12345'
const slug = `e2e-${stamp}`
const log = [`fase: ${PHASE}`, `conta: ${email}`, `barbearia: /${slug}`]
let n = PHASE === 'admin' ? 50 : 0
fs.mkdirSync('shots', { recursive: true })

// Imagem PNG 64x64 (dourada) gerada aqui mesmo, para testar o envio.
function png() {
  const w = 64, h = 64
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3
      raw[o] = 200; raw[o + 1] = 160 - y; raw[o + 2] = 74 + x
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const image = { name: 'foto.png', mimeType: 'image/png', buffer: png() }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', acceptDownloads: true })
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
page.on('pageerror', (e) => log.push(`ERRO NA PÁGINA: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') log.push(`console: ${m.text().slice(0, 200)}`) })

async function shot(name) {
  n++
  await page.waitForTimeout(500)
  await page.screenshot({ path: `shots/${String(n).padStart(2, '0')}-${name}.png`, fullPage: true })
}
async function step(name, fn) {
  try { await fn(); log.push(`OK   ${name}`); await shot(name) }
  catch (e) { log.push(`FALHOU ${name}: ${String(e.message).split('\n')[0]}`); await shot(`FALHA-${name}`); throw e }
}

try {
  if (PHASE === 'setup') {
    await step('cadastro', async () => {
      await page.goto(`${BASE}/cadastro`)
      await page.getByLabel('Nome completo').fill('Teste Imagens')
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha').fill(password)
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Criar conta' }).click()
      await page.waitForURL('**/conta', { timeout: 20000 })
      await page.getByRole('button', { name: 'Cadastrar minha barbearia' }).click()
      await page.getByLabel('Nome da barbearia').fill(`E2E ${stamp}`)
      await page.getByLabel('Endereço da página').fill(slug)
      await page.getByRole('button', { name: 'Cadastrar barbearia' }).click()
      await page.getByText('Barbearia cadastrada').waitFor({ timeout: 15000 })
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
    })
    await step('foto-do-barbeiro', async () => {
      await page.getByRole('link', { name: 'Equipe' }).click()
      await page.getByRole('button', { name: 'Editar' }).first().click()
      await page.locator('input[type=file]').first().setInputFiles(image)
      await page.getByRole('img', { name: /Foto de/ }).waitFor({ timeout: 20000 })
      await page.getByLabel('Eu também atendo clientes').check()
      for (const d of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']) await page.getByLabel(d, { exact: true }).check()
      await page.getByRole('button', { name: 'Salvar', exact: true }).click()
      await page.getByRole('button', { name: 'Novo barbeiro' }).waitFor({ timeout: 15000 })
    })
    await step('servico', async () => {
      await page.getByRole('link', { name: 'Serviços' }).click()
      await page.getByRole('button', { name: 'Novo serviço' }).click()
      await page.getByLabel('Nome', { exact: true }).fill('Corte teste')
      await page.getByLabel('Duração (minutos)').fill('30')
      await page.getByLabel('Preço (R$)').fill('30,00')
      await page.getByRole('button', { name: 'Salvar', exact: true }).click()
      await page.getByText('Corte teste').waitFor({ timeout: 15000 })
    })
    await step('logo-e-capa', async () => {
      await page.getByRole('link', { name: 'Configurações' }).click()
      const inputs = page.locator('input[type=file]')
      await inputs.nth(0).setInputFiles(image)
      await page.getByRole('img', { name: 'Logo' }).waitFor({ timeout: 20000 })
      await inputs.nth(1).setInputFiles(image)
      await page.getByRole('img', { name: 'Capa' }).waitFor({ timeout: 20000 })
      await page.getByLabel('Endereço (rua, número, bairro)').fill('Avenida Paulista, 1000, Bela Vista')
      await page.getByLabel('Cidade', { exact: true }).fill('São Paulo')
      await page.getByLabel('UF', { exact: true }).fill('SP')
      await page.getByRole('button', { name: 'Salvar dados' }).click()
      await page.getByText('Alterações salvas').waitFor({ timeout: 15000 })
    })
    await step('imagens-na-pagina-publica', async () => {
      await page.goto(`${BASE}/${slug}`)
      await page.getByRole('button', { name: 'Agendar horário' }).waitFor({ timeout: 15000 })
      const logo = page.locator('header img')
      const cover = page.getByRole('img', { name: /Ambiente da/ })
      const barber = page.locator('#barbeiros img')
      for (const [nome, loc] of [['logo', logo], ['capa', cover], ['foto do barbeiro', barber]]) {
        await loc.first().waitFor({ timeout: 15000 })
        const ok = await loc.first().evaluate((img) => img.complete && img.naturalWidth > 0)
        if (!ok) throw new Error(`${nome} não carregou`)
      }
    })
    await step('agendar', async () => {
      await page.getByRole('button', { name: 'Agendar horário' }).click()
      await page.getByRole('dialog').getByRole('button', { name: /Corte teste/ }).click()
      await page.getByRole('dialog').getByRole('button', { name: /Sem preferência/ }).click()
      await page.waitForTimeout(1500)
      await page.getByRole('dialog').locator('.grid-cols-7 button:not([disabled])').first().click()
      const slotBtn = page.getByRole('dialog').getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
      await slotBtn.waitFor({ timeout: 15000 })
      await slotBtn.click()
      await page.getByLabel('Celular com DDD').fill('11987654321')
      await page.getByRole('button', { name: 'Continuar' }).click()
      await page.getByRole('button', { name: 'Confirmar agendamento' }).click()
      await page.getByRole('heading', { name: 'Agendamento confirmado' }).waitFor({ timeout: 15000 })
    })
    await step('salvar-na-agenda-ics', async () => {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: 'Salvar na agenda' }).click()])
      const file = await dl.path()
      const ics = fs.readFileSync(file, 'utf8')
      fs.writeFileSync('shots/agendamento.ics', ics)
      for (const must of ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'DTSTART:', 'DTEND:', 'SUMMARY:Corte teste', 'LOCATION:Avenida Paulista', 'BEGIN:VALARM', 'END:VCALENDAR']) {
        if (!ics.includes(must)) throw new Error(`arquivo .ics sem ${must}`)
      }
    })
  } else {
    await step('entrar', async () => {
      await page.goto(`${BASE}/entrar`)
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha').fill(password)
      await page.getByRole('button', { name: 'Entrar' }).click()
      await page.waitForURL('**/conta', { timeout: 20000 })
    })
    await step('aviso-teste-gratis-com-pix', async () => {
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
      await page.getByText(/Teste grátis: faltam \d+ dias/).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: 'Como assinar' }).click()
      await page.getByRole('button', { name: 'Copiar Pix copia e cola' }).waitFor({ timeout: 5000 })
      await page.getByText('Titular: Iolanda dos Santos Pontes').waitFor({ timeout: 5000 })
    })
    await step('administracao-carrega-configuracoes', async () => {
      await page.goto(`${BASE}/admin`)
      await page.getByRole('heading', { name: 'Administração' }).waitFor({ timeout: 15000 })
      const pix = await page.getByLabel('Chave Pix', { exact: true }).inputValue()
      if (!pix) throw new Error('chave Pix não carregou na Administração')
    })
    await step('registrar-pagamento', async () => {
      const row = page.locator('li').filter({ hasText: `/${slug}` })
      await row.getByText(/Teste até/).waitFor({ timeout: 15000 })
      await row.getByRole('button', { name: 'Registrar pagamento' }).click()
      await row.getByText(/Vence em/).waitFor({ timeout: 15000 })
      const status = await row.locator('select').inputValue()
      if (status !== 'active') throw new Error(`situação ficou ${status}, esperado active`)
    })
    await step('aviso-some-depois-de-pagar', async () => {
      await page.goto(`${BASE}/conta`)
      await page.getByRole('link', { name: 'Abrir painel' }).first().click()
      await page.getByText('Atendimentos hoje').waitFor({ timeout: 15000 })
      if (await page.getByRole('button', { name: /Pagar com Pix|Como assinar/ }).count()) throw new Error('aviso de cobrança continuou aparecendo')
    })
  }
} catch {
  // registrado no log
} finally {
  fs.writeFileSync(`shots/resultado-${PHASE}.txt`, log.join('\n') + '\n')
  await browser.close()
}
