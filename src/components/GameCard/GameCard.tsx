// GameCard 컴포넌트
// 메인 그리드의 미니게임 한 장. 상단 커버 이미지 + 장르/난이도 배지,
// 하단에 제목·설명·최고 점수·"플레이하기" 링크. 클릭하면 해당 게임(/game/:id)으로 이동한다.
// (Lumina Arcade 레퍼런스 스타일: 화이트 카드 + 소프트 섀도, 단일 인디고블루 포인트)

import { Link } from 'react-router-dom'
import type { GameMeta } from '../../data/games'
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from '../../data/games'
import { GAME_COVERS } from '../../data/covers'
import './GameCard.css'

interface GameCardProps {
  game: GameMeta
  bestScore: number
}

export default function GameCard({ game, bestScore }: GameCardProps) {
  return (
    <Link to={`/game/${game.id}`} className="game-card">
      <div className="game-card__thumb">
        <img className="game-card__cover" src={GAME_COVERS[game.id]} alt="" />
        <span className="game-card__cat">{CATEGORY_LABEL[game.category]}</span>
        <span className={'game-card__diff game-card__diff--' + game.difficulty}>
          난이도 {DIFFICULTY_LABEL[game.difficulty]}
        </span>
      </div>

      <div className="game-card__body">
        <div className="game-card__text">
          <h3 className="game-card__title">{game.title}</h3>
          <p className="game-card__tagline">{game.tagline}</p>
        </div>
        <div className="game-card__foot">
          <span className="game-card__best">
            <span className="game-card__best-label">최고</span>
            <span className="game-card__best-value">{bestScore.toLocaleString('ko-KR')}</span>
          </span>
          <span className="game-card__play">
            플레이하기
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8h9" />
              <path d="M8.5 4.5L12 8l-3.5 3.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
