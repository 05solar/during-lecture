// 별빛 토끼의 시간, 생성, 충돌, 콤보 규칙. 화면과 분리해 같은 규칙을 테스트한다.
export type Kind = 'star' | 'gold' | 'meteor' | 'shield'
export type Phase = 'ready' | 'countdown' | 'playing' | 'paused' | 'over'
export interface Drop { id: number; kind: Kind; x: number; y: number; speed: number }
export interface Spark { id: number; x: number; y: number; text: string; life: number }
export interface Game {
  phase: Phase; resume: 'countdown' | 'playing'; countdown: number; remaining: number
  x: number; score: number; hearts: number; combo: number; maxCombo: number; caught: number
  shield: boolean; invincible: number; drops: Drop[]; sparks: Spark[]
  spawnIn: number; shieldIn: number; serial: number; event: 'catch' | 'hurt' | 'shield' | null
}
export const WIDTH = 640
export const HEIGHT = 480
export const BUNNY = { width: 80, height: 88, top: 346 } as const
export const CATCH_Y = 418
export const DURATION = 60
// SVG의 귀 두 개와 몸통·바구니 범위. 표시 크기와 같은 좌표로 판정한다.
const BUNNY_HITBOXES = [
  { left: 6, right: 18, top: 0, bottom: 20 },
  { left: 22, right: 34, top: 0, bottom: 20 },
  { left: 2, right: 38, top: 20, bottom: 44 },
].map(box => ({
  left: (box.left / 40 - 0.5) * BUNNY.width,
  right: (box.right / 40 - 0.5) * BUNNY.width,
  top: BUNNY.top + box.top / 44 * BUNNY.height,
  bottom: BUNNY.top + box.bottom / 44 * BUNNY.height,
}))
const ITEM_RADIUS: Record<Kind, number> = { star: 24, gold: 28, meteor: 24, shield: 26 }
export const multiplier = (combo: number) => Math.min(3, 1 + Math.floor(combo / 5))
export const level = (remaining: number) => remaining > 40 ? 1 : remaining > 20 ? 2 : 3
export function createGame(phase: Phase = 'ready'): Game {
  return { phase, resume: 'playing', countdown: 3, remaining: DURATION, x: WIDTH / 2,
    score: 0, hearts: 3, combo: 0, maxCombo: 0, caught: 0, shield: false, invincible: 0,
    drops: [], sparks: [], spawnIn: 0.15, shieldIn: 9, serial: 0, event: null }
}
export function pauseGame(game: Game): Game {
  return game.phase === 'playing' || game.phase === 'countdown'
    ? { ...game, resume: game.phase, phase: 'paused' } : game
}
export function resumeGame(game: Game): Game {
  return game.phase === 'paused' ? { ...game, phase: game.resume } : game
}
export function stepGame(previous: Game, elapsed: number, direction: number, target: number | null, random = Math.random): Game {
  if (previous.phase !== 'playing' && previous.phase !== 'countdown') return previous
  // Long frames do not teleport objects through the catcher or consume background time.
  const dt = Math.min(Math.max(elapsed, 0), 0.05)
  if (previous.phase === 'countdown') {
    const countdown = Math.max(0, previous.countdown - dt)
    return { ...previous, countdown, phase: countdown === 0 ? 'playing' : 'countdown' }
  }
  const g: Game = { ...previous, drops: [], sparks: previous.sparks
    .map(s => ({ ...s, life: s.life - dt, y: s.y - dt * 28 })).filter(s => s.life > 0), event: null }
  g.remaining = Math.max(0, g.remaining - dt)
  g.invincible = Math.max(0, g.invincible - dt)
  const move = direction ? direction * 430 * dt : target === null ? 0 : Math.max(-430 * dt, Math.min(430 * dt, target - g.x))
  g.x = Math.max(BUNNY.width / 2, Math.min(WIDTH - BUNNY.width / 2, g.x + move))
  const spark = (text: string, x: number) => g.sparks.push({ id: ++g.serial, x, y: CATCH_Y - 34, text, life: 0.8 })
  for (const drop of previous.drops) {
    const next = { ...drop, y: drop.y + drop.speed * dt }
    const radius = ITEM_RADIUS[drop.kind]
    const collides = BUNNY_HITBOXES.some(box =>
      drop.y - radius <= box.bottom && next.y + radius >= box.top &&
      next.x + radius >= g.x + box.left && next.x - radius <= g.x + box.right)
    if (collides && g.hearts > 0) {
      if (drop.kind === 'meteor') {
        if (g.invincible === 0) {
          if (g.shield) { g.shield = false; g.event = 'shield' }
          else { g.hearts--; g.combo = 0; spark('−1', next.x); g.event = 'hurt' }
          g.invincible = 1.4
        }
      } else if (drop.kind === 'shield') {
        g.shield = true; g.event = 'shield'
      } else {
        g.combo++; g.caught++; g.maxCombo = Math.max(g.combo, g.maxCombo)
        const points = (drop.kind === 'gold' ? 30 : 10) * multiplier(g.combo)
        g.score += points; spark(`+${points}`, next.x)
        if (g.event !== 'hurt') g.event = 'catch'
      }
    } else if (next.y > HEIGHT + 20) {
      if (next.kind === 'star' || next.kind === 'gold') g.combo = 0
    } else g.drops.push(next)
  }
  if (g.remaining === 0 || g.hearts === 0) { g.phase = 'over'; return g }
  const stage = level(g.remaining)
  g.spawnIn -= dt; g.shieldIn -= dt
  const spawn = (kind: Kind) => g.drops.push({ id: ++g.serial, kind,
    x: 42 + random() * (WIDTH - 84), y: -24, speed: 125 + stage * 27 + random() * 26 })
  if (g.spawnIn <= 0) {
    const roll = random()
    spawn(roll < 0.18 + stage * 0.025 ? 'meteor' : roll > 0.88 ? 'gold' : 'star')
    g.spawnIn = 0.79 - stage * 0.13 + random() * 0.18
  }
  if (g.shieldIn <= 0) { spawn('shield'); g.shieldIn = 13 }
  return g
}
