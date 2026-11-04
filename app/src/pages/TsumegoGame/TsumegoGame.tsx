// TsumegoGame page: real Go rules + an AND-OR life-and-death solver (tsumegoSolver.ts).
// Every opponent reply — whether the player is right or wrong — is computed on the spot
// from the actual board, not looked up from a scripted line.
import { useEffect, useRef, useState } from 'react'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import { N, PASS, emptyState, play, toIdx, type Color, type GoState } from '../GoGame/go'
import { isSettled, solve } from './tsumegoSolver'
import { TSUMEGO_PROBLEMS, type Point } from './tsumegoData'

const PAD = 28, STEP = 40, SIZE = PAD * 2 + STEP * (N - 1)
const other = (color: Color): Color => (color === 1 ? 2 : 1)
const pointIndex = ([r, c]: Point) => toIdx(r, c)

function initial(problemIndex: number): GoState {
  const s = emptyState()
  const p = TSUMEGO_PROBLEMS[problemIndex]
  p.black.forEach((x) => (s.board[pointIndex(x)] = 1))
  p.white.forEach((x) => (s.board[pointIndex(x)] = 2))
  return s
}

const GOAL_LABEL = { kill: '흑 차례 · 백을 잡아라', live: '흑 차례 · 흑을 살려라' } as const

