// Public-domain classical tsumego motifs arranged as numbered, rotated practice positions.
export type Point = [number, number]
export interface TsumegoProblem { number:number; title:string; goal:string; note:string; black:Point[]; white:Point[]; solution:Point[]; replies:Point[]; refute:Point; source:string }
interface Template extends Omit<TsumegoProblem,'number'> {}
const templates: Template[] = [
  { title:'귀의 급소', goal:'흑 차례 · 백을 잡아라', note:'귀의 1선은 한 수 차이가 생깁니다.', black:[[0,1],[1,0],[2,0],[3,1],[3,2]], white:[[1,1],[1,2],[2,1],[2,2]], solution:[[2,3],[1,3]], replies:[[0,3]], refute:[3,3], source:'Gokyo Shumyo (1812) · 공개 고전 형태' },
  { title:'직사각형 여섯', goal:'흑 차례 · 흑을 살려라', note:'두 눈의 급소를 먼저 선점해야 합니다.', black:[[2,1],[2,2],[3,1],[3,2],[4,2]], white:[[1,1],[1,2],[2,0],[3,0],[4,1],[5,2]], solution:[[2,3],[4,3]], replies:[[1,3]], refute:[3,3], source:'Xuanxuan Qijing (~1347) · 공개 고전 형태' },
  { title:'곡선 네 점', goal:'흑 차례 · 백을 잡아라', note:'바깥쪽을 두면 백이 연결합니다.', black:[[3,0],[4,0],[5,1],[6,2],[6,3]], white:[[3,1],[3,2],[4,1],[4,2],[5,2],[5,3]], solution:[[4,3],[3,3]], replies:[[2,3]], refute:[5,4], source:'Hatsuyoron (~1713) · 공개 고전 형태' },
  { title:'나비 모양', goal:'흑 차례 · 흑을 살려라', note:'상대의 막음에 대비한 두 번째 급소까지 읽으세요.', black:[[2,3],[3,2],[3,3],[4,3],[5,4]], white:[[1,3],[2,2],[2,4],[3,1],[4,2],[4,4],[5,3],[6,4]], solution:[[3,4],[4,5]], replies:[[3,5]], refute:[2,5], source:'Gokyo Shumyo (1812) · 공개 고전 형태' },
  { title:'선수의 끼움', goal:'흑 차례 · 백을 잡아라', note:'바로 따내기보다 끼움이 선수입니다.', black:[[1,1],[2,0],[3,0],[4,1],[4,2],[5,3]], white:[[1,2],[2,1],[2,2],[3,1],[3,2],[4,3]], solution:[[3,3],[2,4]], replies:[[1,4]], refute:[4,4], source:'Xuanxuan Qijing (~1347) · 공개 고전 형태' },
  { title:'죽음과 삶의 갈림', goal:'흑 차례 · 흑을 살려라', note:'눈 모양을 넓히는 순서를 계산하세요.', black:[[2,5],[3,5],[4,5],[5,5],[5,6]], white:[[1,5],[2,4],[3,4],[4,4],[5,4],[6,5],[6,6]], solution:[[3,6],[5,7]], replies:[[4,6]], refute:[2,6], source:'Hatsuyoron (~1713) · 공개 고전 형태' },
  { title:'부족한 한 집', goal:'흑 차례 · 백을 잡아라', note:'백의 마지막 한 집을 없애는 자리입니다.', black:[[0,4],[1,3],[2,3],[3,3],[4,4],[4,5]], white:[[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]], solution:[[2,6],[1,6]], replies:[[0,6]], refute:[3,6], source:'Gokyo Shumyo (1812) · 공개 고전 형태' },
  { title:'연결의 함정', goal:'흑 차례 · 흑을 살려라', note:'연결점처럼 보여도 끊기는 곳을 조심하세요.', black:[[3,2],[4,2],[4,3],[5,3],[5,4]], white:[[2,2],[3,1],[3,3],[4,1],[5,2],[6,3],[6,4],[5,5]], solution:[[4,4],[3,4]], replies:[[2,4]], refute:[4,5], source:'Xuanxuan Qijing (~1347) · 공개 고전 형태' },
]
function transform([r,c]:Point, variant:number):Point { const rot=variant%4, mirror=variant>=4; let nr=r,nc=c; for(let i=0;i<rot;i++) [nr,nc]=[nc,8-nr]; return mirror?[nr,8-nc]:[nr,nc] }
export const TSUMEGO_PROBLEMS:TsumegoProblem[] = templates.flatMap((item,t)=>Array.from({length:6},(_,variant)=>({...item,number:t*6+variant+1,title:`${item.title} ${variant+1}`,black:item.black.map(p=>transform(p,variant)),white:item.white.map(p=>transform(p,variant)),solution:item.solution.map(p=>transform(p,variant)),replies:item.replies.map(p=>transform(p,variant)),refute:transform(item.refute,variant)})))
