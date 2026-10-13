// GameGrid 컴포넌트
// 게임 카탈로그를 반응형 그리드로 배치한다. 선택된 장르(category)로 필터링하며,
// scoreStore를 구독해 각 카드에 최신 최고 점수를 전달한다.

import { useEffect, useState } from 'react'
import { GAMES, type Category } from '../../data/games'
import { getAllScores, subscribe } from '../../lib/scoreStore'
import GameCard from '../GameCard/GameCard'
import './GameGrid.css'

interface GameGridProps {
  category: Category | 'all'
}

export default function GameGrid({ category }: GameGridProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => getAllScores())

  useEffect(() => {
    const update = () => setScores(getAllScores())
    update()
    return subscribe(update)
  }, [])

  const games = category === 'all' ? GAMES : GAMES.filter((g) => g.category === category)

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} bestScore={scores[game.id] ?? 0} />
      ))}
    </div>
  )
}
