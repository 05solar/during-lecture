# PROCESS.md

진행 사항 기록. **명령을 하나 수행할 때마다** 이 문서를 갱신한다. (최신 항목이 위)

## 2026-10-13 — #10 레포 구조 정리: 프로젝트를 app/로, 루트에 랜딩 README

- 프로젝트 소스 전체를 레포 **`app/` 하위 폴더로 이동**(`git mv` + 일부 `mv`). 빌드 산출물(dist·tsbuildinfo 등)은 정리.
- 레포 **루트에는 필요한 것만** 남김: `README.md`(랜딩) · `screenshot.png` · `.github/`(Actions) · `.gitignore`.
- **루트 README(신규·별개)**: 최상단에 GitHub Pages 링크 크게(`https://05solar.github.io/during-lecture/`)
  → 실제 사이트 스크린샷(Edge 헤드리스로 캡처) → 소개글/기술·배포 안내. `app/README.md`로 상세 문서 링크.
- **배포 워크플로 수정**: `defaults.run.working-directory: app`, `cache-dependency-path: app/package-lock.json`,
  업로드 경로 `app/dist`. (`.github`는 레포 루트 유지 — Actions 요구사항)
- `.gitignore`에 `.vite` 추가. `app/`에서 `npm run build` 정상 확인.

## 2026-10-08 — #9 신규 게임: 두더지 잡기(Whack-a-Mole)

- `pages/WhackGame/`(tsx+css) 추가: 3x3 구멍에서 두더지가 무작위로 튀어나오고, 30초 동안 클릭해
  잡은 수를 점수화. 시간이 지날수록 두더지가 더 빨리 숨는다(난이도 상승). 두더지는 커스텀 SVG.
- 종료 시 `submitScore('whack', score)`(최고 점수 유지). GamePage 래퍼·오프화이트/인디고 테마 준수.
- 카탈로그(`games.ts`)에 `whack`(아케이드/보통) 추가, `App.tsx`에 `/game/whack` 라우트 연결.
- 커버 이미지 `assets/game-covers/whack.png`를 PIL로 생성(그리드+두더지+제목, Lumina 톤) → `covers.ts` 등록.
- `npm run build` 성공. 총 게임 9종.

## 2026-10-08 — #8 게임 커버 이미지 적용 (카드 + 히어로 배너)

- 게임별 커버 PNG 8종을 `src/assets/game-covers/<id>.png`로 추가(카드 썸네일로 사용 — 사용자 작업).
- 커버 매핑을 공용 모듈 `src/data/covers.ts`(`GAME_COVERS`)로 분리, GameCard가 이를 사용하도록 정리.
- **히어로 배너 프리뷰도 글리프 → 커버 이미지로 교체**: `hero__cover`(object-fit:cover, 호버 시 살짝 확대),
  스포트라이트 게임(2048) 커버를 표시. (글리프 썸네일은 더 이상 메인에서 사용하지 않음)
- `npm run build` 성공. 참고: 커버 PNG가 장당 ~2MB(총 ~16MB)로 큰 편 → 필요 시 압축/리사이즈 권장.

## 2026-10-08 — #7 메인 Lumina Arcade 스타일로 전면 재디자인

- 레퍼런스(`Downloads/stitch_simple_white_web_arcade`, Stitch/Tailwind 목업)를 **순수 CSS로 이식**.
  (Tailwind·머티리얼아이콘·이모지 금지 규칙 유지 → 커스텀 SVG 아이콘/텍스트 화살표 사용)
- **팔레트 교체**: 맑은 화이트 `#f9f9ff`(순백 아님) + 카드 `#fff`, 인디고블루 `--accent #4f46e5`/hover `#3525cd`,
  난이도 배지 3색(쉬움 초록/보통 뉴트럴/어려움 빨강), 소프트 섀도·라운드(lg 12 / xl 16) 토큰 추가.
