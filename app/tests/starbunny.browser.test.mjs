import { test, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

let server, browser, context, page, base
const errors = []
before(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' })
  await server.listen()
  base = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await chromium.launch({ headless: true })
})
after(async () => { await browser?.close(); await server?.close() })
beforeEach(async () => {
  errors.length = 0
  context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  // Identical stars at the center make a full run reproducible through real UI input.
  await context.addInitScript(() => { Math.random = () => 0.5 })
  page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-11-20T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-20T12:00:01Z'))
})
afterEach(async () => { await context.close(); assert.deepEqual(errors, []) })
const goto = async () => {
  await page.goto(`${base}/#/game/starbunny`)
  await page.getByRole('button', { name: '별 주우러 가기' }).waitFor()
}
const start = async () => {
  await page.getByRole('button', { name: '별 주우러 가기' }).click()
  await page.clock.runFor(3200)
}
const x = () => page.locator('.starbunny__bunny').getAttribute('data-x').then(Number)

test('home card, original art and desktop/mobile layouts load without overflow', async () => {
  await page.goto(base)
  await page.locator('a.game-card[href="#/game/starbunny"]').click()
  await page.getByRole('button', { name: '별 주우러 가기' }).waitFor()
  assert.ok(await page.locator('.starbunny img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)))
  await page.screenshot({ path: join(tmpdir(), 'starbunny-desktop.png'), fullPage: true })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const button = await page.getByRole('button', { name: '별 주우러 가기' }).boundingBox()
    const bounds = await page.locator('.starbunny__stage').boundingBox()
    assert.ok(button.y >= bounds.y && button.y + button.height <= bounds.y + bounds.height)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: join(tmpdir(), 'starbunny-mobile.png'), fullPage: true })
})

test('keyboard, pointer, touch buttons and auto pause work without stuck movement', async () => {
  await goto(); await start()
  await page.keyboard.down('ArrowLeft'); await page.clock.runFor(350); await page.keyboard.up('ArrowLeft')
  assert.ok(await x() < 210)
  await page.keyboard.press('p')
  await page.getByRole('button', { name: '계속하기', exact: true }).first().waitFor()
  const remaining = await page.getByTestId('bunny-time').textContent()
  await page.clock.runFor(5000)
  assert.equal(await page.getByTestId('bunny-time').textContent(), remaining)
  await page.locator('.starbunny__primary').click()
  const stage = await page.locator('.starbunny__stage').boundingBox()
  await page.mouse.move(stage.x + stage.width * .8, stage.y + stage.height * .7)
  await page.clock.runFor(1000)
  assert.ok(await x() > 480)
  const left = page.getByRole('button', { name: '왼쪽으로 이동' })
  await left.scrollIntoViewIfNeeded()
  const button = await left.boundingBox()
  await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2)
  await page.mouse.down(); await page.clock.runFor(500); await page.mouse.up()
  assert.ok(await x() < 350)
  const stopped = await x()
  await page.clock.runFor(500)
  assert.equal(await x(), stopped)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  assert.equal(await page.locator('.starbunny__primary').textContent(), '계속하기')
  await page.clock.runFor(5000)
  assert.equal(await x(), stopped)
})

test('full run saves best score, result fits a small screen, replay resets, reload retains best', async () => {
  await goto(); await start()
  await page.clock.runFor(6000)
  await page.screenshot({ path: join(tmpdir(), 'starbunny-playing.png'), fullPage: true })
  await page.clock.runFor(59000)
  await page.getByRole('button', { name: '한 번 더 산책' }).waitFor()
  const score = Number((await page.getByTestId('bunny-score').textContent()).replaceAll(',', ''))
  assert.ok(score > 500)
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('minigame-arcade:best-scores')).starbunny), score)
  await page.setViewportSize({ width: 320, height: 740 })
  const button = await page.getByRole('button', { name: '한 번 더 산책' }).boundingBox()
  const bounds = await page.locator('.starbunny__stage').boundingBox()
  assert.ok(button.y >= bounds.y && button.y + button.height <= bounds.y + bounds.height)
  await page.screenshot({ path: join(tmpdir(), 'starbunny-result.png'), fullPage: true })
  await page.getByRole('button', { name: '한 번 더 산책' }).click()
  assert.equal(await page.getByTestId('bunny-score').textContent(), '0')
  assert.equal(await page.locator('.starbunny__drop').count(), 0)
  await page.reload()
  await page.getByRole('button', { name: '별 주우러 가기' }).waitFor()
  assert.equal(Number((await page.locator('.game-page__best-value').textContent()).replaceAll(',', '')), score)
})

test('touch dragging and cancellation release input on a mobile viewport', async () => {
  await page.setViewportSize({ width: 390, height: 844 })
  await goto(); await start()
  const bounds = await page.locator('.starbunny__stage').boundingBox()
  const client = await context.newCDPSession(page)
  const touch = [{ x: bounds.x + bounds.width * .2, y: bounds.y + bounds.height * .7 }]
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch })
  await page.clock.runFor(600)
  assert.ok(await x() < 160)
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...touch[0], x: bounds.x + bounds.width * .85 }] })
  await page.clock.runFor(1000)
  assert.ok(await x() > 500)
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  const stopped = await x()
  await page.clock.runFor(600)
  assert.equal(await x(), stopped)
})
