// ingredients.ts
// 버거 타워 게임에서 쓰는 재료 스프라이트 메타데이터.
// 이미지는 "레트로 버거 재료 스프라이트 시트"를 재료별로 잘리지 않게 정밀 크롭한 PNG다.
// w/h는 크롭된 원본 픽셀 크기(잘림 없는 실제 크기)이며, 게임에서는 SCALE을 곱해 표시한다.

import bun from './assets/bun.png'
import patty from './assets/patty.png'
import bacon from './assets/bacon.png'
import egg from './assets/egg.png'
import lettuce from './assets/lettuce.png'
import onion from './assets/onion.png'
import tomato from './assets/tomato.png'
import chicken from './assets/chicken.png'

export interface Ingredient {
  key: string
  name: string
  url: string
  /** 크롭된 원본 픽셀 크기(잘림 없음) */
  w: number
  h: number
}

// 표시 배율: 번 폭(396px)이 약 150px이 되도록
export const SCALE = 0.38

export const BUN: Ingredient = { key: 'bun', name: '번', url: bun, w: 396, h: 144 }

// 번을 제외한 쌓는 재료들
export const TOPPINGS: Ingredient[] = [
  { key: 'patty', name: '패티', url: patty, w: 409, h: 137 },
  { key: 'bacon', name: '베이컨', url: bacon, w: 414, h: 133 },
  { key: 'egg', name: '계란', url: egg, w: 388, h: 121 },
  { key: 'lettuce', name: '양상추', url: lettuce, w: 423, h: 166 },
  { key: 'onion', name: '양파', url: onion, w: 375, h: 98 },
  { key: 'tomato', name: '토마토', url: tomato, w: 377, h: 101 },
  { key: 'chicken', name: '치킨', url: chicken, w: 413, h: 146 },
]

export const ALL_INGREDIENTS: Ingredient[] = [BUN, ...TOPPINGS]

export const dispW = (ing: Ingredient) => ing.w * SCALE
export const dispH = (ing: Ingredient) => ing.h * SCALE