- **탑 네비게이션 바 삭제**(`Header`) + **누적 점수판 삭제**(`ScoreBoard`) → 두 컴포넌트 파일 제거, App에서 헤더 제거.
- **리더보드/토너먼트·일일미션·업적 등 소셜 사이드바 전부 제외**(가짜 데이터 + 개인용 취지). 그리드는 풀폭.
- **메인(Home) 재구성**: 히어로 스포트라이트(오늘의 추천=2048, 즉시 플레이/전체 보기, 내 최고 점수)
  → 장르 필터 칩(전체/퍼즐/아케이드/카드/보드) → 게임 카드 그리드 → 간단 푸터.
- **games.ts**: `category`·`difficulty` 필드와 `CATEGORIES`/라벨 맵 추가(8게임 분류).
- **GameCard** 재디자인: 상단 글리프 썸네일 + 장르/난이도 배지, 하단 제목·설명·최고점·"플레이하기 →".
  **GameGlyph**는 size 조절형으로, **GameGrid**는 category 필터 prop 지원.
- 게임별 최고 점수는 카드·히어로·GamePage에 유지(리더보드 아님). `npm run build` 성공(80 modules).
- 참고: #6(블루/클레이)은 본 Lumina 전환으로 대체됨.

## 2026-10-08 — #6 테마 리스타일: 블루 포인트 · 블랙 텍스트 · 클레이 카드

- **포인트 색상 파랑으로**: `--accent` #3c5a46(그린) → #2f6fed(블루), hover/soft 동반 변경.
  점수·버튼·글리프·강조가 사이트 전역에서 파랑으로 통일.
- **글씨 검정 통일**: `--text-strong`/`--text`를 블랙 계열로, `--text-muted`는 중립 회색.
  배경/표면/라인도 쿨톤 오프화이트로 미세 조정(완전 흰색 아님 유지).
- **메인 그리드 카드 클레이모피즘**(`.game-card`): 부드러운 외부 그림자 + 밝은 하이라이트
  + 안쪽 1px 하이라이트, radius 18px, 호버 시 더 솟음. 그리드 간격 16→22px.
  글리프 틀(`.game-glyph`)에도 가벼운 안쪽 그림자. → AGENT 3장 그림자/radius 규칙의 카드 한정 예외.
- 문서(DESIGN 색상표·방향·카드 예외, AGENT 규칙 4/7/12) 갱신. `npm run build` 성공.

## 2026-10-08 — #5 오목·바둑 보드 PC에서 크게

- 두 게임 모두 캔버스를 **반응형 표시 크기**로 변경: 내부 좌표(W)는 유지하고 렌더 배율(scale)만 키워
  선명하게 확대. `disp = clamp(innerWidth-48, 280, PC면 600 / 모바일 360)`, `resize` 구독.
  렌더 effect에서 `canvas.width=disp*dpr`, `setTransform(dpr*scale, …)`, deps에 `disp` 추가.
- CSS: `.omok`/`.baduk` 래퍼 `max-width`를 `@media (min-width:760px)`에서 **620px**로 확대(모바일은 360 유지).
  클릭 좌표는 기존 `W/rect.width` 정규화라 배율과 무관하게 정확.
- `npm run build` 성공.

## 2026-10-08 — #4 버거 타워 조작/카메라 보강

- **안착 출렁임 추가 완화**: `frictionAir` 0.04→0.09, `frictionStatic` 2→4, 낙하 속도 3→2.
- **조작 변경**: 우클릭 → **마우스 좌클릭**(+스페이스바/터치 유지). 안내 문구·주석 갱신.
- **자동 스크롤 튐 수정**: 카메라가 공중에서 낙하 중인 재료까지 쫓아 올라갔다 내려갔다 하던 문제 →
  `stackTopY()`에서 낙하 중(active) 재료를 **제외**, 카메라는 **위로만 이동(단조 클램프)**.
- **왕복 속도 상향**: 쌓을수록 빨라지도록 `2 + min(score*0.22, 8)`로 증가 폭·상한 확대.
- `npm run build` 성공.

## 2026-10-08 — #3 버거 타워 조작감 조정

