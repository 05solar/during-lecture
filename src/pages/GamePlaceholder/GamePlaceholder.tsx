// GamePlaceholder 페이지
// /game/:id 라우트의 임시 페이지. 실제 미니게임이 구현되기 전까지 안내를 보여준다.
// 각 게임이 완성되면 이 자리에 해당 게임 컴포넌트를 연결한다.

import { Link, useParams } from 'react-router-dom'
import { getGameById } from '../../data/games'
import './GamePlaceholder.css'

export default function GamePlaceholder() {
  const { id } = useParams<{ id: string }>()
  const game = id ? getGameById(id) : undefined

  return (
    <div className="game-page">
      <Link to="/" className="game-page__back">← 목록으로</Link>
      {game ? (
        <>
          <h1 className="game-page__title">{game.title}</h1>
          <p className="game-page__tagline">{game.tagline}</p>
          <div className="game-page__notice">
            <p className="game-page__notice-title">아직 준비 중인 게임입니다.</p>
            <p className="game-page__notice-desc">
              점수 단위: {game.scoreUnit}. 게임이 완성되면 이 화면에서 바로 플레이할 수 있습니다.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="game-page__title">게임을 찾을 수 없습니다.</h1>
          <p className="game-page__tagline">잘못된 주소이거나 삭제된 게임입니다.</p>
        </>
      )}
    </div>
  )
}
