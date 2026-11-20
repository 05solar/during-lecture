# 미니게임 아케이드

개인용 정적 미니게임 모음 사이트. 여러 미니게임을 한곳에서 즐기고, 게임별 최고 점수를 기록한다.
GitHub Pages로 배포하는 React + TypeScript + Vite 프로젝트다.

> 이 프로젝트 소스는 레포의 **`app/` 하위 폴더**에 있다. 레포 **루트**에는 랜딩용 `README.md`(Pages 링크·스크린샷)와
> `.github/`(Actions 워크플로)만 둔다. 아래 경로/명령은 모두 `app/` 기준이다.

## 실행

```bash
cd app           # 레포 루트에서 app 폴더로 이동
```


```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 배포 (GitHub Pages)

- `vite.config.ts`의 `base: './'`와 `HashRouter`를 사용하므로 프로젝트 페이지 경로에서도 동작하며 새로고침 404가 없다.
- 레포 루트의 `.github/workflows/deploy.yml`이 `main` 브랜치 푸시 시 **`app/`에서 빌드**해 `app/dist`를 Pages에 자동 배포한다.
  (저장소 Settings → Pages → Source를 **GitHub Actions**로 설정해야 한다.)
- 배포 주소: https://05solar.github.io/during-lecture/

## 파일 구조

```
app/                          레포의 app/ 하위 = 이 프로젝트 루트
├─ index.html                 진입 HTML (루트 div + main.tsx 로드)
├─ vite.config.ts             Vite 설정 (base './', react 플러그인)
├─ tsconfig.json              TypeScript 설정 (앱)
├─ tsconfig.node.json         TypeScript 설정 (vite 설정용)
├─ package.json               스크립트/의존성
│
├─ README.md                  (이 문서) 프로젝트와 파일 설명
├─ DESIGN.md                  디자인 토큰·원칙 기록
├─ PROCESS.md                 진행 사항 기록 (명령마다 갱신)
├─ AGENT.md                   작업 규칙 모음 (디자인/구조/문서 규칙)
│
└─ src/
   ├─ main.tsx                앱 진입점 (HashRouter로 App 렌더)
   ├─ App.tsx / App.css       루트 레이아웃 + 12개 게임 라우트 정의
   ├─ vite-env.d.ts           Vite 타입 참조
   │
   ├─ styles/
   │  └─ global.css           전역 스타일 + 디자인 토큰(CSS 변수)
   │
   ├─ lib/
   │  └─ scoreStore.ts        localStorage 기반 점수 저장/조회/구독 유틸
   │
   ├─ data/
   │  └─ games.ts             미니게임 카탈로그 데이터 + 타입
   │
   ├─ components/             재사용 컴포넌트 (각 폴더에 tsx/css 분리)
   │  ├─ GameGrid/            장르 필터 적용 반응형 카드 그리드
   │  ├─ GameCard/            게임 카드 (썸네일 글리프 + 장르/난이도 배지 + 최고점 + 플레이)
   │  ├─ GameGlyph/           게임별 커스텀 SVG 글리프 (size 조절)
   │  └─ GamePage/            게임 공통 틀 (뒤로가기·제목·최고 점수 칩)
   │  ※ 상단 네비게이션 바(Header)와 누적 점수판(ScoreBoard)은 제거됨
   │
   └─ pages/                  페이지 (각 폴더에 tsx/css 분리)
      ├─ Home/                메인 페이지 (인트로 + 게임 그리드)
      ├─ Game2048/            2048 퍼즐
      ├─ WatermelonGame/      수박 게임 (matter-js 물리 + fruitSprites.ts)
      ├─ WordleGame/          워들
      ├─ BlackjackGame/       블랙잭
      ├─ MineGame/            돌깨기 (mineArt.ts)
      ├─ OmokGame/            오목 (vs AI, canvas)
      ├─ GoGame/              바둑 (vs AI, 웹워커: go.ts·goAi.ts·goWorker.ts)
      ├─ BurgerGame/          버거 타워 (matter-js, ingredients.ts + assets/ PNG 8종)
      ├─ WhackGame/           두더지 잡기 (픽셀 캐릭터·피격 표정·망치, 타격 애니메이션)
      ├─ StarBunnyGame/       별빛 토끼 (60초 수집 게임, engine.ts + 직접 그린 assets/*.svg)
      ├─ OddColorGame/        다른 색 찾기
      ├─ TsumegoGame/         사활 학습 (GGG 상급 SGF 140문제, 변화도·해설·복습 기록)
      └─ GamePlaceholder/     /game/:id 미등록 id 폴백 안내

※ 레포 루트에는 추가로: README.md(랜딩) · screenshot.png · .github/workflows/deploy.yml
```

## 미니게임 목록

두더지 잡기와 다른색 찾기의 픽셀 커버는 `src/assets/game-covers/whack.webp`,
`src/assets/game-covers/oddcolor.webp`이며 `src/data/covers.ts`에서 연결한다.
생성 프롬프트와 에셋 규격은 [이미지 제작 기록](docs/pixel-assets-2026-11-16.md)에 정리했다.

망치 애니메이션과 사활 학습 구성·검증 방법은 [고도화 기록](docs/advanced-games-2026-11-16.md),
사활 문제집의 출처·이용 조건은 [문제집 안내](src/pages/TsumegoGame/problems/README.md)를 참고한다.

| 게임 | id | 점수 방식 | 비고 |
| --- | --- | --- | --- |
| 별빛 토끼 | `starbunny` | 60초 또는 기회 소진 후 모은 점수 | 좌우 이동, 3기회, 연속 수집 최대 3배, 보호막 |
| 2048 | `2048` | 게임오버 시 점수(최고점 유지) | 방향키/스와이프 |
| 수박 게임 | `watermelon` | 게임오버 시 점수 | matter-js 물리 |
| 워들 | `wordle` | 적은 시도일수록 고점(최대 600) | — |
| 블랙잭 | `blackjack` | 보유 칩(최고 칩 유지) | 초기 1000칩 |
| 돌깨기 | `mine` | 세션 누적 정산 점수 | 클리커 |
| 오목 | `omok` | 난이도별 승점 | vs AI |
| 바둑 | `baduk` | 승리 시 집 차이(margin) | vs AI(웹워커) |
| 버거 타워 | `burger` | 쌓은 높이 | matter-js 물리, 좌클릭/스페이스로 낙하 |
| 두더지 잡기 | `whack` | 잡은 수(60초) | 클릭·방향키+스페이스바 조작, 시간이 갈수록 빨라짐 |
| 사활 훈련 | `tsumego` | 도움 없이 해답의 응수들을 해결한 점수 | 상급 140문제, 해설 복기·자유 분석·반복 복습 |
| 다른 색 찾기 | `oddcolor` | 제한시간 동안 찾은 단계 점수 | 색 구분 퍼즐 |

원본 7종(버거 제외)은 `Gangneung` 프로젝트에서 이식하며 여행앱 결합(플레이어/백엔드)을 제거하고
이 사이트의 오프화이트 테마와 `scoreStore` 점수 시스템에 맞게 조정했다.

## 점수 시스템

- 각 게임은 고유 `id`를 키로 `localStorage`에 **최고 점수**를 저장한다 (`scoreStore.submitScore`).
- 최고 점수는 **각 게임 카드**와 **게임 화면 상단(GamePage)**, **히어로**에 표시된다.
- 리더보드/누적 점수판·토너먼트 같은 소셜 위젯은 두지 않는다(개인용).

## 메인 화면 구성

- **히어로 스포트라이트**(오늘의 추천 게임 + 즉시 플레이) → **장르 필터 칩**(전체/퍼즐/아케이드/카드/보드)
  → **게임 카드 그리드**. 상단 네비게이션 바는 없다. 디자인은 Lumina Arcade 레퍼런스 기반의 맑은 화이트 + 인디고블루.

## 의존성

- `react` / `react-dom` / `react-router-dom`
- `matter-js` (+ `@types/matter-js`) — 수박 게임·버거 타워의 물리 시뮬레이션

## 현재 상태

- 메인 페이지 + 점수 시스템 + 미니게임 12종 동작.
- 자세한 진행 내역은 `PROCESS.md` 참고.

## 별빛 토끼

`/#/game/starbunny`에서 플레이한다. 방향키 또는 A/D, 마우스 이동, 터치 드래그와 하단 이동 버튼을 지원한다.
별은 10점, 황금 별은 30점이며 5연속부터 2배, 10연속부터 3배다. 별을 놓치면 연속 기록만 초기화된다.
운석은 기회를 하나 줄이고, 보호막은 운석을 한 번 막는다. 20초마다 난이도가 올라가며 60초 또는 3기회 소진 시 종료된다.
P/Escape 또는 버튼으로 일시정지하며, 다른 창으로 이동할 때도 자동으로 멈춘다. 효과음은 기본 꺼짐이다.
게임 화면은 점수·시간·기회와 조작 버튼만 중심으로 구성한다. 토끼와 아이템의 넓어진 충돌 영역을 합산하며,
일반 별은 토끼 중심에서 좌우 96까지 받을 수 있다(640×480 게임 좌표 기준).

- `src/pages/StarBunnyGame/StarBunnyGame.tsx` / `.css`: 화면, 입력, 효과음, 결과와 최고 점수 연동.
- `src/pages/StarBunnyGame/engine.ts`: 생성·이동·충돌·콤보·시간 규칙.
- `src/pages/StarBunnyGame/assets/`: 직접 그린 픽셀 SVG 7종. `build-cover.mjs`로 원본을 합성해 커버를 재생성한다.
- `tests/starbunny.test.mjs`: 엔진 규칙 테스트. `npm test`로 기존 사활 테스트와 함께 실행한다.
- `tests/starbunny.browser.test.mjs`: 실제 입력, 모바일 크기, 전체 라운드, 저장·재시작 테스트. `npm run test:browser`로 실행한다.
- 브라우저 테스트는 Playwright Chromium 설치가 필요하다. 미설치 환경에서는 `npx playwright install chromium`을 먼저 실행한다.
