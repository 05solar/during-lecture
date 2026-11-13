// OddColorGame 페이지
// 다른 색 찾기. 격자에 같은 색 아이콘이 가득 차 있고, 그 중 하나만 미묘하게 다른 명도를 가진다.
// 제한시간 안에 그 타일을 찾아 탭하면 다음 레벨로(격자가 커지고 색 차이가 줄고 시간이 짧아짐),
// 놓치거나 틀리면 목숨을 잃는다. 목숨이 0이 되면 종료하고 점수를 scoreStore에 제출한다.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import maskIcon from '../../assets/game-covers/oddcolor.png'
import fillMask from '../../assets/game-covers/oddcolor-fill.png'
import './OddColorGame.css'

const START_LIVES = 3
const TICK_MS = 100

type ColorName = '빨강' | '주황' | '노랑' | '초록' | '파랑' | '보라'
const COLOR_ORDER: ColorName[] = ['빨강', '주황', '노랑', '초록', '파랑', '보라']
const COLOR_SWATCH: Record<ColorName, string> = {
  빨강: 'hsl(0, 72%, 55%)',
  주황: 'hsl(30, 78%, 55%)',
  노랑: 'hsl(55, 75%, 52%)',
  초록: 'hsl(130, 50%, 45%)',
  파랑: 'hsl(212, 62%, 55%)',
  보라: 'hsl(280, 48%, 55%)',
}

/** 색상환 각도를 사람이 쓰는 6색(빨주노초파보) 이름으로 분류한다 */
function hueToColorName(h: number): ColorName {
  const hh = ((h % 360) + 360) % 360
  if (hh < 15 || hh >= 345) return '빨강'
  if (hh < 45) return '주황'
  if (hh < 70) return '노랑'
  if (hh < 170) return '초록'
  if (hh < 255) return '파랑'
  return '보라'
}

type ColorStats = Record<ColorName, { correct: number; total: number }>
function emptyStats(): ColorStats {
  const stats = {} as ColorStats
  for (const name of COLOR_ORDER) stats[name] = { correct: 0, total: 0 }
  return stats
}

interface Round {
  size: number
  colors: string[]
  oddIndex: number
  timeLimit: number
  colorName: ColorName
}

type Status = 'ready' | 'playing' | 'over'
type Feedback = { idx: number | null; correct: boolean } | null

function gridSizeForLevel(level: number): number {
  if (level <= 2) return 3
  if (level <= 5) return 4
  return 5
}

function diffForLevel(level: number): number {
  return Math.max(7, 30 - (level - 1) * 2)
}

