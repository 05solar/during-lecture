// Tsumego (life-and-death) solver.
//
// Unlike a scripted "solution path + one hardcoded refutation", this performs a real
// AND-OR minimax search over tsumegoGo's actual Go rules (capture/suicide/ko),
// restricted to a small "region" of contested points. It answers one question
// precisely: "with both sides playing optimally from here on, does the defender's
// group survive?" That same search also yields the opponent's true best reply at
// every node, so any deviation by the human gets a genuinely computed punishment —
// not a canned move.
import { N, SZ, PASS, play, type Color, type GoState } from './tsumegoGo'

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

// On a 19x19 board (SZ=361), hashing/scanning the whole board on every node is the
// dominant cost. Only `region` itself and whatever touches it can ever change — but
// "touches it" must follow whole groups, not just one ring of neighbors: a stone two
// steps from the region that's chained (same color, same group) to a region-adjacent
// stone is captured right along with it when that group's last liberty is filled, even
// though it never sits next to the region itself. Missing this produced a real bug:
// `defender permanently safe because of a stone outside the 1-ring` when that stone's
// whole group was in fact killable — found via a reference (unoptimized) solver
// disagreeing with this one. So: seed with region ∪ its neighbors, then flood-fill
// along same-color adjacency from every stone in that seed to pull in the rest of each
// touched group. Based on the *initial* board only — new stones placed during search
// are always inside `region` already, and can only ever touch this precomputed set
// (never reach further), so it stays valid for the whole search.
function mutableCellsOf(board: Int8Array, region: number[]): number[] {
  const set = new Set(region)
  const frontier: number[] = []
  for (const idx of region) for (const n of neighborsOf(idx)) if (!set.has(n)) { set.add(n); frontier.push(n) }
  while (frontier.length) {
    const cur = frontier.pop()!
    const color = board[cur]
    if (color === 0) continue
    for (const n of neighborsOf(cur)) {
      if (board[n] === color && !set.has(n)) { set.add(n); frontier.push(n) }
    }
  }
  return [...set]
}

function keyOf(s: GoState, cells: number[]): string {
  let str = ''
  for (const i of cells) str += s.board[i]
  return str + '|' + s.toMove + '|' + s.ko
}

// Depth-exhausted fallback: does the defender already have (at least) two eye-like
// points inside the region, each fully boxed in by its own stones? A crude but safe
// "probably alive" proxy — only reached if a problem's region/depth budget is too tight.
function staticAlive(state: GoState, defender: Color, region: number[], hasAnyDefenderStone: () => boolean): boolean {
  let eyes = 0
  for (const idx of region) {
    if (state.board[idx] !== 0) continue
    const ns = neighborsOf(idx)
    if (ns.length > 0 && ns.every((n) => state.board[n] === defender)) eyes++
    if (eyes >= 2) return true
  }
  return hasAnyDefenderStone()
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

  // A defender stone sitting outside (region ∪ its neighbors) can never be captured —
  // no search move can ever reach it — so its mere presence in the *initial* position
  // already guarantees "defender survives" for the whole search, with no per-node scan.
  const mutable = mutableCellsOf(state.board, region)
  const mutableSet = new Set(mutable)
  const hasPermanentDefender = (() => {
    for (let i = 0; i < SZ; i++) if (state.board[i] === defender && !mutableSet.has(i)) return true
    return false
  })()
  const hasAnyDefenderStone = (s: GoState): boolean =>
    hasPermanentDefender || mutable.some((i) => s.board[i] === defender)

  function rec(s: GoState, d: number): boolean {
    nodes++
    if (!hasAnyDefenderStone(s)) return false
    if (s.passes >= 2) return true
    if (nodes > nodeBudget || d <= 0) return staticAlive(s, defender, region, () => hasAnyDefenderStone(s))
    const key = keyOf(s, mutable)
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
