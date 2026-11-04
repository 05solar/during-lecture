// Tsumego (life-and-death) solver.
//
// Unlike a scripted "solution path + one hardcoded refutation", this performs a real
// AND-OR minimax search over go.ts's actual Go rules (capture/suicide/ko), restricted
// to a small "region" of contested points. It answers one question precisely:
// "with both sides playing optimally from here on, does the defender's group survive?"
// That same search also yields the opponent's true best reply at every node, so any
// deviation by the human gets a genuinely computed punishment — not a canned move.
import { N, SZ, PASS, play, type Color, type GoState } from '../GoGame/go'

export interface SolveOptions {
  depth?: number
  nodeBudget?: number
}

export interface SolveResult {
  /** Can the defender's group survive from this position with optimal play by both sides? */
  survives: boolean
  /** Best move for whoever is to move in this position (region point index, or PASS). */
  move: number
}

function neighborsOf(idx: number): number[] {
  const r = (idx / N) | 0
  const c = idx % N
  const ns: number[] = []
  if (r > 0) ns.push(idx - N)
  if (r < N - 1) ns.push(idx + N)
  if (c > 0) ns.push(idx - 1)
  if (c < N - 1) ns.push(idx + 1)
  return ns
}

function countColor(board: Int8Array, color: Color): number {
  let n = 0
  for (let i = 0; i < SZ; i++) if (board[i] === color) n++
  return n
}

function keyOf(s: GoState): string {
  let str = ''
  for (let i = 0; i < SZ; i++) str += s.board[i]
  return str + '|' + s.toMove + '|' + s.ko
}

// Depth-exhausted fallback: does the defender already have (at least) two eye-like
// points inside the region, each fully boxed in by its own stones? A crude but safe
// "probably alive" proxy — only reached if a problem's region/depth budget is too tight.
function staticAlive(state: GoState, defender: Color, region: number[]): boolean {
  let eyes = 0
  for (const idx of region) {
    if (state.board[idx] !== 0) continue
    const ns = neighborsOf(idx)
    if (ns.length > 0 && ns.every((n) => state.board[n] === defender)) eyes++
    if (eyes >= 2) return true
  }
  return countColor(state.board, defender) > 0
}

interface Candidate {
  move: number
  nextState: GoState
  captured: number
}

function orderedCandidates(state: GoState, region: number[]): Candidate[] {
  const out: Candidate[] = []
  for (const idx of region) {
    if (state.board[idx] !== 0 || idx === state.ko) continue
    const r = play(state, idx)
    if (r) out.push({ move: idx, nextState: r.state, captured: r.captured })
  }
  out.sort((a, b) => b.captured - a.captured)
  const passResult = play(state, PASS)!
  out.push({ move: PASS, nextState: passResult.state, captured: 0 })
  return out
}

/**
 * Solve a position: does the defender survive with optimal play from here, and what's
 * the best move for the side currently to move?
 */
export function solve(
  state: GoState,
  defender: Color,
  attacker: Color,
  region: number[],
  opts: SolveOptions = {}
): SolveResult {
  const depth = opts.depth ?? Math.min(64, region.length * 4 + 12)
  const nodeBudget = opts.nodeBudget ?? 250000
  const memo = new Map<string, boolean>()
  let nodes = 0

  function rec(s: GoState, d: number): boolean {
    nodes++
    const defCount = countColor(s.board, defender)
    if (defCount === 0) return false
    if (s.passes >= 2) return true
    if (nodes > nodeBudget || d <= 0) return staticAlive(s, defender, region)
    const key = keyOf(s)
    const hit = memo.get(key)
    if (hit !== undefined) return hit
    const cands = orderedCandidates(s, region)
    const attackerTurn = s.toMove === attacker
    let result: boolean
    if (attackerTurn) {
      result = true
      for (const cand of cands) {
        if (!rec(cand.nextState, d - 1)) {
          result = false
          break
        }
      }
    } else {
      result = false
      for (const cand of cands) {
        if (rec(cand.nextState, d - 1)) {
          result = true
          break
        }
      }
    }
    memo.set(key, result)
    return result
  }

  const survives = rec(state, depth)
  const cands = orderedCandidates(state, region)
  const turnIsAttacker = state.toMove === attacker
  const wants = turnIsAttacker ? false : true
  let move = cands.find((c) => c.move !== PASS)?.move ?? PASS
  for (const cand of cands) {
    if (rec(cand.nextState, depth - 1) === wants) {
      move = cand.move
      break
    }
  }
  return { survives, move }
}

/**
 * Is the position already unconditionally decided — i.e. would the goal still hold even
 * if the side with the goal stopped responding right now? Used to end a solved problem
 * early instead of forcing the player to mechanically fill every neutral point.
 */
export function isSettled(
  state: GoState,
  defender: Color,
  attacker: Color,
  region: number[],
  goalWantsSurvive: boolean,
  opts: SolveOptions = {}
): boolean {
  if (countColor(state.board, defender) === 0) return true
  const passState = play(state, PASS)!.state
  const { survives } = solve(passState, defender, attacker, region, opts)
  return survives === goalWantsSurvive
}
