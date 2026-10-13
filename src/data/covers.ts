// covers.ts
// 게임별 커버 이미지(카드 썸네일 · 히어로 배너 공용) 매핑.
// 이미지는 src/assets/game-covers/<id>.png 를 Vite가 번들해 URL로 제공한다.

import cover2048 from '../assets/game-covers/2048.png'
import coverWatermelon from '../assets/game-covers/watermelon.png'
import coverWordle from '../assets/game-covers/wordle.png'
import coverBlackjack from '../assets/game-covers/blackjack.png'
import coverMine from '../assets/game-covers/mine.png'
import coverOmok from '../assets/game-covers/omok.png'
import coverBaduk from '../assets/game-covers/baduk.png'
import coverBurger from '../assets/game-covers/burger.png'
import coverWhack from '../assets/game-covers/whack.png'

export const GAME_COVERS: Record<string, string> = {
  '2048': cover2048,
  watermelon: coverWatermelon,
  wordle: coverWordle,
  blackjack: coverBlackjack,
  mine: coverMine,
  omok: coverOmok,
  baduk: coverBaduk,
  burger: coverBurger,
  whack: coverWhack,
}
