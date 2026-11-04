// Teste de ponta a ponta no site publicado, em tamanho de celular.
// Cria conta e barbearia de teste (prefixo e2e-), agenda, remarca, cancela e usa a agenda do painel.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.BASE_URL ?? 'https://barbes-three.vercel.app'
const stamp = Date.now().toString(36)
const email = `e2e-${stamp}@example.com`
const password = 'Teste12345'
const slug = `e2e-${stamp}`
const log = []
let n = 0
fs.mkdirSync('shots', { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
})
const page = await ctx.newPage()
page.on('dialog', (d) => d.accept())
page.on('pageerror', (e) => log.push(`ERRO NA PÁGINA: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') log.push(`console: ${m.text().slice(0, 200)}`)
})

async function shot(name) {
  n++
  await page.waitForTimeout(400)
  await page.screenshot({ path: `shots/${String(n).padStart(2, '0')}-${name}.png`, fullPage: true })
}
async function step(name, fn) {
  try {
    await fn()
    log.push(`OK   ${name}`)
    await shot(name)
  } catch (e) {
    log.push(`FALHOU ${name}: ${String(e.message).split('\n')[0]}`)
    await shot(`FALHA-${name}`)
    throw e
  }
}

try {
  await step('area-da-barbearia', async () => {
    await page.goto(`${BASE}/`)
    await page.getByRole('link', { name: /Área da barbearia/ }).click()
    await page.getByRole('heading', { name: 'Área da barbearia' }).waitFor({ timeout: 15000 })
  })

  await step('cadastro', async () => {
    await page.goto(`${BASE}/cadastro`)
    await page.getByLabel('Nome completo').fill('Teste Automático')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await page.waitForURL('**/conta', { timeout: 20000 })
  })

  await step('cadastrar-barbearia', async () => {
    await page.getByRole('button', { name: 'Cadastrar minha barbearia' }).click()
    await page.getByLabel('Nome da barbearia').fill(`E2E ${stamp}`)
    await page.getByLabel('Endereço da página').fill(slug)
    await page.getByRole('button', { name: 'Cadastrar barbearia' }).click()
    await page.getByText('Barbearia cadastrada').waitFor({ timeout: 15000 })
  })

  await step('abrir-painel', async () => {
    await page.getByRole('link', { name: 'Abrir painel' }).first().click()
    await page.getByRole('link', { name: 'Equipe' }).waitFor()
  })

  await step('equipe-dono-atende', async () => {
    await page.getByRole('link', { name: 'Equipe' }).click()
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByLabel('Eu também atendo clientes').check()
    for (const d of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']) {
      await page.getByLabel(d, { exact: true }).check()
    }
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

  await step('configuracoes-endereco', async () => {
    await page.getByRole('link', { name: 'Configurações' }).click()
    await page.getByLabel('Endereço (rua, número, bairro)').fill('Avenida Paulista, 1000, Bela Vista')
    await page.getByLabel('Cidade', { exact: true }).fill('São Paulo')
    await page.getByLabel('UF', { exact: true }).fill('SP')
    await page.getByRole('button', { name: 'Salvar dados' }).click()
    await page.getByText('Alterações salvas').waitFor({ timeout: 15000 })
  })

  await step('site-do-cliente', async () => {
    await page.goto(`${BASE}/`)
    await page.getByRole('heading', { name: 'Encontre sua barbearia e agende.' }).waitFor({ timeout: 15000 })
    await page.getByRole('link', { name: new RegExp(`E2E ${stamp}`) }).waitFor({ timeout: 15000 })
  })

  await step('site-do-cliente-busca', async () => {
    await page.getByPlaceholder('Nome da barbearia ou cidade').fill(`E2E ${stamp}`)
    await page.getByRole('link', { name: new RegExp(`E2E ${stamp}`) }).click()
    await page.waitForURL(`**/${slug}`, { timeout: 15000 })
  })

  await step('pagina-publica', async () => {
    await page.goto(`${BASE}/${slug}`)
    await page.getByRole('button', { name: 'Agendar horário' }).waitFor({ timeout: 15000 })
  })

  await step('agendar-servico', async () => {
    await page.getByRole('button', { name: 'Agendar horário' }).click()
    await page.getByRole('dialog').getByRole('button', { name: /Corte teste/ }).click()
  })
  await step('agendar-barbeiro', async () => {
    await page.getByRole('dialog').getByRole('button', { name: /Sem preferência/ }).click()
  })
  await step('agendar-data', async () => {
    const day = page.getByRole('dialog').locator('button[aria-label]:not([disabled])').filter({ hasNotText: /‹|›|✕/ }).first()
    await day.waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    // segundo dia livre: longe o bastante para ainda poder remarcar e cancelar online
    await page.getByRole('dialog').locator('.grid-cols-7 button:not([disabled])').nth(1).click()
  })
  await step('agendar-horario', async () => {
    const slotBtn = page.getByRole('dialog').getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
    await slotBtn.waitFor({ timeout: 15000 })
    await slotBtn.click()
  })
  await step('agendar-dados', async () => {
    await page.getByLabel('Celular com DDD').fill('11987654321')
    await page.getByRole('button', { name: 'Continuar' }).click()
  })
  await step('agendar-confirmar', async () => {
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click()
    await page.getByRole('heading', { name: 'Agendamento confirmado' }).waitFor({ timeout: 15000 })
  })

  await step('minha-conta-localizacao', async () => {
    await page.goto(`${BASE}/conta`)
    await page.getByRole('button', { name: 'Localização e salvar na agenda' }).click()
    await page.getByRole('link', { name: 'Google Maps' }).waitFor()
  })

  await step('remarcar', async () => {
    await page.getByRole('button', { name: 'Remarcar' }).click()
    await page.waitForTimeout(1500)
    const days = page.getByRole('dialog').locator('.grid-cols-7 button:not([disabled])')
    await days.nth(1).click()
    const slotBtn = page.getByRole('dialog').getByRole('button', { name: /^\d{2}:\d{2}$/ }).nth(2)
    await slotBtn.waitFor({ timeout: 15000 })
    await slotBtn.click()
    await page.getByRole('button', { name: 'Confirmar mudança' }).click()
    await page.getByRole('heading', { name: 'Horário remarcado' }).waitFor({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).last().click()
  })

  await step('cancelar', async () => {
    await page.getByRole('button', { name: 'Cancelar' }).first().click()
    await page.getByText('Cancelado').first().waitFor({ timeout: 15000 })
  })

  await step('painel-novo-agendamento', async () => {
    await page.getByRole('link', { name: 'Abrir painel' }).first().click()
    await page.getByRole('link', { name: 'Agenda' }).click()
    await page.getByRole('button', { name: 'Novo agendamento' }).click()
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    await page.getByLabel('Data').fill(tomorrow)
    await page.getByLabel('Horário').fill('10:00')
    await page.getByLabel('Nome do cliente').fill('Cliente Balcão')
    await page.getByLabel('Celular com DDD').fill('11912345678')
    await page.getByRole('button', { name: 'Agendar', exact: true }).click()
    await page.getByLabel('Nome do cliente').waitFor({ state: 'detached', timeout: 15000 })
  })

  await step('agenda-dia-seguinte', async () => {
    // a agenda já abre no dia do agendamento criado
    await page.getByText('Cliente Balcão').first().waitFor({ timeout: 15000 })
  })

  await step('agenda-iniciar-concluir', async () => {
    await page.getByRole('button', { name: 'Iniciar' }).first().click()
    await page.getByText('Em atendimento').first().waitFor({ timeout: 15000 })
    await page.getByRole('button', { name: 'Concluir' }).first().click()
    await page.getByText('Concluído').first().waitFor({ timeout: 15000 })
  })

  await step('agenda-bloquear', async () => {
    await page.getByRole('button', { name: 'Bloquear horário' }).click()
    await page.getByLabel('Dia inteiro').check()
    await page.getByRole('button', { name: 'Bloquear', exact: true }).click()
    await page.getByText('Bloqueado').first().waitFor({ timeout: 15000 })
  })

  await step('painel-inicio', async () => {
    await page.getByRole('link', { name: 'Início' }).click()
    await page.getByText('Atendimentos hoje').waitFor({ timeout: 15000 })
  })

  await step('sair', async () => {
    await page.goto(`${BASE}/conta`)
    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL('**/entrar', { timeout: 15000 })
  })
} catch {
  // o erro já foi registrado no log
} finally {
  fs.writeFileSync('shots/resultado.txt', [`conta: ${email}`, `barbearia: /${slug}`, ...log].join('\n') + '\n')
  await browser.close()
}