function timeLimitForLevel(level: number): number {
  return Math.max(2200, 6000 - (level - 1) * 220)
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

function makeRound(level: number): Round {
  const size = gridSizeForLevel(level)
  const total = size * size
  const oddIndex = Math.floor(Math.random() * total)
  const h = Math.random() * 360
  const s = 55 + Math.random() * 20
  const l = 42 + Math.random() * 18
  const dir = Math.random() < 0.5 ? 1 : -1
  const oddL = Math.min(88, Math.max(12, l + dir * diffForLevel(level)))
  const base = hsl(h, s, l)
  const odd = hsl(h, s, oddL)
  const colors = Array.from({ length: total }, () => base)
  colors[oddIndex] = odd
  return { size, colors, oddIndex, timeLimit: timeLimitForLevel(level), colorName: hueToColorName(h) }
}

export default function OddColorGame() {
  const navigate = useNavigate()
  const [round, setRound] = useState<Round | null>(null)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(START_LIVES)
  const [timeLeft, setTimeLeft] = useState(0)
  const [status, setStatus] = useState<Status>('ready')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [revealIdx, setRevealIdx] = useState<number | null>(null)
  const [finalStats, setFinalStats] = useState<ColorStats>(emptyStats)

  const roundRef = useRef<Round | null>(null)
  const statsRef = useRef<ColorStats>(emptyStats())
  const levelRef = useRef(1)
  const scoreRef = useRef(0)
  const livesRef = useRef(START_LIVES)
  const timeLeftRef = useRef(0)
  const statusRef = useRef<Status>('ready')
  const lockedRef = useRef(false)
  const tickTimer = useRef<number | undefined>(undefined)
  const transitionTimer = useRef<number | undefined>(undefined)

  const clearTimers = useCallback(() => {
    clearInterval(tickTimer.current)
    clearTimeout(transitionTimer.current)
  }, [])

  const gameOver = useCallback(() => {
    clearTimers()
    statusRef.current = 'over'
    setStatus('over')
    setFinalStats({ ...statsRef.current })
    submitScore('oddcolor', scoreRef.current)
  }, [clearTimers])

  const newRound = useCallback((lvl: number) => {
    const r = makeRound(lvl)
    roundRef.current = r
    setRound(r)
    timeLeftRef.current = r.timeLimit
    setTimeLeft(r.timeLimit)
    lockedRef.current = false
    setFeedback(null)
    setRevealIdx(null)

    clearInterval(tickTimer.current)
    tickTimer.current = window.setInterval(() => {
      timeLeftRef.current -= TICK_MS
      setTimeLeft(Math.max(0, timeLeftRef.current))
      if (timeLeftRef.current <= 0) {
        clearInterval(tickTimer.current)
        miss(null)
      }
    }, TICK_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const miss = useCallback(
    (idx: number | null) => {
      if (lockedRef.current || statusRef.current !== 'playing') return
      lockedRef.current = true
      clearInterval(tickTimer.current)
      livesRef.current -= 1
      setLives(livesRef.current)
      setFeedback({ idx, correct: false })
      const r = roundRef.current
      setRevealIdx(r ? r.oddIndex : null)
      if (r) statsRef.current[r.colorName].total += 1
      transitionTimer.current = window.setTimeout(() => {
        if (livesRef.current <= 0) {
          gameOver()
        } else if (statusRef.current === 'playing') {
          newRound(levelRef.current)
        }
      }, 650)
    },
    [gameOver, newRound]
  )

  const correct = useCallback(
    (idx: number) => {
      if (lockedRef.current || statusRef.current !== 'playing') return
      lockedRef.current = true
      clearInterval(tickTimer.current)
      const r = roundRef.current
      const frac = r ? timeLeftRef.current / r.timeLimit : 0
      const gained = 10 + levelRef.current * 3 + Math.round(frac * 10)
      scoreRef.current += gained
      setScore(scoreRef.current)
      if (r) {
        statsRef.current[r.colorName].total += 1
        statsRef.current[r.colorName].correct += 1
      }
      levelRef.current += 1
      setLevel(levelRef.current)
      setFeedback({ idx, correct: true })
      transitionTimer.current = window.setTimeout(() => {
        if (statusRef.current === 'playing') newRound(levelRef.current)
      }, 420)
    },
    [newRound]
  )

  const tapTile = (idx: number) => {
    if (statusRef.current !== 'playing' || lockedRef.current || !roundRef.current) return
    if (idx === roundRef.current.oddIndex) correct(idx)
    else miss(idx)
  }

  const start = useCallback(() => {
    clearTimers()
    levelRef.current = 1
    scoreRef.current = 0
    livesRef.current = START_LIVES
    statusRef.current = 'playing'
    statsRef.current = emptyStats()
    setLevel(1)
    setScore(0)
    setLives(START_LIVES)
    setFinalStats(emptyStats())
    setStatus('playing')
    newRound(1)
  }, [clearTimers, newRound])

  useEffect(() => clearTimers, [clearTimers])

  const pct = round ? Math.max(0, (timeLeft / round.timeLimit) * 100) : 0

  const colorEntries = COLOR_ORDER.map((name) => {
    const s = finalStats[name]
    const accuracy = s.total > 0 ? s.correct / s.total : null
    return { name, accuracy, total: s.total }
  })
  const tested = colorEntries.filter((e) => e.accuracy !== null)
  const best = tested.length ? tested.reduce((a, b) => (b.accuracy! > a.accuracy! ? b : a)) : null
  const worst = tested.length ? tested.reduce((a, b) => (b.accuracy! < a.accuracy! ? b : a)) : null

  return (
    <GamePage gameId="oddcolor" title="다른 색 찾기">
      <div className="oddcolor">
        <div className="oddcolor__hud">
          <div className="oddcolor__stat">
            <span className="oddcolor__stat-label">레벨</span>
            <span className="oddcolor__stat-value">{level}</span>
          </div>
          <div className="oddcolor__stat">
            <span className="oddcolor__stat-label">점수</span>
            <span className="oddcolor__stat-value">{score}</span>
          </div>
          <div className="oddcolor__lives" aria-label="남은 목숨">
            {Array.from({ length: START_LIVES }).map((_, i) => (
              <span key={i} className={'oddcolor__life' + (i < lives ? ' on' : '')} />
            ))}
          </div>
        </div>

        <div className="oddcolor__timebar">
          <div className="oddcolor__timebar-fill" style={{ width: `${pct}%` }} />
        </div>

        {round && (
          <div
            className="oddcolor__grid"
            style={{ gridTemplateColumns: `repeat(${round.size}, 1fr)` }}
          >
            {round.colors.map((c, i) => (
              <button
                key={i}
                className={
                  'oddcolor__tile' +
                  (feedback?.idx === i ? (feedback.correct ? ' is-correct' : ' is-wrong') : '') +
                  (revealIdx === i ? ' is-reveal' : '')
                }
                onClick={() => tapTile(i)}
                disabled={status !== 'playing' || lockedRef.current}
                aria-label="색 타일"
              >
                <span
                  className="oddcolor__fill"
                  style={{ backgroundColor: c, maskImage: `url(${fillMask})`, WebkitMaskImage: `url(${fillMask})` }}
                />
                <img className="oddcolor__icon" src={maskIcon} alt="" draggable={false} />
              </button>
            ))}
          </div>
        )}

        {status === 'ready' && (
          <div className="oddcolor__overlay">
            <div className="oddcolor__card">
              <h3>다른 색 찾기</h3>
              <p className="oddcolor__card-desc">
                모두 같은 색처럼 보이지만 하나만 미묘하게 달라요. 제한시간 안에 찾아 탭하세요.
                틀리거나 시간을 넘기면 목숨이 줄어들고, 맞히면 다음 레벨로 넘어갑니다.
              </p>
              <button className="oddcolor__btn oddcolor__btn--primary" onClick={start}>시작하기</button>
            </div>
          </div>
        )}

        {status === 'over' && (
          <div className="oddcolor__overlay">
            <div className="oddcolor__card">
              <h3>게임 종료</h3>
              <p className="oddcolor__card-score">{score}점</p>
              <p className="oddcolor__card-desc">레벨 {level}까지 도달했어요.</p>

              <div className="oddcolor__breakdown">
                <h4 className="oddcolor__breakdown-title">색깔별 정확도</h4>
                {colorEntries.map(({ name, accuracy, total }) => (
                  <div key={name} className="oddcolor__breakdown-row">
                    <span className="oddcolor__breakdown-dot" style={{ backgroundColor: COLOR_SWATCH[name] }} />
                    <span className="oddcolor__breakdown-name">{name}</span>
                    <div className="oddcolor__breakdown-bar">
                      <div
                        className="oddcolor__breakdown-bar-fill"
                        style={{ width: `${accuracy === null ? 0 : Math.round(accuracy * 100)}%` }}
                      />
                    </div>
                    <span className="oddcolor__breakdown-pct">
                      {accuracy === null ? '-' : `${Math.round(accuracy * 100)}%`}
                    </span>
                    {total > 0 && <span className="oddcolor__breakdown-n">({total})</span>}
                  </div>
                ))}
                {best && worst && best.name !== worst.name && (
                  <p className="oddcolor__breakdown-summary">
                    <b>{best.name}</b> 계열에 강하고, <b>{worst.name}</b> 계열에 약해요.
                  </p>
                )}
              </div>

              <div className="oddcolor__card-btns">
                <button className="oddcolor__btn oddcolor__btn--primary" onClick={start}>다시하기</button>
                <button className="oddcolor__btn" onClick={() => navigate('/')}>게임 목록</button>
              </div>
            </div>
          </div>
        )}

        <p className="oddcolor__hint">딱 하나만 색이 달라요. 레벨이 오를수록 더 미묘해집니다.</p>
      </div>
    </GamePage>
  )
}
