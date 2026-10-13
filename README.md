# 미니게임 아케이드

개인용 정적 미니게임 모음 사이트. 여러 미니게임을 한곳에서 즐기고, 게임별 최고 점수를 기록해
상단에 **누적 점수(총합)** 를 표시한다. GitHub Pages로 배포하는 React + TypeScript + Vite 프로젝트다.

## 실행

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 배포 (GitHub Pages)

- `vite.config.ts`의 `base: './'`와 `HashRouter`를 사용하므로 프로젝트 페이지 경로에서도 동작하며 새로고침 404가 없다.
- `.github/workflows/deploy.yml`이 `main` 브랜치 푸시 시 빌드 후 Pages에 자동 배포한다.
  (저장소 Settings → Pages → Source를 **GitHub Actions**로 설정해야 한다.)

## 파일 구조

```
During-Lecture/
├─ index.html                 진입 HTML (루트 div + main.tsx 로드)
├─ vite.config.ts             Vite 설정 (base './', react 플러그인)
├─ tsconfig.json              TypeScript 설정 (앱)
├─ tsconfig.node.json         TypeScript 설정 (vite 설정용)
├─ package.json               스크립트/의존성
├─ .github/workflows/deploy.yml  GitHub Pages 자동 배포 워크플로
│
├─ README.md                  (이 문서) 프로젝트와 파일 설명
├─ DESIGN.md                  디자인 토큰·원칙 기록
├─ PROCESS.md                 진행 사항 기록 (명령마다 갱신)
├─ AGENT.md                   작업 규칙 모음 (디자인/구조/문서 규칙)
│
└─ src/
   ├─ main.tsx                앱 진입점 (HashRouter로 App 렌더)
   ├─ App.tsx / App.css       루트 레이아웃 + 8개 게임 라우트 정의
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
      └─ GamePlaceholder/     /game/:id 미등록 id 폴백 안내
```

## 미니게임 목록

| 게임 | id | 점수 방식 | 비고 |
| --- | --- | --- | --- |
| 2048 | `2048` | 게임오버 시 점수(최고점 유지) | 방향키/스와이프 |
| 수박 게임 | `watermelon` | 게임오버 시 점수 | matter-js 물리 |
| 워들 | `wordle` | 적은 시도일수록 고점(최대 600) | — |
| 블랙잭 | `blackjack` | 보유 칩(최고 칩 유지) | 초기 1000칩 |
| 돌깨기 | `mine` | 세션 누적 정산 점수 | 클리커 |
| 오목 | `omok` | 난이도별 승점 | vs AI |
| 바둑 | `baduk` | 승리 시 집 차이(margin) | vs AI(웹워커) |
| 버거 타워 | `burger` | 쌓은 높이 | matter-js 물리, 좌클릭/스페이스로 낙하 |
| 두더지 잡기 | `whack` | 잡은 수(30초) | 반응 게임, 시간이 갈수록 빨라짐 |

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

- 메인 페이지 + 점수 시스템 + 미니게임 8종(2048·수박·워들·블랙잭·돌깨기·오목·바둑·버거 타워) 동작.
- 자세한 진행 내역은 `PROCESS.md` 참고.
