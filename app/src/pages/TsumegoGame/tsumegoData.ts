// Tsumego (life-and-death) problem bank.
//
// Each problem is defined by a small eye-space polyomino anchored in a corner; the
// surrounding wall (defender's own stones) and the sealing ring outside it (attacker's
// context stones) are derived automatically by buildEnclosure() so every problem is a
// genuinely fully-enclosed local shape (no stray outside liberties). Correctness of the
// declared `goal` for every problem is self-checked against tsumegoSolver's real AND-OR
// search (see scripts/verifyTsumego — not shipped) rather than hand-typed solution lines.
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
// 8방향(대각 포함) 이웃. 벽(wall) 고리를 계산할 때만 쓴다 — 'ㄱ'자처럼 꺾인 궁도의
// 바깥쪽 모서리에서 사목(orthogonal) 팽창만 쓰면 벽이 대각선으로만 이어져 끊어지는
// 경우가 생기기 때문에(사목으로는 연결 안 된 돌 = 각각 다른 무리 = 가짜 문제가 됨),
// 대각까지 포함해 팽창시켜 벽이 항상 사목으로 하나의 무리가 되도록 한다.
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
  shapeName: string
}

// defenderColor is derived from goal: kill => white is the dying group, live => black is
// the group whose life is on the line. Black always moves first either way.
const defenderColorOf = (goal: Goal): Color => (goal === 'kill' ? 2 : 1)

// 10개 기본형 x 5가지 회전/반사 = 50문제. 각 기본형은 아래 __verify.ts 자체 검증 스크립트로
// (go.ts 실제 규칙 위에서 돌린 tsumegoSolver의 AND-OR 탐색 결과가 goal과 실제로 일치하는지)
// 전부 확인한 뒤 확정했다 — "죽는 게 맞다/사는 게 맞다"를 손으로 추정해 적어 넣지 않았다.
const SHAPES: ShapeDef[] = [
  { title: '일자 사궁 — 선수로 살기', difficulty: '중급', goal: 'live', shapeName: '직선 네 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { title: '구부러진 사궁 — 선수로 살기', difficulty: '중급', goal: 'live', shapeName: 'ㄴ자 네 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { title: '우긴사궁', difficulty: '중급', goal: 'kill', shapeName: '2x2 뭉친 네 칸 궁도', eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { title: '뾰족사궁', difficulty: '중급', goal: 'kill', shapeName: 'T자 네 칸 궁도', eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { title: '뾰족사궁 — 선수로 살기', difficulty: '중상급', goal: 'live', shapeName: 'T자 네 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { title: '일자 오궁 — 선수로 살기', difficulty: '중상급', goal: 'live', shapeName: '직선 다섯 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { title: '뭉친 오궁', difficulty: '중상급', goal: 'kill', shapeName: 'P자 다섯 칸 궁도', eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { title: '뭉친 오궁 — 선수로 살기', difficulty: '중상급', goal: 'live', shapeName: 'P자 다섯 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { title: '직사각형 육궁', difficulty: '상급', goal: 'kill', shapeName: '2x3 여섯 칸 궁도', eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { title: '직사각형 육궁 — 선수로 살기', difficulty: '상급', goal: 'live', shapeName: '2x3 여섯 칸 궁도(흑이 먼저 둠)', eyeSpace: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]] },
]

function rotate90([r, c]: Point): Point { return [c, 8 - r] }
function mirrorH([r, c]: Point): Point { return [r, 8 - c] }
function transform(p: Point, variant: number): Point {
  let out = p
  for (let i = 0; i < variant % 4; i++) out = rotate90(out)
  return variant >= 4 ? mirrorH(out) : out
}
function transformAll(points: Point[], variant: number): Point[] { return points.map((p) => transform(p, variant)) }

const VARIANTS_PER_SHAPE = [0, 1, 2, 3, 4] // 4 rotations + one mirrored rotation = 5 per shape

export const TSUMEGO_PROBLEMS: TsumegoProblem[] = SHAPES.flatMap((shape, shapeIdx) =>
  VARIANTS_PER_SHAPE.map((variant, vi) => {
    const defenderColor = defenderColorOf(shape.goal)
    const base = buildEnclosure(shape.eyeSpace, defenderColor)
    const number = shapeIdx * VARIANTS_PER_SHAPE.length + vi + 1
    return {
      number,
      title: `${shape.title} ${vi + 1}`,
      difficulty: shape.difficulty,
      goal: shape.goal,
      black: transformAll(base.black, variant),
      white: transformAll(base.white, variant),
      region: transformAll(base.region, variant),
      source: `표준 기본 사활형 · ${shape.shapeName}`,
    }
  })
)