- 재료 좌우 왕복 **시작점을 중앙 → 왼쪽 맨 끝(EDGE)**으로 변경, 오른쪽으로 출발하게 수정.
- 안착 시 출렁임("또잉또잉") 완화: 낙하 바디의 `frictionAir` 0.04로 ↑, `friction`/`frictionStatic` ↑,
  낙하 초기 속도 6 → 3으로 ↓(튕김 restitution은 계속 0). 더 빨리 안정되게.
- `EDGE` 상수로 시작점·왕복 경계 일원화. `npm run build` 성공.

## 2026-10-08 — #2 Gangneung 미니게임 7종 이식 + 버거 타워 게임 추가

### 요청 요약
- `Desktop/프로젝트(구)/Gangneung`에 있던 미니게임을 전부 이 사이트로 가져오되,
  배경 분위기는 현재 게임 페이지(오프화이트) 스타일과 동일하게, 점수 시스템도 이 사이트에 맞게 조정.
- 이어서 "햄버거 재료 타워 쌓기" 게임을 신규 제작
  (스프라이트 시트를 잘리지 않게 사용, 번 위에 재료가 좌우로 이동 → 우클릭/스페이스로 낙하,
   무게중심이 쏠리면 타워 붕괴 = 게임 오버, 안 무너지면 자동 스크롤로 무한 적재).

### 수행 내용
1. **원본 분석**: Gangneung 프론트엔드(React+Vite+TS)에서 미니게임 7종 확인 —
   2048 / 수박 게임(matter-js) / 워들 / 블랙잭 / 돌깨기 / 오목(vs AI) / 바둑(vs AI, 웹워커).
   원본은 여행앱 컨텍스트(플레이어 선택 + 백엔드 점수 API)에 결합되어 있었음.
2. **공용 인프라 구축**:
   - `components/GamePage/` — 모든 게임 공통 틀(뒤로가기 · 제목 · 게임별 최고 점수 칩, scoreStore 구독).
   - `global.css`에 `--font-mono`, 저채도 상태색(`--win/--lose/--warn`) 토큰 추가.
   - `data/games.ts` 카탈로그를 실제 8종(위 7종 + 버거 타워)으로 교체, `GameGlyph`에 글리프 추가.
3. **이식 공통 규칙 적용**(모든 게임): 여행앱 결합 제거(`useSelectedPlayer`·`postScore`·`GameHeader`·
   `Player`·플레이어 지갑), 점수는 `scoreStore.submitScore(gameId, score)`(게임별 최고점 유지)로 교체,
   뒤로가기는 `/`로, 리퀴드글라스·그라데이션 크롬·머티리얼 아이콘·이모지 제거 → 오프화이트 테마 토큰에 매핑.
   게임 고유색(2048 타일·카드·돌·과일 등)은 유지.
4. **직접 이식**: 2048 / 돌깨기 / 워들 (각 `pages/<Name>/` tsx+css 분리).
   - 돌깨기: 아트 SVG를 `MineGame/mineArt.ts`로 분리. 세션 누적 정산 점수 → 최고점.
   - 워들: 적은 시도로 맞출수록 고점(1회=600 … 6회=100), 패배 0.
5. **병렬 서브에이전트 이식**(4종): 블랙잭 / 오목 / 수박 게임 / 바둑.
   - 블랙잭: 초기 칩 1000, 칩 변동 시마다 submit(최고 칩 유지).
   - 오목: vs AI, 난이도별 승점(쉬움100/중간1000/어려움5000), 무30/패0.
   - 수박: matter-js 물리/합치기 로직 보존, `WatermelonGame/fruitSprites.ts` 동봉, 게임오버 시 점수 submit.
   - 바둑: 웹워커 AI 보존(`go.ts/goAi.ts/goWorker.ts` 동봉), 승리 시 집 차이(margin)를 점수로.
6. **버거 타워 게임 신규 제작**(`pages/BurgerGame/`):
   - 스프라이트 시트(1774×887)를 PIL로 재료별 바운딩박스 크롭 → 8개 PNG(`assets/`), 잘림 없음.
   - matter-js 물리: 번은 정적 베이스, 재료가 상단에서 좌우 이동 → 우클릭/스페이스로 낙하.
     무게중심이 쏠려 기울거나(각도>약51°) 베이스 아래로 떨어지면 붕괴 → 게임 오버.
   - 카메라 자동 스크롤로 무한 적재, 쌓은 높이가 점수.
