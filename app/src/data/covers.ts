// covers.ts
// 게임별 커버 이미지(카드 썸네일 · 히어로 배너 공용) 매핑.
// 이미지는 src/assets/game-covers/<id>.png 를 Vite가 번들해 URL로 제공한다.

import cover2048 from '../assets/game-covers/2048.webp'
import coverWatermelon from '../assets/game-covers/watermelon.webp'
import coverWordle from '../assets/game-covers/wordle.webp'
import coverBlackjack from '../assets/game-covers/blackjack.webp'
import coverMine from '../assets/game-covers/mine.webp'
import coverOmok from '../assets/game-covers/omok.webp'
import coverBaduk from '../assets/game-covers/baduk.webp'
import coverBurger from '../assets/game-covers/burger.webp'
import coverWhack from '../assets/game-covers/whack.webp'

export const GAME_COVERS: Record<string, string> = {
  '2048': cover2048,
  watermelon: coverWatermelon,
  wordle: coverWordle,
  blackjack: coverBlackjack,
  mine: coverMine,
  omok: coverOmok,
  baduk: coverBaduk,
  tsumego: coverBaduk,
  burger: coverBurger,
  whack: coverWhack,
}
