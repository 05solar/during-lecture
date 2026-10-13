// GoGame 페이지
// 9×9 바둑(Go). 사람(흑)이 AI(백)와 대국한다. AI 탐색(MCTS)과 종국 계가는
// 웹워커(goWorker.ts)에서 돌아가 UI를 막지 않는다. 두 번 연속 패스하면 죽은 돌을
// 자동 판정해 한국식(집 + 사석) 계가를 한다.
// 승리 시 집 승 차이(margin)를 점수로 scoreStore에 제출(최고 점수 유지)한다.
// (원본: Gangneung 프로젝트 → During-Lecture 테마/점수 시스템에 맞게 이식)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import {
  N,
  PASS,
  KOMI,
  emptyState,
  play,
  toIdx,
  type GoState,
  type Diff,
  type FinalResult,
} from './go'
import { notifyStop, requestAiMove, requestFinalize } from './goAi'
import './GoGame.css'

const PAD = 28
const STEP = 34
const W = STEP * (N - 1) + PAD * 2 // 328
const R = 15 // 돌 반지름
const STARS = [
  [2, 2], [2, 6], [6, 2], [6, 6], [4, 4],
] // 9×9 화점
const COLS = 'ABCDEFGHJ' // 바둑 좌표(I 생략)

const PLACE_MS = 170 // 착수 팝 애니메이션
const CAPTURE_MS = 300 // 따냄 페이드 애니메이션

type Status = 'playing' | 'scoring' | 'won' | 'lost'

const DIFFS: { key: Diff; label: string }[] = [
  { key: 'easy', label: '쉬움' },
  { key: 'medium', label: '중간' },
  { key: 'hard', label: '어려움' },
]

const BLACK = 1

interface Snap {
  state: GoState
  lastMove: number | null
  moves: number
}

interface Anim {
  idx: number
  color: 1 | 2
  kind: 'place' | 'capture'
  t0: number
}

// 호버 미리보기는 마우스 환경에서만
const HOVER_OK =
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover)').matches

// ── 착수음: 웹오디오로 짧은 '딱' 소리 (파일 불필요) ──────────────
let audio: AudioContext | null = null
function stoneSound(capture: boolean) {
  try {
    type AudioWin = Window & { webkitAudioContext?: typeof AudioContext }
    const AC = window.AudioContext || (window as AudioWin).webkitAudioContext
    if (!AC) return
    audio = audio || new AC()
    if (audio.state === 'suspended') void audio.resume()
    const t = audio.currentTime
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(capture ? 340 : 230, t)
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.09)
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
    osc.connect(gain).connect(audio.destination)
    osc.start(t)
    osc.stop(t + 0.14)
  } catch {
    /* 사운드 실패는 무시 */
  }
}

// easeOutBack: 살짝 튀었다 자리 잡는 팝 느낌
function easeOutBack(k: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const x = k - 1
  return 1 + c3 * x * x * x + c1 * x * x
}

