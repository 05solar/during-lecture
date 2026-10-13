// Game2048 페이지
// 2048 퍼즐 게임. 방향키 또는 스와이프로 타일을 밀어 같은 수를 합친다.
// 게임 오버 시 이번 판 점수를 scoreStore에 제출(최고 점수 유지)한다.
// (원본: Gangneung 프로젝트 → During-Lecture 테마/점수 시스템에 맞게 이식)

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import './Game2048.css'

type Dir = 'left' | 'right' | 'up' | 'down'
interface Tile {
  id: number
  value: number
  r: number
  c: number
  isNew?: boolean
  merged?: boolean
}

const STEP = 80 // 칸(72) + 간격(8)
const SLIDE_MS = 130
const VEC: Record<Dir, [number, number]> = {
  left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0],
}

function buildGrid(tiles: Tile[]): (Tile | null)[][] {
  const g: (Tile | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null))
  tiles.forEach((t) => (g[t.r][t.c] = t))
  return g
}
function emptyCells(tiles: Tile[]): [number, number][] {
  const g = buildGrid(tiles)
  const cells: [number, number][] = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) cells.push([r, c])
  return cells
}
function canMove(tiles: Tile[]): boolean {
  const g = buildGrid(tiles)
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!g[r][c]) return true
      const v = g[r][c]!.value
      if (c < 3 && g[r][c + 1] && g[r][c + 1]!.value === v) return true
      if (r < 3 && g[r + 1][c] && g[r + 1][c]!.value === v) return true
    }
  return false
}

interface Plan {
  targets: Map<number, [number, number]>
  merges: { survivorId: number; absorbedId: number; value: number }[]
  moved: boolean
  gained: number
}
function planMove(tiles: Tile[], dir: Dir): Plan {
  const g = buildGrid(tiles)
  const [dr, dc] = VEC[dir]
  const rows = [0, 1, 2, 3]
  const cols = [0, 1, 2, 3]
  if (dir === 'right') cols.reverse()
  if (dir === 'down') rows.reverse()

  const occupied: (Tile | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null))
  const mergedHere: boolean[][] = Array.from({ length: 4 }, () => Array(4).fill(false))
  const targets = new Map<number, [number, number]>()
  const merges: Plan['merges'] = []
  let moved = false
  let gained = 0

  for (const r of rows) {
    for (const c of cols) {
      const tile = g[r][c]
      if (!tile) continue
      let nr = r, nc = c
      while (true) {
        const tr = nr + dr, tc = nc + dc
        if (tr < 0 || tr > 3 || tc < 0 || tc > 3 || occupied[tr][tc]) break
        nr = tr; nc = tc
      }
      const mr = nr + dr, mc = nc + dc
      const nb = mr >= 0 && mr < 4 && mc >= 0 && mc < 4 ? occupied[mr][mc] : null
      if (nb && nb.value === tile.value && !mergedHere[mr][mc]) {
        merges.push({ survivorId: nb.id, absorbedId: tile.id, value: tile.value * 2 })
        targets.set(tile.id, [mr, mc])
        mergedHere[mr][mc] = true
        gained += tile.value * 2
        moved = true
      } else {
        occupied[nr][nc] = tile
        targets.set(tile.id, [nr, nc])
        if (nr !== r || nc !== c) moved = true
      }
    }
  }
  return { targets, merges, moved, gained }
}

export default function Game2048() {
  const navigate = useNavigate()
  const [tiles, setTiles] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const idRef = useRef(1)
  const animating = useRef(false)
  const overRef = useRef(false)
  const posted = useRef(false)
  const timers = useRef<number[]>([])

  const spawn = useCallback((list: Tile[]): Tile[] => {
    const cells = emptyCells(list)
    if (!cells.length) return list
    const [r, c] = cells[Math.floor(Math.random() * cells.length)]
    return [...list, { id: idRef.current++, value: Math.random() < 0.9 ? 2 : 4, r, c, isNew: true }]
  }, [])

  const init = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    let list: Tile[] = []
    list = spawn(list)
    list = spawn(list)
    setTiles(list)
    setScore(0)
    setOver(false)
    overRef.current = false
    animating.current = false
    posted.current = false
  }, [spawn])

  useEffect(() => { init() }, [init])

  const doMove = useCallback(
    (dir: Dir) => {
      if (animating.current || overRef.current) return
      setTiles((cur) => {
        const plan = planMove(cur, dir)
        if (!plan.moved) return cur
        animating.current = true
        if (plan.gained) setScore((s) => s + plan.gained)
        const slid = cur.map((t) => {
          const [nr, nc] = plan.targets.get(t.id)!
          return { ...t, r: nr, c: nc, isNew: false, merged: false }
        })
        const t1 = window.setTimeout(() => {
          setTiles((prev) => {
            const absorbed = new Set(plan.merges.map((m) => m.absorbedId))
            const survVal = new Map(plan.merges.map((m) => [m.survivorId, m.value]))
            let next: Tile[] = prev
              .filter((t) => !absorbed.has(t.id))
              .map((t) =>
                survVal.has(t.id)
                  ? { ...t, value: survVal.get(t.id)!, merged: true, isNew: false }
                  : { ...t, merged: false, isNew: false }
              )
            next = spawn(next)
            if (!canMove(next)) {
              overRef.current = true
              setOver(true)
            }
            return next
          })
          animating.current = false
        }, SLIDE_MS)
        timers.current.push(t1)
        return slid
      })
    },
    [spawn]
  )

  // 게임 오버 시 점수 제출 (최고 점수 유지)
  useEffect(() => {
    if (over && !posted.current) {
      posted.current = true
      submitScore('2048', score)
    }
  }, [over, score])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      }
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left')
    else doMove(dy > 0 ? 'down' : 'up')
    touch.current = null
  }

  return (
    <GamePage gameId="2048" title="2048">
      <div className="g2048">
        <div className="g2048__scores">
          <div className="g2048__score">
            <span className="g2048__score-label">이번 점수</span>
            <span className="g2048__score-value">{score}</span>
          </div>
          <button className="g2048__new" onClick={init}>새 게임</button>
        </div>

        <div className="g2048__board-wrap">
          <div className="g2048__board" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="g2048__cell" />
            ))}
            {tiles.map((t) => (
              <div
                key={t.id}
                className={
                  'g2048__tile v' + t.value + (t.isNew ? ' new' : '') + (t.merged ? ' merged' : '')
                }
                style={{ '--x': `${t.c * STEP}px`, '--y': `${t.r * STEP}px` } as CSSProperties}
              >
                {t.value}
              </div>
            ))}
            {over && (
              <div className="g2048__over">
                <div className="g2048__over-card">
                  <h3>게임 오버</h3>
                  <p className="g2048__over-score">{score}점</p>
                  <div className="g2048__over-btns">
                    <button className="g2048__btn g2048__btn--primary" onClick={init}>다시하기</button>
                    <button className="g2048__btn" onClick={() => navigate('/')}>게임 목록</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="g2048__hint">방향키 또는 스와이프로 타일을 밀어 같은 숫자를 합치세요.</p>
      </div>
    </GamePage>
  )
}
