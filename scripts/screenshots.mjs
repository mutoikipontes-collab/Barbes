// Tira fotos das telas públicas em tamanho de celular (usado só na verificação automática).
import { chromium } from 'playwright'

const base = process.env.BASE_URL ?? 'http://localhost:4173'
const pages = [
  ['landing', '/'],
  ['comecar', '/comecar'],
  ['entrar', '/entrar'],
]
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
for (const [name, path] of pages) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `shots/${name}.png`, fullPage: true })
}
await browser.close()
