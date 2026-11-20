import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSync } from 'esbuild'
const code = buildSync({ entryPoints: ['src/pages/StarBunnyGame/engine.ts'], bundle: true, write: false, platform: 'node', format: 'esm' }).outputFiles[0].text
const { createGame, stepGame, pauseGame, resumeGame, multiplier, level, CATCH_Y, BUNNY } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
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

test('missing a star breaks streak without losing a heart; distant drops do not collide', () => {
  let g = { ...createGame('playing'), combo: 8, spawnIn: 10 }
  g = catchDrop(g, 'star', 50)
  assert.equal(g.score, 0)
  g = tick({ ...g, drops: [{ ...g.drops[0], y: 501 }] })
  assert.equal(g.combo, 0)
  assert.equal(g.hearts, 3)
})

test('smaller bunny catches touching items on both sides without reaching empty space', () => {
  for (const [kind, reach] of [['star', 60], ['gold', 64], ['shield', 62], ['meteor', 60]]) {
    for (const sign of [-1, 1]) {
      const initial = createGame('playing')
      const edge = catchDrop(initial, kind, initial.x + sign * reach)
      assert.equal(edge.drops.length, 0, `${kind} should collide at the visible body edge`)
      if (kind === 'meteor') assert.equal(edge.hearts, 2)
      else if (kind === 'shield') assert.equal(edge.shield, true)
      else assert.ok(edge.score > 0)
      const outside = catchDrop(initial, kind, initial.x + sign * (reach + 1))
      assert.equal(outside.drops.length, 1)
      assert.equal(outside.score, 0)
      assert.equal(outside.hearts, 3)
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

test('shield absorbs one meteor; invulnerability prevents stacked damage; three hits end a run', () => {
  let g = { ...createGame('playing'), combo: 6 }
  g = catchDrop(g, 'shield')
  g = catchDrop(g, 'meteor')
  assert.equal(g.hearts, 3)
  assert.equal(g.shield, false)
  assert.equal(g.combo, 6)
  g = catchDrop(g, 'meteor')
  assert.equal(g.hearts, 3)
  for (let i = 0; i < 3; i++) g = catchDrop({ ...g, invincible: 0 }, 'meteor')
  assert.equal(g.hearts, 0)
  assert.equal(g.combo, 0)
  assert.equal(g.phase, 'over')
  assert.equal(tick(g), g)
})

test('movement is bounded and time expiry freezes result; restart clears all state', () => {
  let g = createGame('playing')
  for (let i = 0; i < 180; i++) g = stepGame(g, 1 / 60, -1, null)
  assert.equal(g.x, 40)
  for (let i = 0; i < 180; i++) g = stepGame(g, 1 / 60, 0, 10000)
  assert.equal(g.x, 600)
  g = tick({ ...g, remaining: 0.001, score: 400 })
  assert.equal(g.phase, 'over')
  assert.equal(g.remaining, 0)
  assert.equal(tick(g).score, 400)
  assert.deepEqual(createGame('countdown').drops, [])
  assert.equal(createGame().score, 0)
  assert.deepEqual([level(60), level(39), level(19)], [1, 2, 3])
})

test('spawns stay in reachable bounds and deterministic full rounds end at 60 seconds', () => {
  let g = createGame('playing'), spawned = new Set(), lastId = 0
  for (let i = 0; i < 3601 && g.phase !== 'over'; i++) {
    // Keep the player away from drops to test the timer without an early loss.
    g = stepGame({ ...g, x: 38 }, 1 / 60, 0, null, () => 0.5)
    for (const drop of g.drops) {
      assert.ok(drop.x >= 42 && drop.x <= 598)
      if (drop.id > lastId) { spawned.add(drop.kind); lastId = drop.id }
    }
  }
  assert.equal(g.phase, 'over')
  assert.equal(g.hearts, 3)
  assert.ok(spawned.has('star') && spawned.has('shield'))
})