export default function GoGame() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<GoState>(emptyState)
  const [status, setStatus] = useState<Status>('playing')
  const [thinking, setThinking] = useState(false)
  const [gained, setGained] = useState(0)
  const [diff, setDiff] = useState<Diff>('medium')
  const [lastMove, setLastMove] = useState<number | null>(null)
  const [result, setResult] = useState<FinalResult | null>(null)
  const [resigned, setResigned] = useState(false)
  const [hist, setHist] = useState<Snap[]>([])
  const [hover, setHover] = useState<number | null>(null)
  const [showCard, setShowCard] = useState(true)
  const [moves, setMoves] = useState(0)
  const posted = useRef(false)
  const reqRef = useRef(0) // 진행 중인 워커 요청 무효화용
  const animsRef = useRef<Anim[]>([])

  // 보드 표시 크기(px). PC(넓은 화면)에서는 훨씬 크게, 모바일에서는 화면 폭에 맞춘다.
  // 내부 좌표는 항상 W(328) 기준이며, 렌더 시 배율(scale)만 키워 선명하게 확대한다.
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

  // 화면을 떠나면 워커 폰더링 중단
  useEffect(() => () => notifyStop(), [])

  const reset = useCallback(() => {
    reqRef.current++
    notifyStop()
    animsRef.current = []
    setState(emptyState())
    setStatus('playing')
    setThinking(false)
    setGained(0)
    setLastMove(null)
    setResult(null)
    setResigned(false)
    setHist([])
    setHover(null)
    setShowCard(true)
    setMoves(0)
    posted.current = false
  }, [])

  // 이전 판 → 새 판 비교로 착수/따냄 애니메이션 등록 + 착수음
  const addAnims = (prev: Int8Array, next: Int8Array, placed: number) => {
    const t0 = performance.now()
    let captured = false
    for (let i = 0; i < N * N; i++) {
      if (prev[i] !== 0 && next[i] === 0) {
        animsRef.current.push({ idx: i, color: prev[i] as 1 | 2, kind: 'capture', t0 })
        captured = true
      }
    }
    if (next[placed] !== 0) {
      animsRef.current.push({ idx: placed, color: next[placed] as 1 | 2, kind: 'place', t0 })
    }
    stoneSound(captured)
  }

  // 종국 처리: 죽은 돌 자동 판정(워커) → 한국식 계가 → 점수 제출
  const finish = useCallback((s: GoState, byResign = false) => {
    setStatus('scoring')
    setThinking(false)
    setResigned(byResign)
    const rid = ++reqRef.current
    requestFinalize(s).then((sc) => {
      if (rid !== reqRef.current) return // 그 사이 새 게임 시작됨
      setResult(sc)
      setShowCard(true)
      const humanWon = !byResign && sc.winner === BLACK
      setStatus(humanWon ? 'won' : 'lost')
      // 승리 시 집 승 차이(margin)를 점수로 제출. 패/기권은 0점. (최고 점수 유지)
      const pts = humanWon ? Math.max(1, Math.round(sc.margin)) : 0
      setGained(pts)
      if (posted.current) return
      posted.current = true
      submitScore('baduk', pts)
    })
  }, [])

  // AI(백) 착수 — 웹워커에서 비동기 탐색
  const aiTurn = useCallback(
    (s: GoState) => {
      setThinking(true)
      const rid = ++reqRef.current
      requestAiMove(s, diff).then((mv) => {
        if (rid !== reqRef.current) return // 무르기/새 게임으로 무효화됨
        const r = play(s, mv)
        const ns = r ? r.state : play(s, PASS)!.state
        if (r && mv !== PASS) addAnims(s.board, ns.board, mv)
        setState(ns)
        setLastMove(mv === PASS || !r ? null : mv)
        setMoves((m) => m + 1)
        setThinking(false)
        if (ns.passes >= 2) finish(ns)
      })
    },
    [diff, finish]
  )

  // 사람(흑) 착수
  const place = (idx: number) => {
    if (status !== 'playing' || thinking || state.toMove !== BLACK) return
    const r = play(state, idx)
    if (!r) return // 불법수(자리참·패·자살수)
    setHist((h) => [...h, { state, lastMove, moves }])
    addAnims(state.board, r.state.board, idx)
    setState(r.state)
    setLastMove(idx)
    setMoves((m) => m + 1)
    setHover(null)
    if (r.state.passes >= 2) return finish(r.state)
    aiTurn(r.state)
  }

  const humanPass = () => {
    if (status !== 'playing' || thinking || state.toMove !== BLACK) return
    const r = play(state, PASS)!
    setHist((h) => [...h, { state, lastMove, moves }])
    setState(r.state)
    setLastMove(null)
    setMoves((m) => m + 1)
    if (r.state.passes >= 2) return finish(r.state)
    aiTurn(r.state)
  }

  // 무르기: 내 마지막 착수 직전(AI 응수 포함)으로 되돌림
  const undo = () => {
    if (status !== 'playing' || thinking || hist.length === 0) return
    const snap = hist[hist.length - 1]
    reqRef.current++
    notifyStop()
    animsRef.current = []
    setHist((h) => h.slice(0, -1))
    setState(snap.state)
    setLastMove(snap.lastMove)
    setMoves(snap.moves)
    setHover(null)
  }

  const resign = () => {
    if (status !== 'playing' || thinking) return
    finish(state, true)
  }

  const pointFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    const y = (e.clientY - rect.top) * (W / rect.height)
    const c = Math.round((x - PAD) / STEP)
    const r = Math.round((y - PAD) / STEP)
    return r >= 0 && r < N && c >= 0 && c < N ? toIdx(r, c) : null
  }

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const idx = pointFromEvent(e)
    if (idx != null) place(idx)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!HOVER_OK) return
    if (status !== 'playing' || thinking || state.toMove !== BLACK) {
      if (hover != null) setHover(null)
      return
    }
    const idx = pointFromEvent(e)
    const ok = idx != null && state.board[idx] === 0 && idx !== state.ko
    setHover(ok ? idx : null)
  }

  // 렌더링 (애니메이션 중에는 rAF 루프)
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

    const px = (idx: number): [number, number] => [PAD + (idx % N) * STEP, PAD + Math.floor(idx / N) * STEP]

    const drawStone = (x: number, y: number, color: number, rad: number, alpha: number) => {
      ctx.globalAlpha = alpha
      const black = color === BLACK
      const g = ctx.createRadialGradient(x - rad * 0.27, y - rad * 0.27, 1, x, y, rad)
      if (black) {
        g.addColorStop(0, '#5a5a5a')
        g.addColorStop(1, '#151515')
      } else {
        g.addColorStop(0, '#ffffff')
        g.addColorStop(1, '#cfcfcf')
      }
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
      if (!black) {
        ctx.strokeStyle = '#b0b0b0'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const gameOver = (status === 'won' || status === 'lost') && result != null
    const deadSet = gameOver ? new Set(result.dead) : null

    const draw = (): boolean => {
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
      // 판 (따뜻한 우드 톤 — 게임 고유색 유지)
      ctx.fillStyle = '#e3b877'
      ctx.fillRect(0, 0, W, W)
      ctx.strokeStyle = '#8a5a2b'
      ctx.lineWidth = 1
      for (let i = 0; i < N; i++) {
        const p = PAD + i * STEP
        ctx.beginPath()
        ctx.moveTo(PAD, p)
        ctx.lineTo(W - PAD, p)
        ctx.moveTo(p, PAD)
        ctx.lineTo(p, W - PAD)
        ctx.stroke()
      }
      // 좌표 (위: A~J, 왼쪽: 9~1)
      ctx.fillStyle = 'rgba(90, 58, 30, 0.7)'
      ctx.font = '700 9px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < N; i++) {
        const p = PAD + i * STEP
        ctx.fillText(COLS[i], p, 10)
        ctx.fillText(String(N - i), 10, p)
      }
      // 화점
      ctx.fillStyle = '#5a3a1e'
      for (const [r, c] of STARS) {
        ctx.beginPath()
        ctx.arc(PAD + c * STEP, PAD + r * STEP, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      const now = performance.now()
      animsRef.current = animsRef.current.filter(
        (a) => now - a.t0 < (a.kind === 'place' ? PLACE_MS : CAPTURE_MS)
      )
      const anims = animsRef.current
      const placeAnim = new Map<number, Anim>()
      for (const a of anims) if (a.kind === 'place') placeAnim.set(a.idx, a)

      // 돌 (죽은 돌은 반투명, 착수 직후엔 팝 애니메이션)
      const b = state.board
      for (let i = 0; i < N * N; i++) {
        if (!b[i]) continue
        const [x, y] = px(i)
        let rad = R
        const a = placeAnim.get(i)
        if (a) {
          const k = Math.min(1, (now - a.t0) / PLACE_MS)
          rad = R * (0.65 + 0.35 * easeOutBack(k))
        }
        const alpha = deadSet?.has(i) ? 0.35 : 1
        drawStone(x, y, b[i], rad, alpha)
      }
      // 따낸 돌 페이드아웃
      for (const a of anims) {
        if (a.kind !== 'capture') continue
        const k = Math.min(1, (now - a.t0) / CAPTURE_MS)
        const [x, y] = px(a.idx)
        drawStone(x, y, a.color, R * (1 - 0.25 * k), 1 - k)
      }
      // 마지막 착수 표시
      if (!gameOver && lastMove != null && b[lastMove]) {
        const [x, y] = px(lastMove)
        ctx.strokeStyle = b[lastMove] === BLACK ? 'rgba(255,238,165,0.95)' : 'rgba(220,60,60,0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, R * 0.45, 0, Math.PI * 2)
        ctx.stroke()
      }
      // 착수 미리보기(고스트 돌)
      if (!gameOver && hover != null && b[hover] === 0) {
        const [x, y] = px(hover)
        drawStone(x, y, BLACK, R, 0.4)
      }
      // 종국: 집(영역) 표시 — 사석 자리 포함
      if (gameOver && result) {
        for (let i = 0; i < N * N; i++) {
          if (b[i] !== 0 && !deadSet!.has(i)) continue
          const t = result.territory[i]
          if (t === 0) continue
          const [x, y] = px(i)
          if (t === BLACK) {
            ctx.fillStyle = '#151515'
            ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
          } else {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
            ctx.strokeStyle = '#666'
            ctx.lineWidth = 1
            ctx.strokeRect(x - 3.5, y - 3.5, 7, 7)
          }
        }
      }
      return anims.length > 0
    }

    let raf = 0
    const loop = () => {
      if (draw()) raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [state, lastMove, hover, result, status, disp])

  const statusText =
    status === 'won'
      ? `승리! +${gained}점`
      : status === 'lost'
      ? resigned
        ? '기권패… 다시 도전!'
        : '패배… 다시 도전!'
      : status === 'scoring'
      ? '계가 중… (죽은 돌 판정)'
      : thinking
      ? 'AI(백)가 생각 중…'
      : `내 차례 (흑돌) · ${moves + 1}수째`

  const busy = thinking || status === 'scoring'
  const gameOver = status === 'won' || status === 'lost'

  return (
    <GamePage gameId="baduk" title="바둑">
      <div className="baduk">
        <div className="baduk__bar">
          <span className={'baduk__status' + (gameOver ? ' done' : '') + (busy ? ' busy' : '')}>
            {statusText}
          </span>
        </div>

        <div className="baduk__meta">
          <span className="baduk__cap">흑 따냄 {state.capB}</span>
          <span className="baduk__cap">백 따냄 {state.capW}</span>
          <span className="baduk__cap">덤 {KOMI}</span>
        </div>

        <div className="baduk__diff">
          <span className="baduk__diff-label">난이도</span>
          <div className="baduk__diff-seg">
            {DIFFS.map((d) => (
              <button
                key={d.key}
                className={'baduk__diff-btn' + (diff === d.key ? ' on' : '')}
                onClick={() => setDiff(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="baduk__board-wrap">
          <canvas
            ref={canvasRef}
            className="baduk__canvas"
            onClick={onClick}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setHover(null)}
          />
          {gameOver &&
            result &&
            (showCard ? (
              <div className="baduk__over" onClick={() => setShowCard(false)}>
                <div className="baduk__over-card" onClick={(e) => e.stopPropagation()}>
                  <h3>{status === 'won' ? '승리!' : resigned ? '기권패' : '패배'}</h3>
                  <p className="baduk__over-score">
                    흑 {result.black}집 · 백 {result.white.toFixed(1)}집
                  </p>
                  <p className="baduk__over-margin">
                    {result.dead.length > 0 ? `사석 ${result.dead.length}개 자동 판정 · ` : ''}
                    {result.winner === BLACK ? '흑' : '백'} {result.margin.toFixed(1)}집 승
                  </p>
                  <p className="baduk__over-pts">+{gained}점</p>
                  <div className="baduk__over-btns">
                    <button className="baduk__btn baduk__btn--primary" onClick={reset}>
                      다시하기
                    </button>
                    <button className="baduk__btn" onClick={() => setShowCard(false)}>
                      계가 보기
                    </button>
                    <button className="baduk__btn" onClick={() => navigate('/')}>
                      게임 목록
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="baduk__over-chip" onClick={() => setShowCard(true)}>
                결과 보기
              </button>
            ))}
        </div>

        <div className="baduk__actions">
          <button className="baduk__btn" onClick={humanPass} disabled={status !== 'playing' || busy}>
            패스
          </button>
          <button
            className="baduk__btn"
            onClick={undo}
            disabled={status !== 'playing' || busy || hist.length === 0}
          >
            무르기
          </button>
          <button className="baduk__btn" onClick={resign} disabled={status !== 'playing' || busy}>
            기권
          </button>
          <button className="baduk__btn" onClick={reset}>
            새 게임
          </button>
        </div>
        <p className="baduk__hint">
          교차점을 눌러 흑돌을 놓으세요. 두 번 연속 패스하면 죽은 돌을 자동 판정해 계가합니다. 한국식 계가(집 +
          사석) · 백 덤 {KOMI}집 · 승리 시 집 승 차이만큼 점수를 얻습니다.
        </p>
      </div>
    </GamePage>
  )
}
