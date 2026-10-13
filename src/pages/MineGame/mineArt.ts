// mineArt.ts
// 돌깨기 게임에서 쓰는 큰 일러스트(돌 4단계 · 곡괭이)를 SVG data URI로 생성한다.
// 외부 이미지 없이 자체 생성하며, 여기서의 그라데이션은 UI 배경이 아니라
// 캐릭터 일러스트의 음영 표현이다. (원본: Gangneung 프로젝트 gameArt.ts에서 발췌)

const uri = (svg: string) => 'data:image/svg+xml,' + encodeURIComponent(svg)

const rock = (cracks: number) => {
  const crackPaths = [
    `<path d='M66 40 L60 56 L68 64 L62 78' fill='none' stroke='#3f464d' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/>`,
    `<path d='M44 44 L52 60 L44 72 L50 84' fill='none' stroke='#3f464d' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/>`,
    `<path d='M80 62 L70 70 L78 80' fill='none' stroke='#3f464d' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/>`,
  ].slice(0, cracks).join('')
  return uri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 130 130'>
    <defs><linearGradient id='rg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#aab3bb'/><stop offset='1' stop-color='#6f767f'/></linearGradient></defs>
    <ellipse cx='66' cy='114' rx='46' ry='9' fill='#1b2740' opacity='0.14'/>
    <path d='M24 98 Q12 70 24 50 Q34 34 54 32 Q66 28 82 36 Q104 44 106 68 Q108 92 88 102 Q64 112 42 106 Q30 104 24 98 Z'
      fill='url(#rg)' stroke='#545b63' stroke-width='3' stroke-linejoin='round'/>
    <path d='M30 54 Q40 38 56 36 Q68 34 76 42 Q60 42 48 52 Q38 60 30 54 Z' fill='#c2c9d0' opacity='0.75'/>
    <path d='M106 68 Q108 92 88 102 Q78 106 66 104 Q86 96 94 82 Q100 74 106 68 Z' fill='#5c646c' opacity='0.55'/>
    <g fill='#565e66' opacity='0.55'><circle cx='54' cy='74' r='2.2'/><circle cx='72' cy='62' r='1.7'/><circle cx='64' cy='90' r='2'/><circle cx='84' cy='78' r='1.5'/><circle cx='46' cy='62' r='1.4'/></g>
    ${crackPaths}
  </svg>`)
}

export const ROCK_IMGS = [rock(0), rock(1), rock(2), rock(3)]

export const PICK_IMG = uri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 130 130'>
  <defs>
    <linearGradient id='wood' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#9c6a3c'/><stop offset='1' stop-color='#6b4423'/></linearGradient>
    <linearGradient id='steel' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c7d0d8'/><stop offset='0.5' stop-color='#98a2ab'/><stop offset='1' stop-color='#6f7880'/></linearGradient>
  </defs>
  <path d='M36 106 L96 42' stroke='#4d3016' stroke-width='13' stroke-linecap='round'/>
  <path d='M36 106 L96 42' stroke='url(#wood)' stroke-width='9' stroke-linecap='round'/>
  <path d='M42 100 L90 48' stroke='#b98a55' stroke-width='2' stroke-linecap='round' opacity='0.6'/>
  <g stroke='#3d2814' stroke-width='2' opacity='0.7' stroke-linecap='round'>
    <line x1='44' y1='96' x2='53' y2='104'/><line x1='51' y1='89' x2='60' y2='97'/><line x1='58' y1='82' x2='67' y2='90'/>
  </g>
  <path d='M26 46 Q60 18 98 30 Q116 36 124 50 Q112 44 96 44 Q64 38 44 56 Q32 54 26 46 Z'
    fill='url(#steel)' stroke='#4a525a' stroke-width='2' stroke-linejoin='round'/>
  <path d='M32 45 Q62 22 96 32' fill='none' stroke='#e3e9ee' stroke-width='2' opacity='0.65' stroke-linecap='round'/>
  <rect x='75' y='36' width='16' height='16' rx='3' transform='rotate(-46 83 44)' fill='#828a92' stroke='#4a525a' stroke-width='1.5'/>
</svg>`)
