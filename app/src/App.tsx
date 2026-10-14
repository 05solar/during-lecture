// App 컴포넌트
// 애플리케이션 루트. 라우트에 따라 페이지를 전환한다. (상단 네비게이션 바 없음)
// 라우트: "/" → 메인(Home), "/game/:id" → 각 미니게임, 그 외 → 메인으로.

import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Game2048 from './pages/Game2048/Game2048'
import WatermelonGame from './pages/WatermelonGame/WatermelonGame'
import WordleGame from './pages/WordleGame/WordleGame'
import BlackjackGame from './pages/BlackjackGame/BlackjackGame'
import MineGame from './pages/MineGame/MineGame'
import OmokGame from './pages/OmokGame/OmokGame'
import GoGame from './pages/GoGame/GoGame'
import BurgerGame from './pages/BurgerGame/BurgerGame'
import WhackGame from './pages/WhackGame/WhackGame'
import TsumegoGame from './pages/TsumegoGame/TsumegoGame'
import GamePlaceholder from './pages/GamePlaceholder/GamePlaceholder'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/2048" element={<Game2048 />} />
          <Route path="/game/watermelon" element={<WatermelonGame />} />
          <Route path="/game/wordle" element={<WordleGame />} />
          <Route path="/game/blackjack" element={<BlackjackGame />} />
          <Route path="/game/mine" element={<MineGame />} />
          <Route path="/game/omok" element={<OmokGame />} />
          <Route path="/game/baduk" element={<GoGame />} />
          <Route path="/game/burger" element={<BurgerGame />} />
          <Route path="/game/whack" element={<WhackGame />} />
          <Route path="/game/tsumego" element={<TsumegoGame />} />
          <Route path="/game/:id" element={<GamePlaceholder />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
