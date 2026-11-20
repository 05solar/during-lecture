// 직접 그린 SVG들을 합성해 카드와 히어로용 커버를 재현한다. 외부 에셋 없음.
import { readFileSync, writeFileSync } from 'node:fs'
const asset = name => readFileSync(new URL(`${name}.svg`, import.meta.url), 'utf8')
const inner = name => asset(name).replace(/<svg[^>]*>/, '').replace('</svg>', '')
const sprite = (name, x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})">${inner(name)}</g>`
writeFileSync(new URL('cover.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" shape-rendering="crispEdges">
${inner('meadow')}
<path fill="#6d9099" d="M238 424h164v12H238z"/>
${sprite('bunny', 240, 240, 4)}
${sprite('star', 146, 136, 2.4)}
${sprite('gold', 333, 110, 2.5)}
${sprite('star', 443, 252, 1.8)}
${sprite('meteor', 74, 280, 1.6)}
${sprite('shield', 473, 132, 1.6)}
</svg>\n`)
