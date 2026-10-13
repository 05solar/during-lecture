// GamePage 컴포넌트
// 모든 미니게임 화면이 공유하는 공통 크롬(틀). 상단에 "목록으로" 뒤로가기 링크,
// 게임 제목, 그리고 이 게임의 최고 점수 칩을 둔다. 실제 게임 콘텐츠는 children으로 받는다.
// 최고 점수는 scoreStore를 구독해 점수가 갱신되면 즉시 반영된다.

import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getBestScore, subscribe } from '../../lib/scoreStore'
import './GamePage.css'

interface GamePageProps {
  gameId: string
  title: string
  /** 점수 단위 설명 (예: "최고 점수") */
  scoreUnit?: string
  children: ReactNode
}

export default function GamePage({ gameId, title, scoreUnit = '최고 점수', children }: GamePageProps) {
  const [best, setBest] = useState<number>(() => getBestScore(gameId))

  useEffect(() => {
    const update = () => setBest(getBestScore(gameId))
    update()
    return subscribe(update)
  }, [gameId])

  return (
    <div className="game-page">
      <div className="game-page__bar">
        <Link to="/" className="game-page__back">← 목록으로</Link>
        <h1 className="game-page__title">{title}</h1>
        <div className="game-page__best">
          <span className="game-page__best-label">{scoreUnit}</span>
          <span className="game-page__best-value">{best.toLocaleString('ko-KR')}</span>
        </div>
      </div>
      <div className="game-page__body">{children}</div>
    </div>
  )
}
