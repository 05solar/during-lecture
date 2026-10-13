// scoreStore.ts
// 게임별 최고 점수를 localStorage에 저장/조회하는 유틸리티.
// 각 게임은 고유 id를 키로 사용하며, 점수가 갱신될 때 'score-change' 커스텀 이벤트를
// 발행해 헤더의 누적 점수 표시가 즉시 반영되도록 한다.

const STORAGE_KEY = 'minigame-arcade:best-scores'
const EVENT_NAME = 'score-change'

type ScoreMap = Record<string, number>

function readAll(): ScoreMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ScoreMap) : {}
  } catch {
    return {}
  }
}

function writeAll(map: ScoreMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event(EVENT_NAME))
}

/** 특정 게임의 최고 점수를 가져온다. 기록이 없으면 0. */
export function getBestScore(gameId: string): number {
  return readAll()[gameId] ?? 0
}

/** 모든 게임 점수 맵을 그대로 반환한다. */
export function getAllScores(): ScoreMap {
  return readAll()
}

/** 모든 게임 최고 점수의 합(누적 점수). */
export function getTotalScore(): number {
  return Object.values(readAll()).reduce((sum, v) => sum + v, 0)
}

/** 새 점수가 기존 최고 점수보다 높을 때만 갱신한다. 갱신 여부를 반환. */
export function submitScore(gameId: string, score: number): boolean {
  const map = readAll()
  if (score > (map[gameId] ?? 0)) {
    map[gameId] = score
    writeAll(map)
    return true
  }
  return false
}

/** 점수 변경을 구독한다. 반환되는 함수를 호출하면 구독 해제. */
export function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT_NAME, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT_NAME, listener)
    window.removeEventListener('storage', listener)
  }
}
