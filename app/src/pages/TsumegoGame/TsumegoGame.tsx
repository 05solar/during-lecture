// TsumegoGame page: a compact life-and-death practice game using the project's canvas Go board.
import { useEffect, useRef, useState } from 'react'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import './TsumegoGame.css'

const N = 9
const PAD = 28
const STEP = 40
const SIZE = PAD * 2 + STEP * (N - 1)
type Stone = 0 | 1 | 2
type Point = [number, number]

interface Problem {
  title: string
  goal: string
  note: string
  black: Point[]
  white: Point[]
  line: Point[]
  replies: Point[]
  source: string
}

// Beginner-friendly local shapes adapted from classic public-domain tsumego motifs.
const PROBLEMS: Problem[] = [
  { title: '모서리의 급소', goal: '흑 차례 · 백을 잡아라', note: '한 칸을 조여서 백의 눈을 없애세요.', black: [[0,1],[1,0],[2,0],[3,1],[3,2]], white: [[1,1],[1,2],[2,1],[2,2]], line: [[2,3],[1,3]], replies: [[0,3]], source: '고전 사활 형태 · Gokyo Shumyo' },
  { title: '두 눈 만들기', goal: '흑 차례 · 흑을 살려라', note: '상대가 막기 전에 두 집을 확보하세요.', black: [[2,1],[2,2],[3,1],[3,2]], white: [[1,1],[1,2],[2,0],[3,0],[4,1],[4,2]], line: [[2,3],[3,3]], replies: [[1,3]], source: '고전 사활 형태 · Xuanxuan Qijing' },
  { title: '1선의 침입', goal: '흑 차례 · 백을 잡아라', note: '가장 좁은 길목이 어디인지 읽어보세요.', black: [[4,0],[5,0],[6,1],[6,2]], white: [[4,1],[4,2],[5,1],[5,2]], line: [[5,3],[4,3]], replies: [[3,3]], source: '고전 사활 형태 · Gokyo Shumyo' },
  { title: '직선 네 점', goal: '흑 차례 · 흑을 살려라', note: '상대의 한 수를 예상해 급소를 선점하세요.', black: [[2,5],[3,5],[4,5],[5,5]], white: [[1,5],[2,4],[3,4],[4,4],[5,4],[6,5]], line: [[3,6],[5,6]], replies: [[4,6]], source: '고전 사활 형태 · Hatsuyoron' },
]

const idx = (r: number, c: number) => r * N + c

export default function TsumegoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [problemIndex, setProblemIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [moves, setMoves] = useState<{point: Point, stone: Stone}[]>([])
  const [message, setMessage] = useState('급소를 찾아 첫 수를 두세요.')
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)
  const problem = PROBLEMS[problemIndex]

  const reset = (next = problemIndex) => {
    setProblemIndex(next)
    setStep(0)
    setMoves([])
    setMessage('급소를 찾아 첫 수를 두세요.')
    setMistakes(0)
    setDone(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
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
      ctx.beginPath(); ctx.moveTo(PAD, p); ctx.lineTo(SIZE - PAD, p); ctx.moveTo(p, PAD); ctx.lineTo(p, SIZE - PAD); ctx.stroke()
    }
    ;[[2,2],[2,6],[6,2],[6,6],[4,4]].forEach(([r,c]) => { ctx.fillStyle='#5a3617'; ctx.beginPath(); ctx.arc(PAD+c*STEP, PAD+r*STEP, 3, 0, Math.PI*2); ctx.fill() })
    const board = new Int8Array(N * N)
    problem.black.forEach(([r,c]) => board[idx(r,c)] = 1)
    problem.white.forEach(([r,c]) => board[idx(r,c)] = 2)
    moves.forEach(({point:[r,c], stone}) => board[idx(r,c)] = stone)
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) continue
      const x = PAD + (i % N) * STEP, y = PAD + Math.floor(i / N) * STEP
      const rad = 17
      const g = ctx.createRadialGradient(x-rad*.28,y-rad*.3,1,x,y,rad)
      if (board[i] === 1) { g.addColorStop(0,'#555'); g.addColorStop(1,'#111') } else { g.addColorStop(0,'#fff'); g.addColorStop(1,'#d1d1d1') }
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill()
      if (board[i] === 2) { ctx.strokeStyle='#aaa'; ctx.stroke() }
    }
    const last = moves[moves.length-1]
    if (last) { const [r,c]=last.point; ctx.strokeStyle=last.stone===1?'#f9d75e':'#c13530'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(PAD+c*STEP,PAD+r*STEP,6,0,Math.PI*2); ctx.stroke() }
  }, [problem, moves])

  const clickBoard = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (done) return
    const rect = event.currentTarget.getBoundingClientRect()
    const c = Math.round(((event.clientX - rect.left) * SIZE / rect.width - PAD) / STEP)
    const r = Math.round(((event.clientY - rect.top) * SIZE / rect.height - PAD) / STEP)
    if (r < 0 || r >= N || c < 0 || c >= N) return
    const target = problem.line[step]
    if (target[0] !== r || target[1] !== c) {
      setMistakes((value) => value + 1)
      setMessage('아쉬워요. 이 모양의 급소를 다시 읽어보세요.')
      return
    }
    const nextMoves = [...moves, { point: target, stone: 1 as Stone }]
    const reply = problem.replies[step]
    if (reply) nextMoves.push({ point: reply, stone: 2 as Stone })
    setMoves(nextMoves)
    if (step === problem.line.length - 1) {
      setDone(true)
      const score = Math.max(40, 120 - mistakes * 20)
      submitScore('tsumego', score)
      setMessage(`정답! ${score}점 · ${problem.note}`)
    } else {
      setStep(step + 1)
      setMessage('백의 응수를 받았습니다. 다음 수를 이어가세요.')
    }
  }

  return <GamePage gameId="tsumego" title="사활 훈련" scoreUnit="최고 점수">
    <div className="tsumego">
      <div className="tsumego__head"><div><span className="tsumego__count">문제 {problemIndex + 1} / {PROBLEMS.length}</span><h2>{problem.title}</h2></div><span className="tsumego__goal">{problem.goal}</span></div>
      <canvas ref={canvasRef} className="tsumego__board" onClick={clickBoard} aria-label="사활 문제 바둑판" />
      <p className={'tsumego__message' + (done ? ' success' : '')}>{message}</p>
      <div className="tsumego__actions"><button onClick={() => reset()}>처음부터</button><button className="tsumego__primary" onClick={() => reset((problemIndex + 1) % PROBLEMS.length)}>{done ? '다음 문제' : '문제 바꾸기'}</button></div>
      <div className="tsumego__footer"><span>실수 {mistakes}회</span><span>{problem.source}에서 모티프를 가져와 게임용으로 재구성</span></div>
    </div>
  </GamePage>
}
