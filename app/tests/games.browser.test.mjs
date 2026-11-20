import { test, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createServer } from 'vite'

let server, browser, context, page, base
const errors = []
before(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' })
  await server.listen(); base = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await chromium.launch({ headless: true })
})
after(async () => { await browser?.close(); await server?.close() })
beforeEach(async () => {
  errors.length = 0
  context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
})
afterEach(async () => { await context.close(); assert.deepEqual(errors, []) })
const goto = async game => { await page.goto(`${base}/#/game/${game}`); await page.locator(game === 'tsumego' ? '.tsumego__board' : '.whack__grid').waitFor() }
const coord = sgf => 'ABCDEFGHJKLMNOPQRST'[sgf.charCodeAt(0) - 97] + (19 - (sgf.charCodeAt(1) - 97))
async function move(sgf) {
  await page.getByRole('gridcell', { name: `${coord(sgf)} 빈 자리`, exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('.tsumego__message')?.textContent.includes('상대 응수 중'))
}
const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('during-lecture:tsumego-study:v2') ?? '{}'))

test('solve an authored line, preserve progress on reload, and review/download the SGF', async () => {
  await goto('tsumego')
  for (const point of ['cr', 'bs', 'es', 'gs']) await move(point)
  await page.locator('.tsumego__message.solved').waitFor()
  assert.equal((await progress())['ggg-hard-01'].solved, 1)
  await page.getByRole('button', { name: '한 수 되돌리기' }).click()
  assert.equal(await page.getByRole('button', { name: '해설 복기', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal((await progress())['ggg-hard-01'].solved, 1)
  await page.reload(); await page.locator('.tsumego__board').waitFor()
  assert.match(await page.locator('.tsumego__progress').innerText(), /^1/)
  await page.getByRole('button', { name: '해설 복기', exact: true }).click()
  await page.getByRole('button', { name: '다음 수 →', exact: true }).click()
  assert.match(await page.locator('.tsumego__move-strip').innerText(), /흑 C2/)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'SGF 내려받기' }).click()
  assert.equal((await downloadPromise).suggestedFilename(), 'ggg-hard-01.sgf')
})

test('all three defenses in problem 2 must be answered before awarding completion', async () => {
  await goto('tsumego')
  await page.getByRole('button', { name: '다음 문제 →', exact: true }).click()
  for (const point of ['jr', 'dr', 'fq', 'fs']) await move(point)
  await page.waitForFunction(() => document.querySelector('.tsumego__message')?.textContent.includes('다른 응수'))
  assert.equal((await progress())['ggg-hard-02']?.solved ?? 0, 0)
  assert.match(await page.locator('.tsumego__message').innerText(), /다른 응수/)
  for (const point of ['is', 'js', 'hs', 'fq', 'dr']) await move(point)
  await page.locator('.tsumego__message.solved').waitFor()
  assert.equal((await progress())['ggg-hard-02'].solved, 1)
  assert.match(await page.locator('.tsumego__facts').innerText(), /3개 응수 해결/)
})

test('unlisted moves are ungraded, hints stay in review, bookmarks do not count as mistakes', async () => {
  await goto('tsumego')
  await page.getByRole('button', { name: '문제 저장', exact: true }).click()
  assert.match(await page.locator('.tsumego__progress').innerText(), /복습 0/)
  await move('gs')
  assert.equal(await page.getByRole('gridcell', { name: 'E1 백돌', exact: true }).count(), 1)
  assert.match(await page.locator('.tsumego__message.refuted').innerText(), /반박 수/)
  await page.getByRole('button', { name: '한 수 되돌리기' }).click()
  assert.match(await page.locator('.tsumego__move-strip').innerText(), /착수하면/)
  await page.getByRole('button', { name: '19×19 전체' }).click()
  await move('aa')
  assert.match(await page.locator('.tsumego__message').innerText(), /정답·오답을 단정하지/)
  assert.equal((await progress())['ggg-hard-01'].solved, 0)
  await page.getByRole('button', { name: '다시 풀기', exact: true }).click()
  await page.getByRole('button', { name: '급소 힌트' }).click()
  for (const point of ['cr', 'bs', 'es', 'gs']) await move(point)
  await page.locator('.tsumego__message.solved').waitFor()
  assert.equal((await progress())['ggg-hard-01'].solved, 0)
  assert.equal((await progress())['ggg-hard-01'].lastResult, 'review')
})

test('navigation cancels a queued opponent reply and mobile board supports keyboard input', async () => {
  await goto('tsumego')
  await page.getByRole('gridcell', { name: 'C2 빈 자리', exact: true }).click()
  await page.getByRole('button', { name: '다음 문제 →', exact: true }).click()
  await page.waitForTimeout(500)
  assert.match(await page.locator('.tsumego__move-strip').innerText(), /착수하면/)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.getByRole('button', { name: '자유 분석', exact: true }).click()
  // Focus any empty intersection, then move the focus one step with the arrow key.
  const empty = page.getByRole('gridcell', { name: /빈 자리$/ }).first()
  await empty.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter')
  assert.match(await page.locator('.tsumego__move-strip').innerText(), /1\./)
  await page.getByRole('button', { name: '문제 선택', exact: true }).click()
  await page.getByLabel('학습 상태').selectOption('saved')
  assert.match(await page.locator('.tsumego__empty').innerText(), /조건에 맞는 문제가 없습니다/)
})

test('mole hit shows hammer/reaction once; misses, restart and reduced motion stay functional', async () => {
  await page.clock.install()
  await goto('whack')
  await page.getByRole('button', { name: '시작하기', exact: true }).click()
  await page.locator('.whack__hole.up').waitFor()
  const hit = await page.locator('.whack__hole.up').evaluate(el => {
    el.click(); el.click()
    return Array.from(el.parentElement.children).indexOf(el)
  })
  assert.equal(await page.locator('.whack__stat-value').first().textContent(), '1')
  assert.equal(await page.locator('.whack__hole').nth(hit).locator('.whack__strike.swinging').count(), 1)
  assert.ok(await page.locator('.whack__face-hit').first().evaluate(img => img.complete && img.naturalWidth > 0))
  await page.waitForTimeout(570)
  assert.equal(await page.locator('.whack__hole.hit').count(), 0)
  await page.locator('.whack__hole:not(.up)').first().click()
  assert.equal(await page.locator('.whack__stat-value').first().textContent(), '1')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.whack__hole.up').waitFor()
  await page.locator('.whack__hole.up').evaluate(el => el.click())
  assert.equal(await page.locator('.whack__hole.hit .whack__mole').evaluate(el => getComputedStyle(el).animationName), 'none')
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.clock.runFor(61000)
  await page.getByRole('button', { name: '다시하기', exact: true }).click()
  assert.equal(await page.locator('.whack__stat-value').first().textContent(), '0')
  assert.equal(await page.locator('.whack__hole.hit').count(), 0)
})

test('moles increase from one to three over time and can be caught independently', async () => {
  const now = new Date('2026-01-01T00:00:00Z')
  await page.clock.install({ time: now })
  await goto('whack')
  await page.clock.pauseAt(new Date(now.getTime() + 60000))
  await page.getByRole('button', { name: '시작하기', exact: true }).evaluate(el => el.click())
  const up = page.locator('.whack__hole.up')
  const score = page.locator('.whack__stat-value').first()
  const startedAt = await page.evaluate(() => Date.now())
  assert.equal(await up.count(), 1)
  assert.equal(await page.locator('.whack__stat-value').last().textContent(), '60s')
  await page.clock.runFor(1400)
  assert.equal(await up.count(), 1) // More time to react than the old 950 ms opening.
  await page.clock.runFor(100)
  assert.equal(await up.count(), 0)

  const advanceUntilCount = async count => {
    for (let i = 0; i < 20 && await up.count() !== count; i++) await page.clock.runFor(100)
    assert.equal(await up.count(), count)
  }
  await page.clock.runFor(17500)
  assert.ok(await up.count() <= 1)
  await page.clock.runFor(1000)
  await advanceUntilCount(2)
  const holes = await up.evaluateAll(elements => elements.map(el => Array.from(el.parentElement.children).indexOf(el)))
  await page.locator('.whack__hole').nth(holes[0]).evaluate(el => { el.click(); el.click() })
  assert.equal(await score.textContent(), '1')
  assert.equal(await up.count(), 1)
  assert.equal(await page.locator('.whack__hole').nth(holes[1]).getAttribute('aria-label'), '두더지')
  // Missing the remaining mole still lets it hide and starts another wave.
  await advanceUntilCount(0)
  await advanceUntilCount(2)
  await up.evaluateAll(elements => elements.forEach(el => { el.click(); el.click() }))
  assert.equal(await score.textContent(), '3')
  assert.equal(await up.count(), 0)
  await page.clock.runFor(360)
  assert.equal(await up.count(), 2)
  assert.equal(await page.locator('.whack__hole.up.hit').count(), 0)

  await page.clock.runFor(19000)
  await advanceUntilCount(3)
  const lateWave = await page.evaluate(() => Date.now())
  await advanceUntilCount(0)
  assert.ok(await page.evaluate(() => Date.now()) - lateWave < 1400) // Later waves still speed up.
  await advanceUntilCount(3)
  await up.evaluateAll(elements => elements.forEach(el => el.click()))
  assert.equal(await score.textContent(), '6')
  const elapsed = await page.evaluate(() => Date.now()) - startedAt
  await page.clock.runFor(59000 - elapsed)
  assert.equal(await page.locator('.whack__stat-value').last().textContent(), '1s')
  assert.equal(await page.locator('.whack__hole:enabled').count(), 9)
  await page.clock.runFor(1000)
  assert.equal(await up.count(), 0)
  assert.equal(await page.locator('.whack__hole.hit').count(), 0)
  assert.equal(await page.locator('.whack__hole:disabled').count(), 9)
  await page.getByRole('button', { name: '다시하기', exact: true }).evaluate(el => el.click())
  assert.equal(await score.textContent(), '0')
  assert.equal(await up.count(), 1)
  await page.clock.runFor(1000)
  assert.ok(await up.count() <= 1)
})

test('mole keyboard controls move within the grid, strike once per press and support restart', async () => {
  await page.addInitScript(() => { Math.random = () => 0.5 })
  const now = new Date('2026-01-01T00:00:00Z')
  await page.clock.install({ time: now })
  await goto('whack')
  await page.clock.pauseAt(new Date(now.getTime() + 60000))
  await page.getByRole('button', { name: '시작하기', exact: true }).focus()
  await page.keyboard.press('Enter')
  const holes = page.locator('.whack__hole')
  const score = page.locator('.whack__stat-value').first()
  const selected = async index => {
    assert.equal(await holes.nth(index).evaluate(el => el === document.activeElement), true)
    assert.match(await holes.nth(index).getAttribute('class'), /is-selected/)
    assert.equal(await page.locator('.whack__hole[tabindex="0"]').count(), 1)
  }
  await selected(4)
  await page.keyboard.down('Space')
  await page.keyboard.down('Space')
  assert.equal(await score.textContent(), '1')
  await page.clock.runFor(360)
  await page.keyboard.press('ArrowRight')
  await selected(5)
  // Holding Space while moving must not auto-hit another mole or fire on release.
  await page.keyboard.down('Space')
  await page.keyboard.up('Space')
  assert.equal(await score.textContent(), '1')
  await page.keyboard.press('Space')
  assert.equal(await score.textContent(), '2')

  const scroll = await page.evaluate(() => scrollY)
  for (const [key, index] of [
    ['ArrowRight', 5], ['ArrowUp', 2], ['ArrowUp', 2],
    ['ArrowLeft', 1], ['ArrowLeft', 0], ['ArrowLeft', 0],
    ['ArrowDown', 3], ['ArrowDown', 6], ['ArrowDown', 6],
    ['ArrowRight', 7], ['ArrowRight', 8], ['ArrowRight', 8],
  ]) {
    await page.keyboard.press(key)
    await selected(index)
  }
  await page.keyboard.press('Space') // Empty hole: no points and no scrolling.
  assert.equal(await score.textContent(), '2')
  await page.clock.runFor(100)
  assert.equal(await page.evaluate(() => scrollY), scroll)
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('whack__hole')), false)
  await holes.nth(0).click()
  await selected(0)
  await page.keyboard.press('ArrowDown')
  await selected(3)

  await page.clock.runFor(60000)
  const replay = page.getByRole('button', { name: '다시하기', exact: true })
  assert.equal(await replay.evaluate(el => el === document.activeElement), true)
  assert.equal(await page.locator('.whack__hole.is-selected').count(), 0)
  await page.keyboard.press('ArrowLeft')
  assert.equal(await score.textContent(), '2')
  await page.keyboard.press('Enter')
  await selected(4)
  assert.equal(await score.textContent(), '0')
  await page.keyboard.press('Space')
  assert.equal(await score.textContent(), '1')
})
