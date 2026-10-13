// MineGame 페이지
// 돌깨기 클리커 게임. 돌을 터치할 때마다 점수를 캐고, 정산하면 이번 세션 누적 점수에 합산된다.
// 정산할 때마다 세션 누적 점수를 scoreStore에 제출(최고 점수 유지)한다.
// (원본: Gangneung 프로젝트 → During-Lecture 테마/점수 시스템에 맞게 이식)

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GamePage from '../../components/GamePage/GamePage'
import { submitScore } from '../../lib/scoreStore'
import { ROCK_IMGS, PICK_IMG } from './mineArt'
import './MineGame.css'

const PER_HIT = 10 // 한 번 캘 때마다 획득 점수
const HITS_PER_ROCK = 4 // 돌 하나를 깨는 데 필요한 타격 수

export default function MineGame() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(0) // 정산 전 캔 점수
  const [banked, setBanked] = useState(0) // 이번 세션 정산 누적
  const [hits, setHits] = useState(0) // 현재 돌 타격 수
  const [swing, setSwing] = useState(false)
  const [shake, setShake] = useState(false)
  const [saved, setSaved] = useState(false)
  const swingTimer = useRef<number | undefined>(undefined)
  const shakeTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      clearTimeout(swingTimer.current)
      clearTimeout(shakeTimer.current)
    },
    []
  )

  const dig = () => {
    setPending((p) => p + PER_HIT)
    setHits((h) => (h + 1) % HITS_PER_ROCK)
    setSaved(false)
    setSwing(false)
    setShake(false)
    requestAnimationFrame(() => {
      setSwing(true)
      setShake(true)
    })
    clearTimeout(swingTimer.current)
    clearTimeout(shakeTimer.current)
    swingTimer.current = window.setTimeout(() => setSwing(false), 260)
    shakeTimer.current = window.setTimeout(() => setShake(false), 260)
  }

  const cashOut = () => {
    if (pending <= 0) return
    const total = banked + pending
    setBanked(total)
    submitScore('mine', total)
    setPending(0)
    setHits(0)
    setSaved(true)
  }

  const rockStage = ROCK_IMGS[hits]

  return (
    <GamePage gameId="mine" title="돌깨기">
      <div className="mine">
        <div className="mine__scores">
          <div className="mine__score">
            <span className="mine__score-label">캔 점수</span>
            <span className="mine__score-value">{pending}</span>
          </div>
          <div className="mine__score">
            <span className="mine__score-label">이번 세션</span>
            <span className="mine__score-value">{banked}</span>
          </div>
        </div>

        <p className="mine__desc">돌을 터치할 때마다 <b>+{PER_HIT}점</b>. 정산하면 이번 세션 점수에 합산됩니다.</p>

        <button className="mine__stage" onClick={dig} aria-label="돌 캐기">
          <img className={'mine__rock' + (shake ? ' shake' : '')} src={rockStage} alt="돌" draggable={false} />
          <img className={'mine__pick' + (swing ? ' swing' : '')} src={PICK_IMG} alt="곡괭이" draggable={false} />
          <span className="mine__tap">터치</span>
        </button>

        <div className="mine__actions">
          <button className="mine__btn mine__btn--primary" onClick={cashOut} disabled={pending <= 0}>
            정산하기 (+{pending}점)
          </button>
          <button className="mine__btn" onClick={() => navigate('/')}>
            게임 목록
          </button>
        </div>

        {saved && <p className="mine__saved">정산 완료. 이번 세션 점수에 반영되었습니다.</p>}
      </div>
    </GamePage>
  )
}