export default function TsumegoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [problemIndex, setProblemIndex] = useState(0)
  const [state, setState] = useState<GoState>(() => initial(0))
  const [mode, setMode] = useState<'solve' | 'refuted' | 'analysis'>('solve')
  const [analysisColor, setAnalysisColor] = useState<Color>(1)
  const [lastMove, setLastMove] = useState<number | null>(null)
  const [message, setMessage] = useState('흑 차례입니다. 궁도 안쪽의 급소를 찾아 실제로 착수해 보세요.')
  const [mistakes, setMistakes] = useState(0)

  const problem = TSUMEGO_PROBLEMS[problemIndex]
  const regionIdx = problem.region.map(pointIndex)
  const defenderColor: Color = problem.goal === 'kill' ? 2 : 1
  const attackerColor: Color = other(defenderColor)
  const goalWantsSurvive = problem.goal === 'live'

  const reset = (next = problemIndex) => {
    setProblemIndex(next)
    setState(initial(next))
    setMode('solve')
    setAnalysisColor(1)
    setLastMove(null)
    setMistakes(0)
    setMessage('흑 차례입니다. 궁도 안쪽의 급소를 찾아 실제로 착수해 보세요.')
  }

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = devicePixelRatio || 1
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#dfb36f'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.strokeStyle = '#805326'
    ctx.lineWidth = 1
    for (let i = 0; i < N; i++) {
      const p = PAD + i * STEP
      ctx.beginPath()
      ctx.moveTo(PAD, p); ctx.lineTo(SIZE - PAD, p)
      ctx.moveTo(p, PAD); ctx.lineTo(p, SIZE - PAD)
      ctx.stroke()
    }
    ;[[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].forEach(([r, c]) => {
      ctx.fillStyle = '#5a3617'
      ctx.beginPath()
      ctx.arc(PAD + c * STEP, PAD + r * STEP, 3, 0, Math.PI * 2)
      ctx.fill()
    })
    if (mode !== 'analysis') {
      ctx.fillStyle = 'rgba(79, 70, 229, 0.10)'
      for (const idx of regionIdx) {
        if (state.board[idx]) continue
        const x = PAD + (idx % N) * STEP, y = PAD + Math.floor(idx / N) * STEP
        ctx.beginPath()
        ctx.arc(x, y, STEP * 0.42, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (let i = 0; i < state.board.length; i++) {
      if (!state.board[i]) continue
      const x = PAD + (i % N) * STEP, y = PAD + Math.floor(i / N) * STEP, rad = 17
      const g = ctx.createRadialGradient(x - rad * 0.28, y - rad * 0.3, 1, x, y, rad)
      if (state.board[i] === 1) { g.addColorStop(0, '#555'); g.addColorStop(1, '#111') }
      else { g.addColorStop(0, '#fff'); g.addColorStop(1, '#d1d1d1') }
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
      if (state.board[i] === 2) { ctx.strokeStyle = '#aaa'; ctx.stroke() }
    }
    if (lastMove !== null && state.board[lastMove]) {
      const x = PAD + (lastMove % N) * STEP, y = PAD + Math.floor(lastMove / N) * STEP
      ctx.strokeStyle = state.board[lastMove] === 1 ? '#f9d75e' : '#c13530'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [state, lastMove, mode, regionIdx])

  const place = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const c = Math.round(((event.clientX - rect.left) * SIZE / rect.width - PAD) / STEP)
    const r = Math.round(((event.clientY - rect.top) * SIZE / rect.height - PAD) / STEP)
    if (r < 0 || r >= N || c < 0 || c >= N) return
    const move = toIdx(r, c)

    if (mode === 'analysis') {
      const played = play({ ...state, toMove: analysisColor }, move)
      if (!played) { setMessage('그곳에는 둘 수 없습니다. 패·자충·이미 놓인 자리를 확인하세요.'); return }
      setState(played.state)
      setLastMove(move)
      setAnalysisColor(other(analysisColor))
      setMessage(`${analysisColor === 1 ? '흑' : '백'} 착수. 분석 모드에서는 두 색 모두 직접 둘 수 있습니다.`)
      return
    }

    if (!regionIdx.includes(move)) {
      setMessage('이 사활 문제와 무관한 자리입니다. 궁도(음영) 안쪽을 두세요.')
      return
    }
    const played = play({ ...state, toMove: 1 }, move)
    if (!played) { setMessage('그곳에는 둘 수 없습니다. 자충·이미 놓인 자리를 확인하세요.'); return }

    const result = solve(played.state, defenderColor, attackerColor, regionIdx)
    const correct = result.survives === goalWantsSurvive

    if (correct) {
      if (isSettled(played.state, defenderColor, attackerColor, regionIdx, goalWantsSurvive)) {
        setState(played.state)
        setLastMove(move)
        finish()
        return
      }
      const whiteMove = result.move
      const whitePlayed = play(played.state, whiteMove)
      const afterWhite = whitePlayed ? whitePlayed.state : played.state
      const whiteIdx = whiteMove === PASS ? null : whiteMove
      if (isSettled(afterWhite, defenderColor, attackerColor, regionIdx, goalWantsSurvive)) {
        setState(afterWhite)
        setLastMove(whiteIdx)
        finish()
        return
      }
      setState(afterWhite)
      setLastMove(whiteIdx)
      setMode('solve')
      setMessage('정확한 수입니다. 백의 최선 응수를 받았습니다. 다음 수를 두세요.')
    } else {
      const whiteMove = result.move
      const whitePlayed = play(played.state, whiteMove)
      const afterWhite = whitePlayed ? whitePlayed.state : played.state
      setState(afterWhite)
      setLastMove(whiteMove === PASS ? null : whiteMove)
      setMode('refuted')
      setMistakes((x) => x + 1)
      setMessage(
        problem.goal === 'kill'
          ? '그 수로는 백이 삽니다. 백이 실제로 사는 수를 두어 보여줬습니다. 계속 읽거나 처음부터 다시 보세요.'
          : '그 수로는 흑이 죽습니다. 백이 실제로 잡는 수를 두어 보여줬습니다. 계속 읽거나 처음부터 다시 보세요.'
      )
    }

    function finish() {
      setMode('analysis')
      setAnalysisColor(1)
      const score = Math.max(80, 240 - mistakes * 35)
      submitScore('tsumego', score)
      setMessage(`정답입니다. ${score}점을 기록했고 자유 분석 모드로 전환했습니다. 흑·백 모두 계속 착수할 수 있습니다.`)
    }
  }

  const jump = (value: number) => {
    if (Number.isInteger(value) && value >= 1 && value <= TSUMEGO_PROBLEMS.length) reset(value - 1)
  }
  const stage = mode === 'analysis' ? '자유 분석' : mode === 'refuted' ? '반박 수순' : '풀이 중'

  return (
    <GamePage gameId="tsumego" title="사활 훈련" scoreUnit="최고 점수">
      <div className="tsumego">
        <div className="tsumego__head">
          <div>
            <span className="tsumego__count">
              문제 {problem.number} / {TSUMEGO_PROBLEMS.length} · {problem.difficulty} · {stage}
            </span>
            <h2>{problem.title}</h2>
          </div>
          <span className="tsumego__goal">{GOAL_LABEL[problem.goal]}</span>
        </div>
        <div className="tsumego__picker">
          <button onClick={() => reset((problemIndex - 1 + TSUMEGO_PROBLEMS.length) % TSUMEGO_PROBLEMS.length)}>이전</button>
          <label>
            문제 번호{' '}
            <input
              aria-label="문제 번호"
              type="number"
              min="1"
              max={TSUMEGO_PROBLEMS.length}
              value={problemIndex + 1}
              onChange={(e) => jump(Number(e.target.value))}
            />
          </label>
          <button onClick={() => reset((problemIndex + 1) % TSUMEGO_PROBLEMS.length)}>다음</button>
        </div>
        <canvas ref={canvasRef} className="tsumego__board" onClick={place} aria-label="사활 문제 바둑판" />
        <p className={'tsumego__message ' + mode}>{message}</p>
        {mode === 'analysis' && (
          <div className="tsumego__color">
            <span>분석 착수 색</span>
            <button className={analysisColor === 1 ? 'on' : ''} onClick={() => setAnalysisColor(1)}>흑</button>
            <button className={analysisColor === 2 ? 'on' : ''} onClick={() => setAnalysisColor(2)}>백</button>
          </div>
        )}
        <div className="tsumego__actions">
          <button onClick={() => reset()}>처음부터</button>
          <button className="tsumego__primary" onClick={() => reset((problemIndex + 1) % TSUMEGO_PROBLEMS.length)}>다음 문제</button>
        </div>
        <div className="tsumego__footer">
          <span>오답 {mistakes}회</span>
          <span>{problem.source}</span>
        </div>
      </div>
    </GamePage>
  )
}
