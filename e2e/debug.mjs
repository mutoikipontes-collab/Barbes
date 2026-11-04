import { chromium } from 'playwright'
import fs from 'node:fs'
fs.mkdirSync('shots', { recursive: true })
const log = []
const b = await chromium.launch()
const page = await b.newPage()
page.on('response', async (r) => { if (r.url().includes('public_city_counts')) log.push('resp ' + r.status() + ' ' + (await r.text().catch(() => '?'))) })
page.on('console', (m) => log.push('console ' + m.text()))
await page.goto('https://barbes-three.vercel.app/')
await page.waitForTimeout(3000)
await page.getByLabel('Sua cidade').fill('Açai')
await page.waitForTimeout(1000)
log.push('option: ' + (await page.getByRole('option').first().textContent()))
await page.screenshot({ path: 'shots/debug.png' })
fs.writeFileSync('shots/resultado-debug.txt', log.join('\n'))
await b.close()
