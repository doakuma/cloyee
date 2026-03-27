# Cloyee 프로젝트 컨텍스트

## 📍 현재 상태

- **버전**: v0.2 진행 중
- **배포 URL**: https://cloyee.vercel.app
- **로컬**: http://localhost:3000
- **마지막 작업**: Feedback 이미지 업로드 기능 완료 (2026.03.27)
- **다음 작업**: v0.2 — URL 교재 기능 (Priority 2)

---

## ✅ 완료된 것 (v0.1 + v0.2 인증)

### 핵심 기능

- 카테고리 선택 → 학습 대화(chat) / 코드 리뷰(review) 플로우
- 소크라테스식 대화 + 이해도 점수 + 완료 감지 (is_complete)
- 학습 기록 자동 저장 (sessions / reviews 테이블)
- 성장 시각화 (레벨, streak, 카테고리별 학습량)

### 이슈 해결

- 이슈 14건 전부 해결
- 모바일 전수 검증 완료 (10건 수정 — 터치 영역, safe-area, 반응형 그리드 등)

### 기술 개선

- AI 모델 → claude-haiku-4-5 (개발/테스트용 저비용)
- SSE 스트리밍 적용 (타이핑 효과, ThinkingBubble → 실시간 청크 출력)
- 로딩바 제거 (스트리밍으로 불필요)
- 채팅 헤더 sticky 고정
- sessions insert 버그 수정 (category_id UUID 오류)
- 대시보드 중단된 학습 표시 정상화

### 사용자 인증 (v0.2 Priority 1 완료)

- 랜딩페이지 (`/`) — 미로그인 전용, 로그인 시 /dashboard 리다이렉트
- 기존 홈 → `/dashboard`로 분리
- **Google OAuth** 로그인 (프로덕션 앱 게시 완료)
- **GitHub OAuth** 로그인 (InstructorCloyee 앱, callback URL 수정 완료)
- **이메일+비밀번호** 로그인/회원가입 자동 분기
- **Magic Link** (이메일 링크, token_hash 방식 — 크로스 브라우저 대응)
- **게스트 모드** 허용 (데이터 미저장, user_id = NULL)
- Supabase Auth 설정: Google ✅ GitHub ✅
- Magic Link 이메일 템플릿 커스텀 완료
- `src/app/login/page.jsx` — 탭 UI (소셜 / 이메일 / 링크)
- `src/middleware.js` — `/my`만 로그인 필수, 나머지 게스트 허용
- `src/app/auth/callback/route.js` — code(OAuth) + token_hash(Magic Link) 모두 처리
- Sidebar: 로그아웃 버튼 + 게스트 모드 UI ("로그인하고 저장하기" 버튼)
- 모바일 탭바: 로그인/로그아웃 버튼 추가

### DB 변경사항 (인증 추가)

