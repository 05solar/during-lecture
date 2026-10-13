// OmokGame 페이지
// 오목(Gomoku) 게임. 15x15 판에서 사람(흑돌)과 규칙 기반 AI(백돌)가 번갈아 둔다.
// 교차점을 눌러 흑돌을 놓고, 먼저 5개를 연결하면 승리. 난이도(쉬움/중간/어려움)를 고를 수 있다.
// 게임이 끝나면 결과 점수를 scoreStore에 제출(최고 점수 유지)한다. 승리 점수는 난이도에 비례.
// (원본: Gangneung 프로젝트 → During-Lecture 테마/점수 시스템에 맞게 이식. 플레이어/백엔드 결합 제거)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import './OmokGame.css'

const N = 15
const PAD = 16
const STEP = 21
const W = STEP * (N - 1) + PAD * 2 // 326
const R = 8.5 // 돌 반지름
const BLACK = 1
const WHITE = 2
type Cell = 0 | 1 | 2
type Board = Cell[][]
type Status = 'playing' | 'won' | 'lost' | 'draw'
type Diff = 'easy' | 'medium' | 'hard'

const DIFFS: { key: Diff; label: string }[] = [
  { key: 'easy', label: '쉬움' },
  { key: 'medium', label: '중간' },
  { key: 'hard', label: '어려움' },
]

const emptyBoard = (): Board => Array.from({ length: N }, () => Array<Cell>(N).fill(0))
const DIRS = [
  [0, 1], [1, 0], [1, 1], [1, -1],
]

function inRange(r: number, c: number) {
  return r >= 0 && r < N && c >= 0 && c < N
}
function checkWin(b: Board, r: number, c: number, who: Cell): boolean {
  for (const [dr, dc] of DIRS) {
    let cnt = 1
    for (let s = 1; s < 5; s++) {
      const nr = r + dr * s, nc = c + dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) cnt++
      else break
    }
    for (let s = 1; s < 5; s++) {
      const nr = r - dr * s, nc = c - dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) cnt++
      else break
    }
    if (cnt >= 5) return true
  }
  return false
}

// (r,c)에 who가 뒀다고 가정했을 때의 라인 점수 합
function patternScore(len: number, ends: number): number {
  if (len >= 5) return 100000
  if (len === 4) return ends === 2 ? 10000 : ends === 1 ? 1000 : 0
  if (len === 3) return ends === 2 ? 1000 : ends === 1 ? 100 : 0
  if (len === 2) return ends === 2 ? 100 : ends === 1 ? 10 : 0
  if (len === 1) return ends === 2 ? 10 : ends === 1 ? 1 : 0
  return 0
}
function cellScore(b: Board, r: number, c: number, who: Cell): number {
  let total = 0
  for (const [dr, dc] of DIRS) {
    let len = 1
    let ends = 0
    // 정방향
    let s = 1
    while (true) {
      const nr = r + dr * s, nc = c + dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) { len++; s++ }
      else { if (inRange(nr, nc) && b[nr][nc] === 0) ends++; break }
    }
    // 역방향
    s = 1
    while (true) {
      const nr = r - dr * s, nc = c - dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) { len++; s++ }
      else { if (inRange(nr, nc) && b[nr][nc] === 0) ends++; break }
    }
    total += patternScore(len, ends)
  }
  return total
}
function hasNeighbor(b: Board, r: number, c: number): boolean {
  for (let dr = -2; dr <= 2; dr++)
    for (let dc = -2; dc <= 2; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr, nc = c + dc
      if (inRange(nr, nc) && b[nr][nc]) return true
    }
  return false
}
// (r,c)에 who가 두면 생기는 "위협(열린3 이상) 방향" 수 → 포크(쌍삼 등) 판별용
function threatCount(b: Board, r: number, c: number, who: Cell): number {
  let n = 0
  for (const [dr, dc] of DIRS) {
    let len = 1, ends = 0
    let s = 1
    while (true) {
      const nr = r + dr * s, nc = c + dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) { len++; s++ }
      else { if (inRange(nr, nc) && b[nr][nc] === 0) ends++; break }
    }
    s = 1
    while (true) {
      const nr = r - dr * s, nc = c - dc * s
      if (inRange(nr, nc) && b[nr][nc] === who) { len++; s++ }
      else { if (inRange(nr, nc) && b[nr][nc] === 0) ends++; break }
    }
    if (len >= 4 || (len === 3 && ends === 2)) n++
  }
  return n
}
function candidates(b: Board): [number, number][] {
  const list: [number, number][] = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (!b[r][c] && hasNeighbor(b, r, c)) list.push([r, c])
  return list
}
// 규칙기반 AI (난이도별 조정)
function aiMove(b: Board, diff: Diff): [number, number] {
  const cands = candidates(b)
  if (!cands.length) return [Math.floor(N / 2), Math.floor(N / 2)]

  // 쉬움: 35% 무작위, 아니면 수비를 거의 안 보는 약한 상위 후보 중 랜덤
  if (diff === 'easy') {
    if (Math.random() < 0.35) return cands[Math.floor(Math.random() * cands.length)]
    const scored = cands
      .map(([r, c]) => ({ rc: [r, c] as [number, number], v: cellScore(b, r, c, WHITE) + cellScore(b, r, c, BLACK) * 0.3 }))
      .sort((a, z) => z.v - a.v)
    const top = scored.slice(0, Math.min(5, scored.length))
    return top[Math.floor(Math.random() * top.length)].rc
  }

  // 중간/어려움: 공격 + 수비 가중합. 어려움은 수비를 더 무겁게 + 포크(쌍삼) 공격/차단 보너스
  const defW = diff === 'hard' ? 1.0 : 0.9
  let best: [number, number] = cands[0]
  let bestVal = -Infinity
  for (const [r, c] of cands) {
    const attack = cellScore(b, r, c, WHITE)
    const defense = cellScore(b, r, c, BLACK)
    let val = attack + defense * defW
    if (diff === 'hard') {
      if (threatCount(b, r, c, WHITE) >= 2) val += 800 // 내 포크 형성
      if (threatCount(b, r, c, BLACK) >= 2) val += 700 // 상대 포크 자리 선점
    }
    if (val > bestVal) { bestVal = val; best = [r, c] }
  }
  return best
}
function isFull(b: Board): boolean {
  return b.every((row) => row.every((v) => v))
}

