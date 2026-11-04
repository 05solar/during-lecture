// WatermelonGame fruit asset metadata and 64-bit sprite-sheet loader.
import fruitSpriteSheet from './assets/fruit-sprites-64bit.png'

export interface Fruit {
  name: string
  r: number
  color: string
}

// Merge order: cherry through watermelon. The artwork is a 4 x 3 sheet;
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

export const SPRITE_COLUMNS = 4
export const SPRITE_CELL_SIZE = 362

export function spriteCellFor(tier: number) {
  return {
    x: (tier % SPRITE_COLUMNS) * SPRITE_CELL_SIZE,
    y: Math.floor(tier / SPRITE_COLUMNS) * SPRITE_CELL_SIZE,
  }
}

export function loadFruitSpriteSheet(): HTMLImageElement {
  const image = new Image()
  image.src = fruitSpriteSheet
  return image
}
