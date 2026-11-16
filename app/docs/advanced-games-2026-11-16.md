# 두더지 타격과 상급 사활 학습 개선

## 반영 순서

기존 픽셀 캐릭터·커버 작업을 `f9607cd`로 커밋하여 `origin/main`에 push한 뒤 이번 개선을 진행했다.

## 두더지 잡기

- `src/pages/WhackGame/assets/hammer.webp`: 투명 픽셀 나무 망치, 256×256.
- `src/pages/WhackGame/assets/mole-hit.webp`: 같은 캐릭터의 피격 표정, 320×320.
- 540ms 동안 준비 자세 → 약 95ms에 타격 → 눌림 → 반동 → 구멍으로 퇴장한다. 망치, 표정, 별 효과와 점수 표시의 시점을 맞춘다.
- 잡은 구멍은 효과가 끝날 때까지 재등장 후보에서 제외한다. 중복 클릭은 점수를 중복 지급하지 않고, 빈 구멍에도 망치 동작이 나온다.
- 종료·재시작·페이지 이동 시 타이머를 정리하며 `prefers-reduced-motion`에서는 회전·반동을 정지한다.

## 사활 학습

참고한 서비스의 학습 방식:

- [Tsumego Hero 기능 안내](https://tsumego.com/sites/websitefunctions): 문제 풀이와 변화도 학습.
- [Tsumego Hero 변경 기록](https://tsumego.com/changelog): 상대의 여러 응수에 답하는 풀이 흐름.
- [Go Game Guru 원본](https://github.com/gogameguru/go-problems): 실제로 배포되는 Hard 문제와 해설. 출처·라이선스는 [문제집 기록](../src/pages/TsumegoGame/problems/README.md)에 명시.

기존 제한 영역 탐색기는 예산이 소진된 결과도 참/거짓으로 반환하고 대상 그룹의 사활을 충분히 구분하지 못했다. 이를 제거하고 저자가 작성한 정답·반박 트리로 판정한다. 원본 난이도는 Hard이며 별도의 단급으로 과장하지 않는다.

- 140문제, 19,880개 노드, 명시된 정답 지점 921개. 원본의 돌 배치와 주석을 보존한다.
- 19×19 규칙 위에서 부분 확대/전체 보기, 수순 번호, 최근 착수와 주석 좌표를 표시한다. 터치와 방향키/Enter 착수를 지원한다.
- 응수는 420ms 뒤 표시한다. 선택한 정답 가지에서 상대의 다른 정답 응수가 있으면 해당 위치로 돌아가 이어서 풀게 한다.
- 문제 풀이, 한 수 되돌리기, 힌트, 해설 복기, 흑/백 자유 분석, 패스, SGF 다운로드를 제공한다.
- 등록되지 않은 수는 판정하지 않는다. 원본이 명시하지 않은 대안의 좋고 나쁨을 추정하지 않고 자유 분석/원본 확인을 안내한다.
- 검색·주제·미해결·해결·오답/복습·저장 필터를 제공한다. 정답을 보거나 힌트를 쓴 풀이에는 독립 해결 점수를 주지 않는다.
- 기록 키는 `during-lecture:tsumego-study:v2`. 독립 해결 횟수·최고 시간·오답·저장 상태를 보존한다. 재검토는 10분 후, 연속 독립 해결은 1·3·7·14·30일 간격으로 복습한다.
- 사활 페이지와 문제집은 React lazy로 분리하여 다른 게임 방문 시 내려받지 않는다.

원문 해설은 영어로 보존하며 풀이 안내와 학습 UI는 한국어다. 서버 계정 동기화나 범용 바둑 AI 평가는 포함하지 않는다.

## 파일 구조

- `sgf.ts`: SGF 파싱, 이스케이프, 변화도, setup 좌표 범위.
- `tsumegoStudy.ts`: 원본 검증, 변화도 재생, 진행 기록과 복습 간격.
- `tsumegoData.ts` / `problems/`: 원본 문제집 로딩.
- `TsumegoBoard.tsx`: 접근성·반응형 SVG 바둑판.
- `TsumegoGame.tsx` / `.css`: 학습 흐름과 화면.
- `tests/tsumego.test.mjs`: 전체 원본 검증, 알려진 정답·패·바둑 규칙과 기록 저장 테스트.
- `tests/games.browser.test.mjs`: 실제 풀이, 세 응수 연속 해결, 기록 복원, 힌트, 페이지 이동, 모바일·키보드, 망치·중복 클릭·재시작 테스트.

## 검증 명령

```sh
npm install
npx playwright install chromium
npm test
npm run test:browser
npm run build
```

브라우저 테스트는 자체 로컬 Vite 서버를 열고 종료한다. 테스트 데이터와 학습 기록은 격리된 브라우저 컨텍스트에만 저장된다.
