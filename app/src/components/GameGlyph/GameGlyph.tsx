// GameGlyph 컴포넌트
// 각 미니게임을 나타내는 커스텀 SVG 글리프. 직접 그린 단색 선/면 도형만 사용하며
// 루시드 아이콘이나 기본 이모지를 쓰지 않는다. currentColor를 상속해 테마 색을 따른다.
// size로 크기를 조절할 수 있어 카드 썸네일(크게)·칩(작게) 모두에 쓴다.

import type { GlyphKey } from '../../data/games'
import './GameGlyph.css'

interface GameGlyphProps {
  name: GlyphKey
  size?: number
}

export default function GameGlyph({ name, size = 28 }: GameGlyphProps) {
  return (
    <svg
      className="game-glyph"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[name]}
    </svg>
  )
}

const GLYPHS: Record<GlyphKey, JSX.Element> = {
  grid: (
    <>
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <rect x="18" y="5" width="9" height="9" rx="1.5" />
      <rect x="5" y="18" width="9" height="9" rx="1.5" />
      <rect x="18" y="18" width="9" height="9" rx="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  fruit: (
    <>
      <circle cx="16" cy="19" r="9" />
      <path d="M16 10c0-3 2-5 5-5" />
      <path d="M16 19l4-4" />
    </>
  ),
  letters: (
    <>
      <rect x="5" y="7" width="9" height="9" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="18" y="7" width="9" height="9" rx="1.5" />
      <rect x="5" y="19" width="9" height="6" rx="1.5" />
      <rect x="18" y="19" width="9" height="6" rx="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  cards: (
    <>
      <rect x="6" y="9" width="12" height="16" rx="2" transform="rotate(-9 12 17)" />
      <rect x="15" y="7" width="12" height="16" rx="2" transform="rotate(9 21 15)" fill="currentColor" stroke="none" />
    </>
  ),
  pick: (
    <>
      <path d="M5 27l11-11" />
      <path d="M8 9c5-3 11-3 16 2" />
      <path d="M24 11c-5-5-11-5-16-2" />
      <path d="M15 15l3 3" />
    </>
  ),
  omok: (
    <>
      <path d="M8 8v16M16 8v16M24 8v16M8 8h16M8 16h16M8 24h16" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
      <circle cx="24" cy="8" r="2.4" />
    </>
  ),
  go: (
    <>
      <circle cx="16" cy="16" r="11" />
      <path d="M16 5a11 11 0 0 0 0 22" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="11" />
    </>
  ),
  tsumego: (
    <>
      <path d="M7 8v16M13 8v16M19 8v16M25 8v16M7 8h18M7 14h18M7 20h18M7 24h18" strokeWidth="1" />
      <circle cx="13" cy="14" r="3.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="20" r="3.2" />
    </>
  ),
  burger: (
    <>
      <path d="M6 11c0-3.5 4.5-6 10-6s10 2.5 10 6" />
      <path d="M6 11h20" />
      <path d="M6 16h20" strokeWidth="2.2" />
      <rect x="6" y="20" width="20" height="5" rx="2.5" />
    </>
  ),
}