7. **라우팅**: `App.tsx`에 8개 게임 라우트 연결(`/game/<id>`), 미등록 id는 임시 페이지로 폴백.
8. **의존성**: `matter-js` + `@types/matter-js` 추가.

### 검증
- `npm run build` 성공(84 modules, 타입체크 통과, Go 웹워커 청크 + 버거 PNG 에셋 번들).
- 디자인 규칙 점검: CSS 크롬에 그라데이션/backdrop-filter/글래스/머티리얼아이콘 없음(주석 제외).
- 여행앱 결합 잔재 0건. 8개 게임 모두 GamePage + submitScore(올바른 gameId) 연결 확인.
- `npm run preview` 서빙 200, 웹워커 에셋 200.

### 다음 할 일
- 실제 브라우저에서 각 게임 플레이 테스트(특히 버거 물리 밸런스·바둑 워커 응답).
- 필요 시 버거 난이도 곡선/붕괴 판정 임계값 튜닝.

## 2026-10-08 — #1 프로젝트 초기화 + 메인 페이지

### 요청 요약
- GitHub Pages용 개인 정적 미니게임 사이트 시작.
- 메인 페이지를 그리드 카드 형태로, 누적 점수 표시 포함해 먼저 구현.
- README / DESIGN / PROCESS / AGENT 문서 작성.
- 엄격한 프론트엔드 디자인 규칙 및 파일 구조 규칙 준수(Tailwind 금지, tsx/css 분리 등).

### 수행 내용
1. **프로젝트 스캐폴딩**: React 18 + TypeScript + Vite 수동 구성
   (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `.gitignore`).
   - GitHub Pages 대응: `base: './'` + `HashRouter`.
2. **디자인 토큰**: `src/styles/global.css`에 오프화이트 배경·단일 액센트 등 CSS 변수 정의.
3. **점수 시스템**: `src/lib/scoreStore.ts` — localStorage 기반 최고 점수 저장/조회/합산/구독.
4. **게임 데이터**: `src/data/games.ts` — 6개 미니게임 카탈로그(2048, 스네이크, 메모리 매치,
   반응 속도, 지뢰 찾기, 벽돌 깨기) + 타입 정의.
5. **컴포넌트**(폴더별 tsx/css 분리, 최상단 설명 주석):
   - `GameGlyph` — 루시드/이모지 대신 직접 그린 커스텀 SVG 글리프.
   - `ScoreBoard` — 누적 점수 표시(점수 구독으로 실시간 갱신).
   - `Header` — 브랜드 + 점수판, 하단 중간선으로만 구분.
   - `GameCard` — 게임 한 칸 카드(사이드 마커 없음, 미묘한 호버).
   - `GameGrid` — 균일 반응형 카드 그리드.
6. **페이지**(폴더별 tsx/css 분리):
   - `Home` — 인트로 + 게임 그리드.
   - `GamePlaceholder` — `/game/:id` 임시 안내 페이지(게임 구현 전).
7. **라우팅/레이아웃**: `App.tsx`에서 `/`, `/game/:id` 라우트 구성.
8. **배포 준비**: `.github/workflows/deploy.yml` GitHub Actions Pages 자동 배포 워크플로 추가.
9. **문서**: `AGENT.md`, `DESIGN.md`, `README.md`, `PROCESS.md` 작성.

### 검증
- `npm install` 성공.
- `npm run build` 성공(타입체크 포함, 51 modules, 에러 없음).
- `npm run preview`로 정적 서빙 확인(상대 경로 `./assets/...` 정상).

### 다음 할 일
- 개별 미니게임 구현(우선순위: 2048 또는 스네이크부터).
- 각 게임 완성 시 `GamePlaceholder` 자리에 실제 게임 컴포넌트 연결 + `submitScore` 연동.
- 게임별 상태를 `games.ts`에서 `ready`로 전환.
