import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSync } from 'esbuild'
const code = buildSync({ entryPoints: ['src/pages/StarBunnyGame/engine.ts'], bundle: true, write: false, platform: 'node', format: 'esm' }).outputFiles[0].text
const { createGame, stepGame, pauseGame, resumeGame, multiplier, CATCH_Y, BUNNY } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const tick = g => stepGame(g, 1 / 60, 0, null, () => 0.5)
const catchDrop = (g, kind, x = g.x) => tick({ ...g, spawnIn: 10, drops: [{ id: 1000, kind, x, y: CATCH_Y - 13, speed: 180 }] })

test('countdown, pause and resume preserve time and cannot award points', () => {
  let g = createGame('countdown')
  const paused = pauseGame(g)
  assert.equal(tick(paused), paused)
  assert.equal(resumeGame(paused).phase, 'countdown')
  for (let i = 0; i < 181; i++) g = tick(g)
  assert.equal(g.phase, 'playing')
  assert.ok(g.remaining > 59.9)
  assert.equal(g.score, 0)
  const playingPause = pauseGame(g)
  assert.equal(tick(playingPause).remaining, g.remaining)
  assert.equal(resumeGame(playingPause).phase, 'playing')
})

test('catching awards once; streak multiplies from fifth and tenth catches', () => {
  let g = createGame('playing')
  for (let i = 0; i < 10; i++) g = catchDrop(g, 'star')
  assert.equal(g.score, 170)
  assert.equal(g.maxCombo, 10)
  assert.equal(g.caught, 10)
  assert.equal(g.drops.length, 0)
  assert.equal(tick(g).score, 170)
  g = catchDrop(g, 'gold')
  assert.equal(g.score, 260)
  assert.equal(multiplier(100), 3)
})

test('missing a star breaks streak without a penalty; distant drops do not collide', () => {
  let g = { ...createGame('playing'), combo: 8, spawnIn: 10 }
  g = catchDrop(g, 'star', 50)
  assert.equal(g.score, 0)
  g = tick({ ...g, drops: [{ ...g.drops[0], y: 501 }] })
  assert.equal(g.combo, 0)
  assert.equal(g.hits, 0)
})

test('smaller bunny catches touching items on both sides without reaching empty space', () => {
  for (const [kind, radius] of [['star', 24], ['gold', 28], ['shield', 26], ['meteor', 24]]) {
    const reach = BUNNY.width * 0.45 + radius
    for (const sign of [-1, 1]) {
      const initial = createGame('playing')
      const edge = catchDrop(initial, kind, initial.x + sign * (reach - 0.01))
      assert.equal(edge.drops.length, 0, `${kind} should collide at the visible body edge`)
      if (kind === 'meteor') assert.equal(edge.hits, 1)
      else if (kind === 'shield') assert.equal(edge.shield, true)
      else assert.ok(edge.score > 0)
      const outside = catchDrop(initial, kind, initial.x + sign * (reach + 1))
      assert.equal(outside.drops.length, 1)
      assert.equal(outside.score, 0)
      assert.equal(outside.hits, 0)
    }
  }
})

test('ear tips collect items once, with no collision above or beside the ears or below the basket', () => {
  const initial = { ...createGame('playing'), spawnIn: 10 }
  const drop = { id: 1000, kind: 'star', x: initial.x, y: BUNNY.top - 27, speed: 180 }
  for (const offset of [-16, 16]) {
    const caught = tick({ ...initial, drops: [{ ...drop, x: initial.x + offset }] })
    assert.equal(caught.score, 10)
    assert.equal(tick(caught).score, 10)
  }
  const above = tick({ ...initial, drops: [{ ...drop, y: BUNNY.top - 28 }] })
  assert.equal(above.score, 0)
  assert.equal(above.drops.length, 1)
  for (const offset of [-53, 53]) {
    const beside = tick({ ...initial, drops: [{ ...drop, x: initial.x + offset }] })
    assert.equal(beside.score, 0)
    assert.equal(beside.drops.length, 1)
  }
  const below = tick({ ...initial, drops: [{ ...drop, y: BUNNY.top + BUNNY.height + 25 }] })
  assert.equal(below.score, 0)
  assert.equal(below.drops.length, 1)
})