```sql
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

### RLS 정책

- categories: user_id IS NULL (기본 카테고리) 또는 본인 것만 접근
- sessions: 본인 user_id 또는 NULL (게스트) 허용
- reviews: 본인 user_id 또는 NULL (게스트) 허용

### Feedback 이미지 업로드 (v0.2 Priority 2 완료 2026.03.27)

- FeedbackButton 모달에서 이미지 첨부 기능 추가
- 이미지 선택: 최대 3장, 5MB 이하 제한
- 미리보기 표시 + 개별 제거 기능
- Supabase Storage 업로드 (`feedback-images` bucket)
- feedback 테이블 `images` 컬럼에 URL 배열 저장
- 파일명 자동 생성 (user_id/timestamp_random.ext)

### UX 개선 + 리팩토링 (2026.03.22)

- UX 휴리스틱 평가 (Nielsen 10) — 이슈 7건 발견, 5건 수정
  - 게스트 NULL 세션 노출 차단 (dashboard, history)
  - 게스트 /study/new 접근 차단 + 로그인 유도 모달
  - 랜딩 CTA 게스트 링크 추가
  - /history 탭 제거, 완료 세션만 표시
- 히스토리 슬라이싱 — `messages.slice(-10)` 적용 (chat/review route 모두)
- 대시보드 "최근 학습" 카드 레이아웃 개선 (flat card 스타일, neutral 뱃지)
- `SessionCard` 공통 컴포넌트 추출 (`src/components/common/SessionCard.jsx`)
  - `showMenu` prop으로 dashboard(읽기 전용) / history(편집+삭제) 분기
- 중단 세션 복습 요약 — `/api/chat/summarize` 라우트 추가
  - "오늘은 여기까지" 클릭 시 Claude가 2~3문장 요약 생성 → `sessions.summary` 저장
  - 다음 방문 "복습하기" 클릭 시 요약 표시

### 학습 플로우 재설계 (2026.03.17)

- 첫학습 / 이어서(복습 or 바로) 진입 분기 — sessions 기록 유무 자동 판단
- 방식 선택 UI — 대화형 / 선택형
- 선택형 4지선다 — 선택 강조 + 나머지 흐려짐(opacity 0.35) + 300ms 딜레이 후 자동 전송
- 문항 카운트 진도율 — "N문항 학습 중" (1문항 이상일 때만, 학습 중에만 표시)
- score 분리 — 학습 중 완전 숨김, 완료 시 assistant 메시지 평균으로 sessions.score 저장
- CompleteBanner — "오늘의 이해도 N점" 완료 시에만 공개
- API extra 필드 전송 버그 수정 — messages를 map({ role, content })로 필터링
- sessionStorage 키 분리 — cloyee*chat*{roadmapId|categoryId}로 로드맵별 독립
- lastSession 조회 is_complete 필터 제거 — 중단 세션도 복습 분기 진입
- 복습 요약 카드 — roadmaps.topic 우선 표시, score=0이면 "이해도 기록 없음"
- 대시보드 이어하기 섹션 완전 제거
- 로드맵 카드 상태 뱃지 — ⚪시작 전 / 🟡진행 중 / ✅완료 + 경과 시간
- 최근 학습(대시보드) / 기록 페이지 — is_complete=true 완료 세션만 표시
- 이어하기 카드, 복습 인사 메시지 — roadmaps.topic 우선 표시 통일

---

## 📋 다음 작업 목록

### v0.2 남은 것

| 우선순위   | 기능                                   | 난이도 |
| ---------- | -------------------------------------- | ------ |
| Priority 1 | 커스텀 카테고리 — DB user_id 컬럼 + UI | 쉬움   |
| Priority 2 | ✅ Feedback 이미지 업로드 (완료)       | —      |
| Priority 3 | URL 교재 기능 — Cheerio 크롤링         | 중간   |
| Priority 4 | 학습 후 자동 퀴즈                      | 중간   |
| Priority 5 | 스케줄 복습 알림 — 에빙하우스 망각곡선 | 어려움 |

### v0.3 예정

| 우선순위        | 기능                                        | 난이도 |
| --------------- | ------------------------------------------- | ------ |
| v0.3 Priority 1 | 교안 기반 학습 플로우 (스텝 분할 방식)      | 어려움 |
| v0.3 Priority 2 | URL/교재 업로드 기반 교안 (B안)             | 중간   |

---

## 🔑 주요 기술 결정사항

- **AI 모델**: claude-haiku-4-5 (개발/테스트) → 프로덕션 전 claude-sonnet-4-6 교체 예정
- **스트리밍**: SSE 방식 (text/event-stream), DONE 이벤트로 메타데이터 전송
- **category_id**: URL 파라미터의 roadmap?.category_id 사용 (category state 직접 사용 금지 — UUID 아님)
- **reactStrictMode**: false (useEffect 이중 호출 방지 목적)
- **reviews.code**: NOT NULL 제약 해제 상태
- **대화 임시 저장**: sessionStorage 사용 중 (새로고침 시 복원)
- **Magic Link**: token_hash 방식 사용 (PKCE 방식은 크로스 브라우저 문제 발생)
- **게스트 데이터**: user_id = NULL 허용 (추후 익명 auth로 개선 고려)
- **학습 진도율**: 문항 수 기반 (N문항 학습 중), score는 완료 시에만 평균 저장
- **sessionStorage 키**: cloyee*chat*{roadmapId|categoryId} (로드맵별 독립)
- **API messages 필터링**: map(({ role, content }) => ...) 로 extra 필드 제거 필수
- **히스토리 슬라이싱**: messages.slice(-10) — 최근 10턴만 Claude API 전송 (chat/review 공통)
- **중단 세션 요약**: pauseSession() → /api/chat/summarize 호출 → sessions.summary 저장 (실패 시 null)
- **SessionCard**: 공통 컴포넌트 (`src/components/common/SessionCard.jsx`), showMenu prop으로 분기

---

## 🔭 On the Horizon

### 교안 방식 (v0.3 재설계 예정)

- 챕터를 난이도별 N개 스텝으로 분할하는 방식 확정 예정
  - 초급: 10스텝 / 중급: 15~20스텝 / 고급: 20~30스텝
- 진행률은 현재 스텝 / 전체 스텝으로 자연스럽게 계산
- 목차 생성 2단계 필요 (챕터 목록 → 챕터별 스텝 목록)
- DB 구조: roadmaps.chapters JSONB 안에 steps 배열 추가 예정
- 챕터 완료 기준: AI가 is_chapter_complete 반환 시에만
- 미완료 챕터 이동: 경고 후 허용
- 진행률 표시: 채팅창 상단 프로그레스 바 (3px)
- roadmaps.chapters 컬럼은 DB에 유지 중 (v0.3 재사용 예정)

### v0.2에서 시도 후 revert한 것

- /api/curriculum/generate 라우트
- CurriculumPanel.jsx (목차 사이드 패널)
- 챕터 인디케이터, 프로그레스 바, "다음 챕터로" 버튼
- is_chapter_complete, chapter_progress DONE 이벤트 필드

---

## ⚠️ 알려진 제약사항 및 기술 부채

| 항목                          | 내용                                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| 게스트 데이터 노출            | user_id IS NULL 데이터는 RLS 정책상 누구나 조회 가능                |
| 모바일 P3 미해결              | Review 탭바 overflow 가능성, iOS 관성 스크롤                        |
| RSC prefetch 503              | Vercel cold start 간헐적 발생, 실사용 영향 없음                     |
| 복습 후 세션 완료 시나리오    | is_complete=true 저장 후 복습 분기 재진입 미검증                    |
| 교안 진행률 미구현            | v0.3 스텝 분할 방식으로 해결 예정                                   |

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
| Magic Link 만료시간 | 낮음 | Supabase 기본값 | 정기적으로 Supabase 정책 확인 필요 |
| Rate Limiting | 낮음 | 미구현 | Claude API 일일 한도 설정 고려 (API key 비용 관리) |
| Admin 권한 탈취 | 높음 | is_admin 계정 탈취 시 전체 DB 유출 | 어드민 계정 정기적 모니터링 필요 |
| 마크다운 렌더링 | 낮음 | Claude 응답 출력 시 | 렌더링 라이브러리 XSS 방지 확인 필수 |

### 정기 확인 항목 🔄

```bash
# 의존성 취약점 스캔
pnpm audit

