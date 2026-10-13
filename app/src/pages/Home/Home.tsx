// Home 페이지
// 사이트의 메인 페이지. 상단 네비게이션 바 없이, 히어로 스포트라이트 + 장르 필터 칩 +
// 게임 그리드로 구성된다. (Lumina Arcade 레퍼런스 스타일 / 리더보드·토너먼트 위젯 없음)
// 각 게임 카드를 클릭하면 해당 게임 페이지로 이동하며, 카드에 게임별 최고 점수가 표시된다.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GameGrid from '../../components/GameGrid/GameGrid'
import { GAMES, CATEGORIES, getGameById, DIFFICULTY_LABEL, CATEGORY_LABEL, type Category } from '../../data/games'
import { GAME_COVERS } from '../../data/covers'
import { getBestScore, subscribe } from '../../lib/scoreStore'
import './Home.css'

const SPOTLIGHT_ID = 'burger'

export default function Home() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [spotBest, setSpotBest] = useState<number>(() => getBestScore(SPOTLIGHT_ID))

  useEffect(() => {
    const update = () => setSpotBest(getBestScore(SPOTLIGHT_ID))
    update()
    return subscribe(update)
  }, [])

  const spot = getGameById(SPOTLIGHT_ID)!
  const count = category === 'all' ? GAMES.length : GAMES.filter((g) => g.category === category).length

  const scrollToCollection = () => {
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home">
      {/* 히어로 스포트라이트 */}
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__main">
          <span className="hero__eyebrow">TODAY'S SPOTLIGHT</span>
          <h1 className="hero__title">{spot.title}</h1>
          <p className="hero__desc">
            무설치 웹 브라우저에서 대기 시간 없이 바로 즐기는 미니게임 모음. 모든 게임은
            플레이할 때마다 최고 점수가 기록됩니다. 오늘은 <b>{spot.title}</b>부터 시작해 보세요.
          </p>
          <div className="hero__actions">
            <button className="hero__btn hero__btn--primary" onClick={() => navigate(`/game/${spot.id}`)}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M4 3l9 5-9 5z" />
              </svg>
              즉시 플레이
            </button>
            <button className="hero__btn" onClick={scrollToCollection}>전체 게임 보기</button>
          </div>
          <div className="hero__meta">
            <span>장르 <b>{CATEGORY_LABEL[spot.category]}</b></span>
            <span className="hero__dot" />
            <span>난이도 <b>{DIFFICULTY_LABEL[spot.difficulty]}</b></span>
            <span className="hero__dot" />
            <span>내 최고 <b>{spotBest.toLocaleString('ko-KR')}</b></span>
          </div>
        </div>

        <div className="hero__preview" aria-hidden="true">
          <img className="hero__cover" src={GAME_COVERS[spot.id]} alt="" />
          <span className="hero__preview-tag">모바일 &amp; 데스크톱 지원</span>
        </div>
      </section>

      {/* 장르 필터 */}
      <section className="filters">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={'filters__chip' + (category === c.key ? ' on' : '')}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </section>

      {/* 게임 컬렉션 */}
      <section className="collection" id="collection">
        <div className="collection__head">
          <h2 className="collection__title">게임 컬렉션</h2>
          <span className="collection__count">총 {count}개</span>
        </div>
        <GameGrid category={category} />
      </section>

      <footer className="home__footer">
        <span className="home__footer-brand">미니게임 아케이드</span>
        <span className="home__footer-note">맑고 가벼운 개인용 웹 아케이드 · 점수는 이 브라우저에 저장됩니다</span>
      </footer>
    </div>
  )
}
