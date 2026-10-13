<h1 align="center">
  <a href="https://05solar.github.io/during-lecture/">▶ 미니게임 아케이드 — 지금 플레이하기</a>
</h1>

<p align="center">
  <a href="https://05solar.github.io/during-lecture/"><strong>https://05solar.github.io/during-lecture/</strong></a>
</p>

<p align="center">
  <a href="https://05solar.github.io/during-lecture/">
    <img src="./screenshot.webp" alt="미니게임 아케이드 메인 화면" width="900">
  </a>
</p>

## 소개

브라우저에서 **설치 없이 바로 즐기는 개인용 미니게임 모음** 사이트입니다.
맑은 화이트 톤의 아케이드 화면에서 원하는 게임을 골라 플레이하고, 게임마다 최고 점수가 기록됩니다.

- **9종 게임** — 2048 · 수박 게임 · 워들 · 블랙잭 · 돌깨기 · 오목(vs AI) · 바둑(vs AI) · 버거 타워 · 두더지 잡기
- **장르 필터** — 전체 / 퍼즐 / 아케이드 / 카드 / 보드 로 바로 추려서 선택
- **점수 기록** — 게임별 최고 점수가 이 브라우저(localStorage)에 저장되어 카드와 게임 화면에 표시됩니다
- **무설치 · 반응형** — 데스크톱과 모바일 모두 지원, 서버 없이 동작하는 정적 사이트

## 기술 / 배포

- React 18 + TypeScript + Vite 로 만든 정적 사이트, **GitHub Pages** 자동 배포(`.github/workflows/deploy.yml`)
- 프로젝트 소스와 상세 문서는 전부 [`app/`](./app) 폴더 안에 있습니다
  - 개발/빌드 방법, 파일 구조, 게임 목록: [`app/README.md`](./app/README.md)
  - 디자인 원칙: [`app/DESIGN.md`](./app/DESIGN.md) · 작업 규칙: [`app/AGENT.md`](./app/AGENT.md) · 진행 기록: [`app/PROCESS.md`](./app/PROCESS.md)

```bash
cd app
npm install
npm run dev      # 로컬 개발 서버
npm run build    # 프로덕션 빌드 → app/dist
```
