// Source-backed solution trees. No heuristic life/death verdicts for unlisted moves.
import { emptyState, play, type Color, type GoState } from './tsumegoGo'
import { parseSgf, setupPoints, sgfPoint, type SgfNode } from './sgf'

export interface StudyNode {
  id: string
  move: number | null
  color?: Color
  comment: string
  correct: boolean
  hasSolution: boolean
  children: StudyNode[]
  labels: { point: number; text: string }[]
}
export interface StudyProblem {
  id: string
  number: number
  root: StudyNode
  initial: GoState
  player: Color
  raw: string
  sourceUrl: string
  points: number[]
  solutionCount: number
  depth: number
  tags: string[]
}
export interface StudyMove { point: number; color: Color }
export interface Position {
  state: GoState
  node: StudyNode | null
  path: number[]
  moves: StudyMove[]
}
export const coordinate = (point: number) => point < 0 ? '패스' : 'ABCDEFGHJKLMNOPQRST'[point % 19] + (19 - Math.floor(point / 19))

export function readProblem(raw: string, id: string): StudyProblem {
  const sgf = parseSgf(raw)
  if (sgf.props.SZ?.[0] !== '19') throw new Error('Only 19x19 problems are supported')
  const initial = emptyState()
  for (const [prop, color] of [['AB', 1], ['AW', 2]] as const) {
    for (const point of setupPoints(sgf.props[prop])) {
      if (point < 0 || initial.board[point]) throw new Error('Invalid setup')
      initial.board[point] = color
    }
  }
  const first = sgf.children[0]
  const player: Color = sgf.props.PL?.[0] === 'W' || first?.props.W ? 2 : 1
  initial.toMove = player
  const points = new Set<number>()
  initial.board.forEach((stone, point) => { if (stone) points.add(point) })
  let solutionCount = 0, depth = 0
  function convert(node: SgfNode, path: string, before: GoState, ply: number): StudyNode {
    if (ply > 0 && (node.props.AB || node.props.AW || node.props.AE)) throw new Error('Mid-tree setup needs review')
    const color: Color | undefined = node.props.B ? 1 : node.props.W ? 2 : undefined
    const move = color ? sgfPoint(node.props[color === 1 ? 'B' : 'W'][0]) : null
    let after = before
    if (color && move !== null) {
      if (color !== before.toMove) throw new Error(`Wrong turn at ${path}`)
      const played = play(before, move)
      if (!played) throw new Error(`Illegal move at ${path}: ${coordinate(move)}`)
      after = played.state
      if (move >= 0) points.add(move)
    }
    const comment = (node.props.C?.[0] ?? '').replace(/https?:\/\/\S+/g, '').trim()
    const correct = node.props.TE?.[0] === '1' || (/\bcorrect\b/i.test(comment) && !/\b(?:not|isn.t|never)\s+correct\b/i.test(comment))
    if (correct) { solutionCount++; depth = Math.max(depth, ply) }
    const children = node.children.map((child, index) => convert(child, `${path}.${index}`, after, ply + 1))
    return {
      id: path, move, color, comment, correct,
      hasSolution: correct || children.some(child => child.hasSolution), children,
      labels: (node.props.LB ?? []).map(label => ({ point: sgfPoint(label.slice(0, 2)), text: label.slice(3) })),
    }
  }
  const root = convert(sgf, 'root', initial, 0)
  if (!root.hasSolution) throw new Error('No explicit correct solution')
  const comments = raw.match(/C\[[\s\S]*?\]/g)?.join(' ') ?? ''
  const tags = ['상급']
  if (/\bko\b/i.test(comments)) tags.push('패')
  if (/\bseki\b/i.test(comments)) tags.push('빅')
  if (/\b(snapback|throw.in|sacrifice)\b/i.test(comments)) tags.push('수상전·묘수')
  if (depth >= 9) tags.push('긴 수읽기')
  return { id, number: Number(id.match(/\d+$/)?.[0]), root, initial, player, raw,
    sourceUrl: `https://github.com/gogameguru/go-problems/blob/eee12b2e39d59dbe81a8b9eaa7d4f103978d9224/weekly-go-problems/hard/${id}.sgf`,
    points: [...points], solutionCount, depth, tags }
}

export function startPosition(problem: StudyProblem): Position {
  return { state: problem.initial, node: problem.root, path: [], moves: [] }
}
export function advance(position: Position, move: number, color = position.state.toMove): Position | null {
  const played = play({ ...position.state, toMove: color }, move)
  if (!played) return null
  const childIndex = position.node?.children.findIndex(child => child.move === move && child.color === color) ?? -1
  return {
    state: played.state, node: childIndex >= 0 ? position.node!.children[childIndex] : null,
    path: [...position.path, childIndex], moves: [...position.moves, { point: move, color }],
  }
}
export function positionAt(problem: StudyProblem, path: number[]): Position {
  let position = startPosition(problem)
  for (const index of path) {
    const child = position.node?.children[index]
    if (!child || child.move === null) throw new Error('Invalid variation path')
    const next = advance(position, child.move, child.color)
    if (!next) throw new Error('Illegal variation')
    position = next
  }
  return position
}

export function historyAt(problem: StudyProblem, path: number[]): Position[] {
  return path.map((_, index) => positionAt(problem, path.slice(0, index)))
}

export interface ProgressEntry {
  attempts: number; solved: number; mistakes: number; streak: number
  due: number; bestSeconds: number | null; bookmarked: boolean; lastResult: 'solved' | 'review'
}
export type StudyProgress = Record<string, ProgressEntry>
export const PROGRESS_KEY = 'during-lecture:tsumego-study:v2'
export function loadProgress(raw: string | null): StudyProgress {
  try {
    const data: unknown = JSON.parse(raw ?? '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    const result: StudyProgress = {}
    for (const [id, value] of Object.entries(data)) {
      if (!/^ggg-hard-\d+$/.test(id) || !value || typeof value !== 'object') continue
      const entry = value as ProgressEntry
      if (![entry.attempts, entry.solved, entry.mistakes, entry.streak, entry.due].every(n => Number.isFinite(n) && n >= 0)) continue
      if (entry.bestSeconds !== null && (!Number.isFinite(entry.bestSeconds) || entry.bestSeconds < 0)) continue
      if (typeof entry.bookmarked !== 'boolean' || !['solved', 'review'].includes(entry.lastResult)) continue
      result[id] = entry
    }
    return result
  } catch { return {} }
}
export const emptyProgress = (): ProgressEntry => ({ attempts: 0, solved: 0, mistakes: 0, streak: 0, due: 0, bestSeconds: null, bookmarked: false, lastResult: 'review' })
export function recordResult(previous: ProgressEntry | undefined, clean: boolean, seconds: number, now: number): ProgressEntry {
  const entry = previous ?? emptyProgress()
  const streak = clean ? entry.streak + 1 : 0
  const days = [1, 3, 7, 14, 30][Math.min(Math.max(streak - 1, 0), 4)]
  return { ...entry, attempts: entry.attempts + 1, solved: entry.solved + (clean ? 1 : 0),
    mistakes: entry.mistakes + (clean ? 0 : 1), streak,
    due: now + (clean ? days * 86400000 : 10 * 60000), lastResult: clean ? 'solved' : 'review',
    bestSeconds: clean ? Math.min(entry.bestSeconds ?? Infinity, seconds) : entry.bestSeconds }
}