export default function OmokGame() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [status, setStatus] = useState<Status>('playing')
  const [thinking, setThinking] = useState(false)
  const [gained, setGained] = useState(0)
  const [diff, setDiff] = useState<Diff>('medium')
  const [lastMove, setLastMove] = useState<[number, number] | null>(null)
  const posted = useRef(false)

  // 보드 표시 크기(px). PC(넓은 화면)에서는 훨씬 크게, 모바일에서는 화면 폭에 맞춘다.
  // 내부 좌표는 항상 W(326) 기준이며, 렌더 시 배율(scale)만 키워 선명하게 확대한다.
  const [disp, setDisp] = useState<number>(W)
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      const cap = vw >= 760 ? 600 : 360
      setDisp(Math.max(280, Math.min(vw - 48, cap)))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setStatus('playing')
    setThinking(false)
    setGained(0)
    setLastMove(null)
    posted.current = false
  }, [])

  const winPoints = diff === 'easy' ? 100 : diff === 'hard' ? 5000 : 1000

  const finish = useCallback(
    (result: Status) => {
      setStatus(result)
      if (posted.current) return
      posted.current = true
      const win = diff === 'easy' ? 100 : diff === 'hard' ? 5000 : 1000
      const pts = result === 'won' ? win : result === 'draw' ? 30 : 0
      setGained(pts)
      // 결과 점수 제출 (scoreStore가 최고 점수 유지)
      submitScore('omok', pts)
    },
    [diff]
  )

  const place = (r: number, c: number) => {
    if (status !== 'playing' || thinking || board[r][c]) return
    const nb = board.map((row) => [...row]) as Board
    nb[r][c] = BLACK
    setBoard(nb)
    setLastMove([r, c])
    if (checkWin(nb, r, c, BLACK)) return finish('won')
    if (isFull(nb)) return finish('draw')
    setThinking(true)
    window.setTimeout(() => {
      const [ar, ac] = aiMove(nb, diff)
      const nb2 = nb.map((row) => [...row]) as Board
      nb2[ar][ac] = WHITE
      setBoard(nb2)
      setLastMove([ar, ac])
      setThinking(false)
      if (checkWin(nb2, ar, ac, WHITE)) return finish('lost')
      if (isFull(nb2)) return finish('draw')
    }, 350)
  }

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    const y = (e.clientY - rect.top) * (W / rect.height)
    const c = Math.round((x - PAD) / STEP)
    const r = Math.round((y - PAD) / STEP)
    if (inRange(r, c)) place(r, c)
  }

  // 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const scale = disp / W // 내부 W좌표 → 표시 크기 배율
    canvas.width = Math.round(disp * dpr)
    canvas.height = Math.round(disp * dpr)
    canvas.style.width = disp + 'px'
    canvas.style.height = disp + 'px'
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
    // 판 (따뜻한 나무 톤 유지)
    ctx.fillStyle = '#e3b877'
    ctx.fillRect(0, 0, W, W)
    ctx.strokeStyle = '#8a5a2b'
    ctx.lineWidth = 1
    for (let i = 0; i < N; i++) {
      const p = PAD + i * STEP
      ctx.beginPath()
      ctx.moveTo(PAD, p); ctx.lineTo(W - PAD, p)
      ctx.moveTo(p, PAD); ctx.lineTo(p, W - PAD)
      ctx.stroke()
    }
    // 화점
    ctx.fillStyle = '#5a3a1e'
    for (const [r, c] of [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]]) {
      ctx.beginPath()
      ctx.arc(PAD + c * STEP, PAD + r * STEP, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // 돌 (흑/백 — 오목 고유 색 유지)
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (!board[r][c]) continue
        const x = PAD + c * STEP, y = PAD + r * STEP
        const black = board[r][c] === BLACK
        const g = ctx.createRadialGradient(x - 2.5, y - 2.5, 1, x, y, R)
        if (black) { g.addColorStop(0, '#5a5a5a'); g.addColorStop(1, '#151515') }
        else { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfcfcf') }
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, R, 0, Math.PI * 2)
        ctx.fill()
        if (!black) { ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 0.8; ctx.stroke() }
      }
    // 방금 착수한 돌: 옅게 빛나는 테두리
    if (lastMove) {
      const [lr, lc] = lastMove
      if (board[lr][lc]) {
        const x = PAD + lc * STEP, y = PAD + lr * STEP
        ctx.save()
        ctx.shadowColor = 'rgba(255, 224, 120, 0.9)'
        ctx.shadowBlur = 9
        ctx.strokeStyle = 'rgba(255, 238, 165, 0.95)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, R + 1.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }, [board, lastMove, disp])

  const statusText =
    status === 'won' ? `승리! +${gained}점`
    : status === 'lost' ? '패배… 다시 도전!'
    : status === 'draw' ? `무승부 +${gained}점`
    : thinking ? 'AI가 생각 중…' : '내 차례 (흑돌)'

  return (
    <GamePage gameId="omok" title="오목">
      <div className="omok">
        <div className="omok__bar">
          <span className={'omok__status' + (status !== 'playing' ? ' done' : '')}>{statusText}</span>
        </div>

        <div className="omok__diff">
          <span className="omok__diff-label">난이도</span>
          <div className="omok__diff-seg">
            {DIFFS.map((d) => (
              <button
                key={d.key}
                className={'omok__diff-btn' + (diff === d.key ? ' on' : '')}
                onClick={() => setDiff(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="omok__board-wrap">
          <canvas ref={canvasRef} className="omok__canvas" onClick={onClick} />
          {status !== 'playing' && (
            <div className="omok__over">
              <div className="omok__over-card">
                <h3>
                  {status === 'won' ? '승리!' : status === 'lost' ? '패배' : '무승부'}
                </h3>
                <p className="omok__over-pts">+{gained}점</p>
                <div className="omok__over-btns">
                  <button className="omok__btn omok__btn--primary" onClick={reset}>다시하기</button>
                  <button className="omok__btn" onClick={() => navigate('/')}>게임 목록</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="omok__actions">
          <button className="omok__btn" onClick={reset}>새 게임</button>
        </div>
        <p className="omok__hint">교차점을 눌러 흑돌을 놓으세요. 먼저 5개를 연결하면 승리! (현재 난이도 승리 +{winPoints}점)</p>
      </div>
    </GamePage>
  )
}
