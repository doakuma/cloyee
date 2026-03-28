# Cloyee — 현재 상태

> 이 문서는 Phase/버전이 완료될 때마다, 그리고 주요 결정 후에 업데이트됩니다.
> 새로운 대화나 서브 에이전트가 프로젝트 상태를 파악하려면 이 파일을 읽으면 됩니다.

**마지막 업데이트**: 2026.03.28 | **배포 URL**: https://cloyee.vercel.app | **로컬**: http://localhost:3000

---

## Phase 진행 현황

| Phase | 내용 | 상태 | 완료율 |
|-------|------|------|--------|
| v0.1 | MVP — 카테고리/학습(chat)/코드리뷰/성장 시각화 | ✅ 완료 | 100% |
| v0.2 | 사용자 인증 + 피드백 + 어드민 패널 | 🔄 진행 중 | 75% |
| v0.3 | 교안 기반 학습 플로우 (스텝 분할 방식) | ⏳ 대기 | 0% |

---

## 현재 진행 중

v0.2 — 커스텀 카테고리 기능 (Priority 1) 계획 단계

- DB: `categories.user_id` 컬럼 이미 존재 (ALTER 완료)
- 필요: 카테고리 생성/삭제 UI, RLS 본인 카테고리 접근 정책

---

## 즉시 실행 가능한 것

- [ ] 커스텀 카테고리 — 생성/삭제 UI + RLS (v0.2 Priority 1, 난이도: 쉬움)
- [ ] URL 교재 기능 — Cheerio 크롤링으로 제목/본문 추출 (v0.2 Priority 2, 난이도: 중간)
- [ ] 학습 후 자동 퀴즈 — 세션 완료 시 5문제 자동 생성 (v0.2 Priority 3, 난이도: 중간)
- [ ] 스케줄 복습 알림 — 에빙하우스 망각곡선 기반 (v0.2 Priority 4, 난이도: 어려움)

---

## 도메인별 완료 현황

| 도메인 | 완료된 기능 | 진행 중 | 남은 것 |
|--------|------------|---------|---------|
| study | 카테고리 선택 → 학습(chat) / 코드리뷰(review) 플로우 | — | — |
| study | 소크라테스식 대화 + 이해도 점수(1~5) + 완료 감지 | — | — |
| study | 첫학습 / 복습 분기 (sessions 기록 유무 자동 판단) | — | — |
| study | 선택형 4지선다 UI (선택 강조 + 300ms 딜레이 자동 전송) | — | — |
| study | 중단 세션 복습 요약 (/api/chat/summarize) | — | — |
| study | 학습 기록 자동 저장 (sessions / reviews 테이블) | — | — |
| study | 히스토리 슬라이싱 (messages.slice(-10), chat/review 공통) | — | — |
| growth | 레벨, streak, 카테고리별 학습량 | — | — |
| growth | 완료 세션 점수 평균 저장 (CompleteBanner) | — | — |
| auth | Google OAuth 로그인 | — | — |
| auth | GitHub OAuth 로그인 | — | — |
| auth | 이메일+비밀번호 로그인/회원가입 자동 분기 | — | — |
| auth | Magic Link (token_hash 방식, 크로스 브라우저 대응) | — | — |
| auth | 게스트 모드 (user_id = NULL, 데이터 미저장) | — | — |
| auth | RLS 정책 (categories/sessions/reviews user_id 기반) | — | — |
| category | — | 커스텀 카테고리 UI + RLS | — |
| feedback | Feedback 이미지 업로드 (Supabase Storage, 최대 3장/5MB) | — | — |
| feedback | FeedbackButton 모달 UI 개선 (글자수 카운터, 책갈피 스타일) | — | — |
| admin | /admin/users — 사용자 목록 + is_admin 토글 | — | — |
| admin | /admin/categories — 기본/커스텀 카테고리 관리 | — | — |
| admin | /admin/feedback — 피드백 조회 및 삭제 | — | — |
| admin | Sidebar Admin 탭 (is_admin=true일 때만 표시) | — | — |
| shared | SessionCard (showMenu prop으로 dashboard/history 분기) | — | — |
| shared | SSE 스트리밍 (실시간 타이핑 효과, ThinkingBubble 제거) | — | — |
| shared | 모바일 전수 검증 (14개 이슈 해결) | — | — |

---

## 블로커

없음

---

## 알려진 이슈

| # | 도메인 | 내용 | 우선순위 |
|---|--------|------|---------|
| 1 | auth | 게스트 데이터 노출 — user_id IS NULL 데이터 누구나 조회 가능 | Major |
| 2 | shared | Review 탭바 overflow 가능성 (iOS 관성 스크롤) | Minor |
| 3 | shared | RSC prefetch 503 (Vercel cold start 간헐적) | Minor |
| 4 | study | 복습 후 세션 완료 시나리오 미검증 (is_complete 재진입) | Major |
| 5 | study | 교안 진행률 미구현 (v0.3 스텝 분할 방식으로 해결 예정) | — |

---

## 핵심 기술 결정사항

| 항목 | 값 | 이유 |
|------|-----|------|
| AI 모델 | claude-haiku-4-5 (개발) → claude-sonnet-4-6 (프로덕션) | 개발 속도 vs 품질 |
| 스트리밍 | SSE (text/event-stream) | 실시간 타이핑 효과, Next.js 기본 지원 |
| 인증 | Supabase Auth (Google/GitHub/Magic Link) | RLS 통합, 크로스 브라우저 |
| DB | Supabase (PostgreSQL) + RLS | 보안 + 멀티유저 격리 |
| 배포 | Vercel + GitHub CI/CD | 자동 배포 |
| Magic Link | token_hash 방식 | PKCE 크로스 브라우저 문제 회피 |
| sessionStorage 키 | cloyee_chat_{roadmapId\|categoryId} | 로드맵별 독립 저장 |

> 상세한 기술 결정 로그는 `docs/decisions.md` 참고
