// 수박게임용 과일 캐릭터 스프라이트
// 외부 이미지 없이 SVG 로 귀여운 과일 캐릭터를 생성해 data URI 로 제공합니다.
// (광택은 최소화한 매트한 톤 + 큰 눈/볼터치로 더 귀엽게)

export interface Fruit {
  name: string;
  r: number;
  color: string;
  dark: string;
  deco: 'none' | 'seeds' | 'segments' | 'hatch' | 'crown' | 'stripes';
}

// 작은 것(체리) → 큰 것(수박) 순서, 총 11단계
export const FRUITS: Fruit[] = [
  { name: '체리', r: 13, color: '#e0455a', dark: '#a82438', deco: 'none' },
  { name: '딸기', r: 17, color: '#ec5f86', dark: '#c23a63', deco: 'seeds' },
  { name: '포도', r: 22, color: '#8a5fb0', dark: '#5f3d82', deco: 'none' },
  { name: '귤', r: 27, color: '#f4993a', dark: '#c9701a', deco: 'segments' },
  { name: '감', r: 33, color: '#e57a35', dark: '#b8551a', deco: 'none' },
  { name: '사과', r: 39, color: '#d94040', dark: '#a82626', deco: 'none' },
  { name: '배', r: 46, color: '#c9bd5a', dark: '#9a8f36', deco: 'none' },
  { name: '복숭아', r: 53, color: '#f4a6ad', dark: '#e07d8c', deco: 'none' },
  { name: '파인애플', r: 61, color: '#e8c34a', dark: '#c39a1e', deco: 'crown' },
  { name: '멜론', r: 71, color: '#93c85a', dark: '#6a9e37', deco: 'hatch' },
  { name: '수박', r: 82, color: '#43a047', dark: '#2c6e30', deco: 'stripes' },
];

function topper(deco: Fruit['deco']): string {
  if (deco === 'crown') {
    // 파인애플 왕관 (잎)
    return `<g fill='#5bbf5b' stroke='#3a8a3a' stroke-width='1' stroke-linejoin='round'>
      <path d='M50 21 L43 3 L53 15 Z'/><path d='M50 21 L57 1 L61 16 Z'/>
      <path d='M50 21 L37 5 L47 18 Z'/></g>`;
  }
  // 잎 + 줄기
  return `<rect x='48' y='9' width='4' height='11' rx='2' fill='#7a4a2b'/>
    <path d='M52 12 Q66 3 74 11 Q64 20 52 16 Z' fill='#5bbf5b' stroke='#3a8a3a' stroke-width='1'/>`;
}

function decoration(f: Fruit): string {
  switch (f.deco) {
    case 'seeds':
      return `<g fill='#fff3c4' opacity='0.9'>
        <ellipse cx='40' cy='47' rx='1.3' ry='2.2'/><ellipse cx='60' cy='49' rx='1.3' ry='2.2'/>
        <ellipse cx='33' cy='69' rx='1.3' ry='2.2'/><ellipse cx='67' cy='69' rx='1.3' ry='2.2'/>
        <ellipse cx='50' cy='80' rx='1.3' ry='2.2'/></g>`;
    case 'segments':
      return `<g stroke='${f.dark}' stroke-width='1' fill='none' opacity='0.3'>
        <path d='M50 14 V96'/><path d='M20 55 Q50 49 80 55'/></g>`;
    case 'hatch':
      return `<g stroke='${f.dark}' stroke-width='1' opacity='0.28'>
        <path d='M18 45 L40 30'/><path d='M60 82 L82 66'/><path d='M22 70 L44 86'/><path d='M56 26 L80 44'/></g>`;
    case 'stripes':
      return `<g stroke='${f.dark}' stroke-width='4' fill='none' opacity='0.5' stroke-linecap='round'>
        <path d='M33 18 Q24 55 36 92'/><path d='M50 13 Q50 55 50 97'/><path d='M67 18 Q76 55 64 92'/></g>`;
    default:
      return '';
  }
}

function buildSvg(f: Fruit): string {
  const gid = 'fg' + f.r;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <defs>
      <radialGradient id='${gid}' cx='50%' cy='42%' r='62%'>
        <stop offset='0%' stop-color='${f.color}'/>
        <stop offset='100%' stop-color='${f.dark}'/>
      </radialGradient>
    </defs>
    ${topper(f.deco)}
    <circle cx='50' cy='55' r='43' fill='url(#${gid})' stroke='${f.dark}' stroke-width='1.5'/>
    <!-- 아주 약한 매트 하이라이트 -->
    <ellipse cx='42' cy='38' rx='19' ry='12' fill='#ffffff' opacity='0.09'/>
    ${decoration(f)}
    <!-- 귀여운 얼굴: 큰 눈 + 반짝이 + 볼터치 + 작은 미소 -->
    <g>
      <ellipse cx='39' cy='55' rx='6.4' ry='8.6' fill='#3a2b2b'/>
      <ellipse cx='61' cy='55' rx='6.4' ry='8.6' fill='#3a2b2b'/>
      <circle cx='41.4' cy='52' r='2.2' fill='#ffffff'/>
      <circle cx='63.4' cy='52' r='2.2' fill='#ffffff'/>
      <circle cx='37.6' cy='57.5' r='1.1' fill='#ffffff' opacity='0.7'/>
      <circle cx='59.6' cy='57.5' r='1.1' fill='#ffffff' opacity='0.7'/>
    </g>
    <ellipse cx='27' cy='66' rx='5.6' ry='3.8' fill='#ff7d97' opacity='0.5'/>
    <ellipse cx='73' cy='66' rx='5.6' ry='3.8' fill='#ff7d97' opacity='0.5'/>
    <path d='M45 64 Q50 70 55 64' stroke='#3a2b2b' stroke-width='2.4' fill='none' stroke-linecap='round'/>
  </svg>`;
}

export const FRUIT_DATA_URIS: string[] = FRUITS.map(
  (f) => 'data:image/svg+xml,' + encodeURIComponent(buildSvg(f))
);

export function loadFruitImages(): HTMLImageElement[] {
  return FRUIT_DATA_URIS.map((uri) => {
    const img = new Image();
    img.src = uri;
    return img;
  });
}
