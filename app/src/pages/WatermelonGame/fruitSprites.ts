// WatermelonGame fruit asset metadata and 64-bit sprite-sheet loader.
import fruitSpriteSheet from './assets/fruit-sprites-64bit.png'

export interface Fruit {
  name: string
  r: number
  color: string
}

// Merge order: cherry through watermelon. The artwork is a 4 x 3 sheet (362px cells);
// the last cell (watermelon slice) is unused decoration.
export const FRUITS: Fruit[] = [
  { name: '체리', r: 13, color: '#e52b42' },
  { name: '딸기', r: 17, color: '#ef3340' },
  { name: '포도', r: 22, color: '#8436b5' },
  { name: '귤', r: 27, color: '#ff8a13' },
  { name: '레몬', r: 33, color: '#f6d32d' },
  { name: '사과', r: 39, color: '#e62532' },
  { name: '배', r: 46, color: '#c7cd21' },
  { name: '복숭아', r: 53, color: '#f58eaa' },
  { name: '파인애플', r: 61, color: '#f2ae18' },
  { name: '멜론', r: 71, color: '#b6bd69' },
  { name: '수박', r: 82, color: '#3a9e3c' },
]

export interface SpriteCrop {
  sx: number
  sy: number
  sw: number
  sh: number
}

// Each cell has a lot of transparent padding around the actual fruit art. These are
// tight content bounding boxes (alpha-thresholded, +6px margin) computed per cell so
// rendering never shows the empty padding as part of the fruit's hitbox/silhouette.
const SPRITE_CROPS: SpriteCrop[] = [
  { sx: 124, sy: 132, sw: 138, sh: 197 }, // 체리
  { sx: 453, sy: 116, sw: 193, sh: 222 }, // 딸기
  { sx: 806, sy: 116, sw: 198, sh: 222 }, // 포도
  { sx: 1160, sy: 127, sw: 192, sh: 209 }, // 귤
  { sx: 86, sy: 488, sw: 219, sh: 156 }, // 레몬
  { sx: 448, sy: 447, sw: 198, sh: 220 }, // 사과
  { sx: 813, sy: 439, sw: 173, sh: 232 }, // 배
  { sx: 1151, sy: 452, sw: 205, sh: 211 }, // 복숭아
  { sx: 107, sy: 751, sw: 179, sh: 259 }, // 파인애플
  { sx: 443, sy: 774, sw: 211, sh: 236 }, // 멜론
  { sx: 781, sy: 780, sw: 234, sh: 230 }, // 수박
]

export function spriteCropFor(tier: number): SpriteCrop {
  return SPRITE_CROPS[tier]
}

export function loadFruitSpriteSheet(): HTMLImageElement {
  const image = new Image()
  image.src = fruitSpriteSheet
  return image
}