test('shield and invulnerability prevent penalties; repeated hits never end the timed round', () => {
  let g = { ...createGame('playing'), combo: 6, score: 100 }
  g = catchDrop(g, 'shield')
  g = catchDrop(g, 'meteor')
  assert.equal(g.hits, 0)
  assert.equal(g.score, 100)
  assert.equal(g.shield, false)
  assert.equal(g.combo, 6)
  g = catchDrop(g, 'meteor')
  assert.equal(g.hits, 0)
  for (let i = 0; i < 4; i++) {
    g = catchDrop({ ...g, invincible: 0 }, 'meteor')
    assert.equal(g.score, Math.max(0, 100 - 30 * (i + 1)))
  }
  assert.equal(g.hits, 4)
  assert.equal(g.combo, 0)
  assert.equal(g.phase, 'playing')
  g = catchDrop(g, 'star')
  assert.equal(g.score, 10)
  assert.equal(tick({ ...g, remaining: 0.001 }).phase, 'over')
})

test('movement is bounded and time expiry freezes result; restart clears all state', () => {
  let g = createGame('playing')
  for (let i = 0; i < 180; i++) g = stepGame(g, 1 / 60, -1, null)
  assert.equal(g.x, 36)
  for (let i = 0; i < 180; i++) g = stepGame(g, 1 / 60, 0, 10000)
  assert.equal(g.x, 604)
  g = tick({ ...g, remaining: 0.001, score: 400 })
  assert.equal(g.phase, 'over')
  assert.equal(g.remaining, 0)
  assert.equal(tick(g).score, 400)
  assert.deepEqual(createGame('countdown').drops, [])
  assert.equal(createGame().score, 0)
})

test('spawns stay in reachable bounds and deterministic full rounds end at 60 seconds', () => {
  let g = createGame('playing'), spawned = new Set(), lastId = 0
  for (let i = 0; i < 3601 && g.phase !== 'over'; i++) {
    // Keep the player away from drops to inspect every spawned kind.
    g = stepGame({ ...g, x: 38 }, 1 / 60, 0, null, () => 0.5)
    for (const drop of g.drops) {
      assert.ok(drop.x >= 42 && drop.x <= 598)
      if (drop.id > lastId) { spawned.add(drop.kind); lastId = drop.id }
    }
  }
  assert.equal(g.phase, 'over')
  assert.equal(g.hits, 0)
  assert.ok(spawned.has('star') && spawned.has('shield') && spawned.has('meteor'))
})

test('later windows spawn more meteors and faster point items without replacing rewards', () => {
  const windows = [60, 40, 20].map(remaining => {
    let game = { ...createGame('playing'), remaining, x: 36 }
    let meteors = 0, rewards = 0, totalSpeed = 0
    const seen = new Set()
    for (let i = 0; i < 600; i++) {
      game = stepGame(game, 1 / 60, 0, null, () => 0.5)
      for (const drop of game.drops) {
        if (seen.has(drop.id)) continue
        seen.add(drop.id)
        if (drop.kind === 'meteor') meteors++
        if (drop.kind === 'star' || drop.kind === 'gold') { rewards++; totalSpeed += drop.speed }
      }
    }
    return { meteors, rewards, speed: totalSpeed / rewards }
  })
  for (let i = 1; i < windows.length; i++) {
    assert.ok(windows[i].meteors > windows[i - 1].meteors)
    assert.ok(windows[i].rewards >= windows[i - 1].rewards)
    assert.ok(windows[i].speed > windows[i - 1].speed)
  }
  for (const roll of [0.5, 0.95]) {
    const spawnAt = remaining => stepGame({ ...createGame('playing'), remaining, spawnIn: 0 }, 1 / 60, 0, null, () => roll).drops[0]
    assert.ok(spawnAt(10).speed > spawnAt(60).speed)
    assert.equal(spawnAt(10).kind, roll > 0.88 ? 'gold' : 'star')
  }
})
