# Cloyee 프로젝트

## Package Manager

- 이 프로젝트는 pnpm을 사용합니다
- npm install 대신 pnpm add 사용
- npm install -D 대신 pnpm add -D 사용
- npx 대신 pnpm dlx 사용
- npm run 대신 pnpm 사용

## 기술 스택

- Framework: Next.js (App Router)
- Styling: Tailwind CSS + shadcn/ui
- AI: Claude API (Next.js API Route 경유)
- DB: Supabase
- 배포: Vercel

## 코드 규칙

- 컴포넌트 파일명은 PascalCase 사용
- 함수형 컴포넌트만 사용
- JavaScript 사용 (TypeScript 사용 안 함)

---

## 멀티 에이전트 명령어

### /multi-agent

아래 순서로 4개 에이전트를 순서대로 실행해줘:

1. **검증 에이전트**: 전체 코드베이스를 검토하고 버그, 개선점, 누락된 기능을 Critical/Major/Minor로 분류해서 리스트업해줘
2. **기획 에이전트**: 검증 결과를 바탕으로 P0/P1/P2/P3 우선순위를 확정해줘
3. **개발 에이전트**: P0 항목을 전부 코드로 구현해줘
4. **디자인 에이전트**: P1-P2 항목 중 UI/UX 개선사항을 찾아서 적용해줘

각 에이전트는 이전 에이전트의 결과를 받아서 작업해줘.

---

## 단일 명령어

### /fix

에러 메시지를 분석하고 원인을 파악한 뒤 수정해줘.
수정 후 동일한 패턴의 버그가 다른 파일에도 있는지 확인해줘.

### /review

현재 작업한 코드를 리뷰해줘.

- 버그 가능성
- 성능 이슈
- 코드 가독성
- 빠진 예외 처리
  항목별로 정리해줘.

### /deploy-check

배포 전 아래 항목을 체크해줘:

- 환경변수 누락 여부 (.env.local 기준)
- console.log 미제거 여부
- 하드코딩된 URL/값 여부
- 에러 처리 누락 여부
- Supabase 쿼리 오류 가능성
  문제 있으면 수정까지 해줘.

### /optimize

현재 코드에서 성능 개선 가능한 부분을 찾아줘:

- 불필요한 리렌더링
- API 중복 호출
- 무거운 연산 useMemo/useCallback 처리
- 이미지/폰트 최적화
  우선순위 높은 것부터 적용해줘.

### /document

현재 코드를 분석해서 아래 내용을 문서로 정리해줘:

- 주요 컴포넌트 설명
- API Route 입출력 명세
- DB 스키마 현황
- 알려진 이슈 및 TODO
