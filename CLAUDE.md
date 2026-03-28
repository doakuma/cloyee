# Cloyee 프로젝트 컨텍스트

## 🚀 작업 시작 전 체크리스트

> 모든 작업 시작 전에 반드시 이 순서를 따르세요.

1. `docs/state.md` 를 읽어 현재 Phase와 상태를 파악하세요.
2. 어느 도메인의 작업인지 확인하세요. (`study / auth / growth / category / feedback / admin / shared`)
3. `tasks/active/` 폴더에 실행 중인 계획서가 있는지 확인하세요.
4. 계획서가 없으면 `/plan` 커맨드로 먼저 계획을 수립하세요. 계획서 없이 바로 구현하지 마세요.
5. 계획서가 있으면 `/execute` 커맨드로 실행하세요.
6. 구현 완료 후 아래 **작업 완료 체크리스트**를 순서대로 수행하세요.

## ✅ 작업 완료 체크리스트

> 구현이 끝났다고 바로 커밋하지 마세요. 아래 순서를 반드시 지키세요.

1. `docs/state.md` — 도메인별 완료 현황에 완료된 기능을 추가하세요.
2. `docs/state.md` — Phase 진행 현황의 완료율을 업데이트하세요.
3. 태스크 파일을 `tasks/active/phase-N/` → `tasks/completed/phase-N/`으로 이동하세요.
4. 커밋 메시지 형식: `feat([도메인]): 설명` (예: `feat(study): 커스텀 카테고리 생성 UI`)
5. `/verify` 커맨드로 최종 검증하세요.

## 📂 문서 구조

- `docs/state.md` — 현재 상태 (Phase 완료마다 업데이트, **가장 먼저 읽을 것**)
- `docs/project.md` — 서비스 정의, 기술 스택, 컨벤션 (거의 변하지 않음)
- `docs/requirements.md` — 기능 요구사항 MoSCoW
- `docs/decisions.md` — 기술 결정 로그 (ADR)
- `tasks/active/phase-N/` — 현재 실행 중인 계획서
- `tasks/completed/phase-N/` — 완료된 계획서

---

## 🔑 주요 기술 결정사항 (gotcha)

> 자주 실수하는 것들. 코드 작성 전 반드시 확인하세요.

- **AI 모델**: claude-haiku-4-5 (개발/테스트) → 프로덕션 전 claude-sonnet-4-6 교체 예정
- **스트리밍**: SSE 방식 (text/event-stream), DONE 이벤트로 메타데이터 전송
- **category_id**: URL 파라미터의 `roadmap?.category_id` 사용 — category state 직접 사용 금지 (UUID 아님)
- **reactStrictMode**: false (useEffect 이중 호출 방지 목적)
- **reviews.code**: NOT NULL 제약 해제 상태
- **대화 임시 저장**: sessionStorage 사용 중 (새로고침 시 복원)
- **Magic Link**: token_hash 방식 사용 (PKCE 방식은 크로스 브라우저 문제 발생)
- **게스트 데이터**: user_id = NULL 허용 (추후 익명 auth로 개선 고려)
- **학습 진도율**: 문항 수 기반 (N문항 학습 중), score는 완료 시에만 평균 저장
- **sessionStorage 키**: `cloyee_chat_{roadmapId|categoryId}` (로드맵별 독립)
- **API messages 필터링**: `map(({ role, content }) => ...)` 로 extra 필드 제거 필수
- **히스토리 슬라이싱**: `messages.slice(-10)` — 최근 10턴만 Claude API 전송 (chat/review 공통)
- **중단 세션 요약**: `pauseSession()` → `/api/chat/summarize` 호출 → `sessions.summary` 저장 (실패 시 null)
- **SessionCard**: 공통 컴포넌트 (`src/components/common/SessionCard.jsx`), showMenu prop으로 분기

---

## 🔭 v0.3 예정 (On the Horizon)

### 교안 방식 (v0.3 재설계 예정)

- 챕터를 난이도별 N개 스텝으로 분할하는 방식 확정 예정
  - 초급: 10스텝 / 중급: 15~20스텝 / 고급: 20~30스텝
- DB 구조: `roadmaps.chapters` JSONB 안에 steps 배열 추가 예정
- 챕터 완료 기준: AI가 is_chapter_complete 반환 시에만
- 진행률 표시: 채팅창 상단 프로그레스 바 (3px)
- `roadmaps.chapters` 컬럼은 DB에 유지 중 (v0.3 재사용 예정)

### v0.2에서 시도 후 revert한 것

