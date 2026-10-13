// WhackGame 페이지
// 두더지 잡기(Whack-a-Mole). 3x3 구멍에서 두더지가 무작위로 튀어나오면 제한시간(30초) 안에
// 클릭해 점수를 쌓는다. 시간이 지날수록 두더지가 더 빨리 숨는다.
// 게임 종료 시 잡은 수를 scoreStore에 제출(최고 점수 유지)한다.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import moleImage from './assets/mole.webp'
import './WhackGame.css'

const HOLES = 9
const DURATION = 30 // 초

type Status = 'ready' | 'playing' | 'over'

export default function WhackGame() {
  const navigate = useNavigate()
  const [active, setActive] = useState(-1) // 두더지가 나온 구멍 index (-1=없음)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [status, setStatus] = useState<Status>('ready')
  const [hit, setHit] = useState(-1) // 방금 맞힌 구멍(애니메이션용)

  const activeRef = useRef(-1)
  const scoreRef = useRef(0)
  const timeRef = useRef(DURATION)
  const statusRef = useRef<Status>('ready')
  const moleTimer = useRef<number | undefined>(undefined)
  const gapTimer = useRef<number | undefined>(undefined)
  const tick = useRef<number | undefined>(undefined)

  const clearTimers = useCallback(() => {
    clearTimeout(moleTimer.current)
    clearTimeout(gapTimer.current)
    clearInterval(tick.current)
  }, [])

  const end = useCallback(() => {
    clearTimers()
    statusRef.current = 'over'
    setStatus('over')
    setActive(-1)
    activeRef.current = -1
    submitScore('whack', scoreRef.current)
  }, [clearTimers])

  const popLoop = useCallback(() => {
    if (statusRef.current !== 'playing') return
    let idx = Math.floor(Math.random() * HOLES)
    if (idx === activeRef.current) idx = (idx + 1) % HOLES
    activeRef.current = idx
    setActive(idx)
    const elapsed = DURATION - timeRef.current
    const visible = Math.max(480, 950 - elapsed * 16) // 두더지가 보이는 시간(점점 짧아짐)
    moleTimer.current = window.setTimeout(() => {
      if (activeRef.current === idx) {
        activeRef.current = -1
        setActive(-1)
      }
      gapTimer.current = window.setTimeout(popLoop, 170)
    }, visible)
  }, [])

  const start = useCallback(() => {
    clearTimers()
    scoreRef.current = 0
    timeRef.current = DURATION
    activeRef.current = -1
    statusRef.current = 'playing'
    setScore(0)
    setTimeLeft(DURATION)
    setActive(-1)
    setHit(-1)
    setStatus('playing')
    tick.current = window.setInterval(() => {
      timeRef.current -= 1
      setTimeLeft(timeRef.current)
      if (timeRef.current <= 0) end()
    }, 1000)
    popLoop()
  }, [clearTimers, end, popLoop])

  const whack = (i: number) => {
    if (statusRef.current !== 'playing' || i !== activeRef.current) return
    scoreRef.current += 1
    setScore(scoreRef.current)
    activeRef.current = -1
    setActive(-1)
    setHit(i)
    window.setTimeout(() => setHit((h) => (h === i ? -1 : h)), 220)
    clearTimeout(moleTimer.current)
    clearTimeout(gapTimer.current)
    gapTimer.current = window.setTimeout(popLoop, 120)
  }

  useEffect(() => clearTimers, [clearTimers])

  return (
    <GamePage gameId="whack" title="두더지 잡기">
      <div className="whack">
        <div className="whack__hud">
          <div className="whack__stat">
            <span className="whack__stat-label">점수</span>
            <span className="whack__stat-value">{score}</span>
          </div>
          <div className="whack__stat whack__stat--time">
            <span className="whack__stat-label">남은 시간</span>
            <span className="whack__stat-value">{timeLeft}s</span>
          </div>
        </div>

        <div className="whack__timebar">
          <div className="whack__timebar-fill" style={{ width: `${(timeLeft / DURATION) * 100}%` }} />
        </div>

        <div className="whack__grid">
          {Array.from({ length: HOLES }).map((_, i) => (
            <button
              key={i}
              className={'whack__hole' + (active === i ? ' up' : '') + (hit === i ? ' hit' : '')}
              onClick={() => whack(i)}
              aria-label={active === i ? '두더지' : '구멍'}
              disabled={status !== 'playing'}
            >
              <span className="whack__dirt" />
              <span className="whack__mole">
                <img src={moleImage} alt="" draggable={false} />
              </span>
            </button>
          ))}
        </div>

        {status === 'ready' && (
          <div className="whack__overlay">
            <div className="whack__card">
              <h3>두더지 잡기</h3>
              <p className="whack__card-desc">{DURATION}초 동안 튀어나오는 두더지를 최대한 많이 클릭하세요.</p>
              <button className="whack__btn whack__btn--primary" onClick={start}>시작하기</button>
            </div>
          </div>
        )}

        {status === 'over' && (
          <div className="whack__overlay">
            <div className="whack__card">
              <h3>시간 종료</h3>
              <p className="whack__card-score">{score}마리</p>
              <div className="whack__card-btns">
                <button className="whack__btn whack__btn--primary" onClick={start}>다시하기</button>
                <button className="whack__btn" onClick={() => navigate('/')}>게임 목록</button>
              </div>
            </div>
          </div>
        )}

        <p className="whack__hint">구멍에서 올라온 두더지를 빠르게 클릭! 시간이 지날수록 더 빨라집니다.</p>
      </div>
    </GamePage>
  )
}
