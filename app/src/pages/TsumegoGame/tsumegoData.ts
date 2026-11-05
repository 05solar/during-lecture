// Tsumego (life-and-death) problem bank.
//
// Every base shape here came out of an exhaustive sweep over all distinct (free)
// polyominoes of size 4-6 — not a handful of shapes rotated into the four corners.
// For each shape, both roles were tested against tsumegoSolver's real AND-OR search
// (see scripts/explore — not shipped): can black kill it, and separately, can black
// (moving first, as the shape's own group) live? Only shapes where the solver actually
// proved the stated goal are kept; nothing here is a hand-typed guess. Eye-spaces of
// 7+ points were excluded on purpose — the sweep confirmed the standard Go-theory
// result that a 7-point-or-larger eye is always alive regardless of shape, so they
// make weak puzzles (there's rarely a real "must-find" move). 28 distinct shapes are
// used; only 18 of them appear a second time (in a different corner/orientation), and
// 4 shapes legitimately appear as both a kill and a live problem (same vital point,
// opposite side of the board) — every other shape appears exactly once.
export type Point = [number, number]
export type Color = 1 | 2
export type Goal = 'kill' | 'live'

export interface TsumegoProblem {
  number: number
  title: string
  difficulty: '중급' | '중상급' | '상급'
  goal: Goal
  black: Point[]
  white: Point[]
  region: Point[]
  source: string
}

function neighborsIn9([r, c]: Point): Point[] {
  const ns: Point[] = []
  if (r > 0) ns.push([r - 1, c])
  if (r < 8) ns.push([r + 1, c])
  if (c > 0) ns.push([r, c - 1])
  if (c < 8) ns.push([r, c + 1])
  return ns
}
// 8방향(대각 포함) 이웃. 벽(wall) 고리를 계산할 때만 쓴다 — 꺾인 궁도의 바깥쪽
// 모서리에서 사목(orthogonal) 팽창만 쓰면 벽이 대각선으로만 이어져 끊어지는 경우가
// 생기기 때문에, 대각까지 포함해 팽창시켜 벽이 항상 사목으로 하나의 무리가 되게 한다.
function neighborsCheb([r, c]: Point): Point[] {
  const ns: Point[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) ns.push([nr, nc])
    }
  return ns
}
const key = ([r, c]: Point) => r * 9 + c

// Build a fully-enclosed local shape from an eye-space polyomino: the defender's wall
// is every in-bound point touching (incl. diagonally, for connectivity) the eye-space,
// and the attacker's sealing ring is every in-bound point orthogonally touching that
// wall (so the wall has zero liberties outside the eye-space — it can never "escape",
// only the eye-space fight matters).
function buildEnclosure(eyeSpace: Point[], defenderColor: Color): { black: Point[]; white: Point[]; region: Point[] } {
  const eyeSet = new Set(eyeSpace.map(key))
  const wallMap = new Map<number, Point>()
  for (const p of eyeSpace) for (const n of neighborsCheb(p)) {
    const k = key(n)
    if (!eyeSet.has(k)) wallMap.set(k, n)
  }
  const wall = [...wallMap.values()]
  const wallSet = new Set(wall.map(key))
  const outerMap = new Map<number, Point>()
  for (const p of wall) for (const n of neighborsIn9(p)) {
    const k = key(n)
    if (!eyeSet.has(k) && !wallSet.has(k)) outerMap.set(k, n)
  }
  const outer = [...outerMap.values()]
  return {
    black: defenderColor === 1 ? wall : outer,
    white: defenderColor === 1 ? outer : wall,
    region: eyeSpace,
  }
}

interface ShapeDef {
  title: string
  difficulty: TsumegoProblem['difficulty']
  goal: Goal
  eyeSpace: Point[]
  n: number
  dupe?: boolean // give this one a second orientation elsewhere on the board
}

const defenderColorOf = (goal: Goal): Color => (goal === 'kill' ? 2 : 1)