- `/api/curriculum/generate` 라우트
- `CurriculumPanel.jsx` (목차 사이드 패널)
- 챕터 인디케이터, 프로그레스 바, "다음 챕터로" 버튼
- `is_chapter_complete`, `chapter_progress` DONE 이벤트 필드

---

## 🔒 보안 체크리스트

### 구현 완료 항목 ✅

| 항목 | 상태 | 상세 |
|------|------|------|
| 환경변수 노출 | ✅ 안전 | `.env.local` git ignore, 클라이언트에서 API key 미사용 |
| RLS 정책 | ✅ 구현 | categories/sessions/reviews user_id 기반 접근 제어 |
| CSRF 방지 | ✅ 안전 | Next.js App Router 기본 지원 |
| XSS 방지 | ✅ 안전 | React JSX 기본 escape (dangerouslySetInnerHTML 미사용) |
| 파일 업로드 | ✅ 부분 | 클라이언트: 크기(5MB) + 타입(image/*) 검증, Supabase Storage 격리 |
| Magic Link 인증 | ✅ 안전 | token_hash 방식 사용 (PKCE보다 안전) |
| Admin 접근 제어 | ✅ 구현 | is_admin 플래그 + middleware 검증 |

### 주의할 항목 ⚠️

| 항목 | 위험도 | 현황 | 액션 |
|------|--------|------|------|
| 게스트 데이터 노출 | 중간 | NULL user_id 데이터 누구나 조회 가능 | 데이터는 localStorage만 저장 권장 |
| 파일 업로드 서버 검증 | 낮음 | 클라이언트만 검증 중 | API 라우트에서 파일 타입 재검증 추가 권장 |
| Rate Limiting | 낮음 | 미구현 | Claude API 일일 한도 설정 고려 |
| Admin 권한 탈취 | 높음 | is_admin 계정 탈취 시 전체 DB 유출 | 어드민 계정 정기적 모니터링 필요 |

### 정기 확인 항목 🔄

```bash
pnpm audit  # 의존성 취약점 스캔
# 배포 전: .env.local gitignore 확인 / console.log 제거 / 하드코딩 URL 확인
```

---

## 🔐 어드민 정책

**어드민 식별**: `profiles.is_admin = true`
```sql
UPDATE profiles SET is_admin = true WHERE id = '...';
```

**어드민 패널** (`/admin/*`):
- 접근 제어: 로그인 필수 + `is_admin = true` (middleware.js + admin/layout.jsx)
- `/admin/users` — 사용자 목록, is_admin 토글
- `/admin/categories` — 기본/커스텀 카테고리 관리
- `/admin/feedback` — 피드백 조회 및 삭제
- `/admin/docs` — 관리자 문서 (마크다운 업로드/편집)

**UI**: Sidebar Admin 탭 (is_admin=true일 때만, Shield 아이콘, 데스크톱 md 이상에서 표시)

---

## 기술 스택 / 코드 규칙

> 상세 내용은 `docs/project.md` 참고

- **Framework**: Next.js (App Router) | **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Claude API (SSE 스트리밍) | **DB**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth | **배포**: Vercel + GitHub CI/CD
- **패키지 매니저**: pnpm만 사용 (npm/yarn 금지)
- 컴포넌트 파일명 PascalCase | 함수형 컴포넌트만 | JavaScript (TypeScript 미사용)

**프로젝트 경로**: `C:\Private\2026\withCloyee\01 grabWithCloyee\cloyee\`

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
- 버그 가능성 / 성능 이슈 / 코드 가독성 / 빠진 예외 처리
항목별로 정리해줘.

### /deploy-check

배포 전 아래 항목을 체크해줘:
- 환경변수 누락 여부 (.env.local 기준)
- console.log 미제거 여부
- 하드코딩된 URL/값 여부
- 에러 처리 누락 여부
- Supabase 쿼리 오류 가능성
- AI 모델이 프로덕션용(claude-sonnet-4-6)으로 설정됐는지
문제 있으면 수정까지 해줘.

### /optimize

현재 코드에서 성능 개선 가능한 부분을 찾아줘:
- 불필요한 리렌더링 / API 중복 호출 / 무거운 연산 useMemo/useCallback 처리 / 이미지/폰트 최적화
우선순위 높은 것부터 적용해줘.

### /status

현재 프로젝트 상태를 요약해줘:
- `docs/state.md` 기준으로 현재 버전, 완료된 기능, 다음 작업 우선순위, 알려진 이슈를 정리해줘.
