// games.ts
// 미니게임 카탈로그 정의. 메인 페이지 그리드와 각 게임 라우팅의 원본 데이터다.
// icon 값은 커스텀 SVG 글리프 키(GameGlyph 컴포넌트에서 매핑)로,
// 루시드 아이콘/기본 이모지를 사용하지 않는다는 규칙을 지킨다.

export type GameStatus = 'ready' | 'soon'
export type Category = 'puzzle' | 'arcade' | 'card' | 'board'
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameMeta {
  id: string
  title: string
  tagline: string
  /** 점수 단위 설명 (예: "최고 점수") */
  scoreUnit: string
  icon: GlyphKey
  category: Category
  difficulty: Difficulty
  status: GameStatus
}

/** 장르 필터 칩 (전체 + 실제 사용 카테고리) */
export const CATEGORIES: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'puzzle', label: '퍼즐' },
  { key: 'arcade', label: '아케이드' },
  { key: 'card', label: '카드' },
  { key: 'board', label: '보드' },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  puzzle: '퍼즐',
  arcade: '아케이드',
  card: '카드',
  board: '보드',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
}

export type GlyphKey =
  | 'grid'
  | 'fruit'
  | 'letters'
  | 'cards'
  | 'pick'
  | 'omok'
  | 'go'
  | 'tsumego'
  | 'burger'

export const GAMES: GameMeta[] = [
  {
    id: '2048',
    category: 'puzzle',
    difficulty: 'normal',
    title: '2048',
    tagline: '타일을 밀어 같은 수를 합치고 2048을 만드는 퍼즐.',
    scoreUnit: '최고 점수',
    icon: 'grid',
    status: 'ready',
  },
  {
    id: 'watermelon',
    category: 'puzzle',
    difficulty: 'easy',
    title: '수박 게임',
    tagline: '같은 과일을 합쳐 더 큰 과일로. 물리 기반 합치기 퍼즐.',
    scoreUnit: '최고 점수',
    icon: 'fruit',
    status: 'ready',
  },
  {
    id: 'wordle',
    category: 'puzzle',
    difficulty: 'normal',
    title: '워들',
    tagline: '여섯 번 안에 숨은 다섯 글자 영어 단어를 맞히세요.',
    scoreUnit: '최고 점수',
    icon: 'letters',
    status: 'ready',
  },
  {
    id: 'blackjack',
    category: 'card',
    difficulty: 'easy',
    title: '블랙잭',
    tagline: '21에 가깝게. 딜러를 이겨 칩을 쌓는 카드 게임.',
    scoreUnit: '최고 점수',
    icon: 'cards',
    status: 'ready',
  },
  {
    id: 'mine',
    category: 'arcade',
    difficulty: 'easy',
    title: '돌깨기',
    tagline: '곡괭이로 돌을 캐서 점수를 모으는 클리커.',
    scoreUnit: '최고 점수',
    icon: 'pick',
    status: 'ready',
  },
  {
    id: 'omok',
    category: 'board',
    difficulty: 'normal',
    title: '오목',
    tagline: '가로·세로·대각선으로 다섯 돌을 먼저 잇는 쪽이 승리.',
    scoreUnit: '최고 점수',
    icon: 'omok',
    status: 'ready',
  },
  {
    id: 'baduk',
    category: 'board',
    difficulty: 'hard',
    title: '바둑',
    tagline: '집을 많이 짓는 쪽이 이기는 고전 전략 보드게임.',
    scoreUnit: '최고 점수',
    icon: 'go',
    status: 'ready',
  },
  {
    id: 'tsumego',
    category: 'board',
    difficulty: 'hard',
    title: '사활 훈련',
    tagline: '한 수의 급소를 찾아 돌을 살리거나 잡는 바둑 사활 문제.',
    scoreUnit: '최고 점수',
    icon: 'tsumego',
    status: 'ready',
  },
  {
    id: 'burger',
    category: 'arcade',
    difficulty: 'normal',
    title: '버거 타워',
    tagline: '좌우로 움직이는 재료를 쌓아 무너지지 않는 버거 타워를 완성.',
    scoreUnit: '최고 점수',
    icon: 'burger',
    status: 'ready',
  },
  {
    id: 'whack',
    category: 'arcade',
    difficulty: 'normal',
    title: '두더지 잡기',
    tagline: '30초 동안 튀어나오는 두더지를 최대한 많이 클릭하는 반응 게임.',
    scoreUnit: '최고 점수',
    icon: 'grid',
    status: 'ready',
  },
]

export function getGameById(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id)
}