# 환경변수 확인 (배포 전)
# 1. .env.local이 .gitignore에 있는가?
# 2. console.log 제거했는가?
# 3. 하드코딩된 API key/URL이 있는가?
```

---

## 🗄️ DB 테이블 구조 (Supabase)

- **categories**: id, name, icon, is_default, user_id, created_at
- **sessions**: id, category_id, user_id, title, mode(chat/review), summary, score, duration, created_at
- **reviews**: id, session_id, user_id, code, good_points, improve_points, messages(jsonb), created_at
- **feedback**: id, user_id, category(bug/suggestion/other), content, images(text[]), created_at

**Supabase 프로젝트**: InstructorCloyee (fycowopnxqjkpyjarwul)

---

## 기술 스택

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Claude API (claude-haiku-4-5, Next.js API Route 경유, SSE 스트리밍)
- **DB**: Supabase (PostgreSQL) + RLS 활성화
- **Auth**: Supabase Auth (Google / GitHub / 이메일 / Magic Link)
- **배포**: Vercel + GitHub 자동 CI/CD
- **패키지 매니저**: pnpm만 사용 (npm/yarn 금지)

## 코드 규칙

- 컴포넌트 파일명은 PascalCase 사용
- 함수형 컴포넌트만 사용
- JavaScript 사용 (TypeScript 사용 안 함)

## 🔐 어드민 정책

**어드민 식별**:
- `profiles.is_admin = true` 컬럼으로 어드민 여부 판단
- 수동으로 DB에서 `UPDATE profiles SET is_admin = true WHERE id = '...'` 로 설정

**어드민 패널** (`/admin/*`):
- **접근 제어**: 로그인 필수 + `is_admin = true` 필수 (middleware.js + admin/layout.jsx)
- **페이지**:
  - `/admin/users` — 사용자 목록, is_admin 토글
  - `/admin/categories` — 기본/커스텀 카테고리 관리
  - `/admin/feedback` — 피드백 조회 및 삭제
  - `/admin/docs` — 관리자 문서 (마크다운 업로드/편집)

**UI**:
- Sidebar 네비게이션에 **Admin 탭** 추가 (is_admin=true일 때만)
  - Shield 아이콘 + "관리자" 레이블
  - 데스크톱(md) 이상에서 표시

**기술 세부사항**:
- admin/layout.jsx: `is_admin` 체크 후 redirect("/dashboard") (권한 없을 시)
- 어드민이 볼 수 있는 데이터: 모든 사용자/카테고리/피드백 (RLS 정책과 무관하게, 별도 관리자 쿼리)

## 프로젝트 경로

`C:\Private\2026\withCloyee\01 grabWithCloyee\cloyee\`

---

## 핸드오프 형식

작업 완료 후 새 대화 시작 시 아래 형식 사용:

```
Cloyee 프로젝트 이어서 진행해줘.

### 오늘 완료한 것
- (완료 항목)

### 지금 할 것
- (다음 작업 내용)
- 관련 파일: (파일 경로)

### 참고 사항
- (특이사항이나 주의점)
```

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
- AI 모델이 프로덕션용(claude-sonnet-4-6)으로 설정됐는지
  문제 있으면 수정까지 해줘.

### /optimize

현재 코드에서 성능 개선 가능한 부분을 찾아줘:

- 불필요한 리렌더링
- API 중복 호출
- 무거운 연산 useMemo/useCallback 처리
- 이미지/폰트 최적화
  우선순위 높은 것부터 적용해줘.

### /status

현재 프로젝트 상태를 요약해줘:

- 현재 버전 및 완료된 기능
- 다음 작업 우선순위
- 알려진 이슈
  CLAUDE.md의 📍 현재 상태 섹션 기준으로 정리해줘.