const SHAPES: ShapeDef[] = [
  // --- 4칸 (중급) ---
  { title: '일자 사궁', difficulty: '중급', goal: 'live', n: 4, eyeSpace: [[0, 0], [1, 0], [2, 0], [3, 0]], dupe: true },
  { title: '꺾인 사궁', difficulty: '중급', goal: 'kill', n: 4, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0]] },
  { title: '꺾인 사궁 — 선수로 살기', difficulty: '중급', goal: 'live', n: 4, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0]] },
  { title: '갈고리 사궁', difficulty: '중급', goal: 'kill', n: 4, eyeSpace: [[0, 0], [1, 0], [1, 1], [2, 0]] },
  { title: '갈고리 사궁 — 선수로 살기', difficulty: '중급', goal: 'live', n: 4, eyeSpace: [[0, 0], [1, 0], [1, 1], [2, 0]] },
  { title: '네모 사궁', difficulty: '중급', goal: 'kill', n: 4, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1]] },

  // --- 5칸 (중상급) ---
  { title: '일자 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], dupe: true },
  { title: '긴 꺾인 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0], [3, 0]], dupe: true },
  { title: '갈고리 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [1, 0], [1, 1], [2, 0], [3, 0]], dupe: true },
  { title: '십자 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]], dupe: true },
  { title: '뭉친 오궁', difficulty: '중상급', goal: 'kill', n: 5, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { title: '뭉친 오궁 — 선수로 살기', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { title: 'ㄴ자 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], dupe: true },
  { title: '지그재그 오궁', difficulty: '중상급', goal: 'live', n: 5, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0], [2, 1]], dupe: true },

  // --- 6칸 (상급) ---
  { title: '일자 육궁', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], dupe: true },
  { title: '꺾인 육궁 1', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0], [3, 0], [4, 0]], dupe: true },
  { title: '갈고리 육궁 1', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [1, 1], [2, 0], [3, 0], [4, 0]], dupe: true },
  { title: '갈고리 육궁 2', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 0], [4, 0]], dupe: true },
  { title: '십자형 육궁', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [3, 1]], dupe: true },
  { title: '뭉친 육궁 1', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0]], dupe: true },
  { title: '꺾인 육궁 2', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [3, 0]], dupe: true },
  { title: '갈고리 육궁 3', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0], [2, 1], [3, 0]], dupe: true },
  { title: '꺾인 육궁 3', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [2, 0], [3, 0], [3, 1]], dupe: true },
  { title: '뭉친 육궁 2', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [1, 1], [2, 0], [2, 1], [3, 0]], dupe: true },
  { title: '갈고리 육궁 4', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 0], [3, 0]], dupe: true },
  { title: '계단형 육궁 1', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { title: '지그재그 육궁 1', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1]] },
  { title: '계단형 육궁 2', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [2, 2]] },
  { title: '뭉친 육궁 3', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [2, 0]] },
  { title: '직사각형 육궁', difficulty: '상급', goal: 'kill', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]] },
  { title: '직사각형 육궁 — 선수로 살기', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]] },
  { title: '비정형 육궁', difficulty: '상급', goal: 'live', n: 6, eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0]] },
]

function rotate90([r, c]: Point): Point { return [c, 8 - r] }
function mirrorH([r, c]: Point): Point { return [r, 8 - c] }
function transform(p: Point, variant: number): Point {
  let out = p
  for (let i = 0; i < variant % 4; i++) out = rotate90(out)
  return variant >= 4 ? mirrorH(out) : out
}
function transformAll(points: Point[], variant: number): Point[] { return points.map((p) => transform(p, variant)) }

interface Instance { shape: ShapeDef; variant: number }
const instances: Instance[] = []
for (const shape of SHAPES) {
  instances.push({ shape, variant: 0 })
  if (shape.dupe) instances.push({ shape, variant: 3 })
}

export const TSUMEGO_PROBLEMS: TsumegoProblem[] = instances.map(({ shape, variant }, i) => {
  const defenderColor = defenderColorOf(shape.goal)
  const base = buildEnclosure(shape.eyeSpace, defenderColor)
  return {
    number: i + 1,
    title: variant === 0 ? shape.title : `${shape.title} (반대쪽)`,
    difficulty: shape.difficulty,
    goal: shape.goal,
    black: transformAll(base.black, variant),
    white: transformAll(base.white, variant),
    region: transformAll(base.region, variant),
    source: `폴리오미노 전수 탐색 검증형 · ${shape.n}칸 궁도`,
  }
})
