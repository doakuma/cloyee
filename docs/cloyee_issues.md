# Cloyee 이슈 트래커

> 최종 업데이트: 2026.03.24 | 버전: v0.2

---

## ✅ 해결 완료 — v0.1

| # | 이슈 | 원인 | 해결 |
|---|------|------|------|
| 1 | API 502 에러 | 존재하지 않는 모델 ID | claude-sonnet-4-6으로 변경 |
| 2 | API 크레딧 에러 | .env.local API 키 불일치 | 새 API 키 발급 후 교체 |
| 3 | 카테고리 하드코딩 | Supabase 미연동 | categories 테이블 동적 조회 |
| 4 | JSON 파싱 실패 | Claude가 ```json 코드블록으로 응답 | 코드블록 제거 파싱 로직 추가 |
| 5 | 대화 새로고침 휘발 | React state 초기화 | sessionStorage 임시 저장 |
| 6 | reviews 테이블 messages 컬럼 없음 | 마이그레이션 누락 | ALTER TABLE reviews ADD COLUMN messages jsonb |
| 7 | reviews insert 실패 | code 컬럼 NOT NULL 제약 | ALTER TABLE reviews ALTER COLUMN code DROP NOT NULL |
| 8 | 이어하기 대화 복원 안 됨 | reviews에 messages 미저장 | 이슈 #7 해결로 함께 해결 |
| 9 | useEffect 이중 호출 | React StrictMode | next.config.js reactStrictMode: false |
| 10 | 간헐적 502 에러 | Claude API 응답 JSON 파싱 실패 | fallback 이미 적용되어 있었음 |
| 11 | 헤더 category UUID 노출 | category_id를 그대로 표시 | categoryName state + Supabase categories 조회 |
| 12 | 이어하기 세션 누적 | 테스트용 미완료 세션이 홈에 계속 쌓임 | 오래된 세션 자동 정리 완료 |
| 13 | 점수 0점 표시 | 첫 메시지 교환 후 점수가 0점으로 유지 | 점수 업데이트 타이밍 개선 |
| 14 | 학습 완료 플로우 미검증 | is_complete: true 저장 + summary 생성 + /history 이동 | 전체 플로우 검증 완료 |

---

## ✅ 해결 완료 — v0.2

| # | 이슈 | 원인 | 해결 |
|---|------|------|------|
| 15 | /study 카테고리 비개인화 | user_id 미연동 | categories 쿼리에 user_id 필터 추가 |
| 16 | GitHub OAuth Invalid Redirect URI | callback URL이 예시 URL 그대로 | Authorization callback URL → Supabase URL로 수정 |
| 17 | Magic Link 크로스 브라우저 실패 | PKCE 방식 사용 | token_hash 방식으로 전환, auth/callback route 수정 |
| 18 | sessions insert UUID 오류 | category_id가 UUID 아닌 값 사용 | roadmap?.category_id 사용으로 통일 |
| 19 | API messages에 extra 필드 전송 | score/feedback/isDone 포함된 채 전송 | messages.map(({ role, content }) => ...) 필터링 |
| 20 | ChoiceButtons 완료 후 /history 미이동 | choices && is_complete 동시 수신 시 이동 로직 누락 | is_complete 우선 처리로 수정 |
| 21 | 모바일 터치 영역 협소 | 버튼/링크 크기 부족 | 전수 검증 후 10건 수정 (safe-area, 반응형 등) |
| 22 | 대시보드 중단된 학습 표시 오류 | is_complete 필터 미적용 | is_complete=true 완료 세션만 표시 |
| 23 | sessionStorage 키 충돌 | 로드맵별 구분 없이 단일 키 사용 | `cloyee_chat_{roadmapId\|categoryId}` 분리 |
| 24 | 복습 요약에 category.name 표시 | roadmaps.topic 우선순위 낮음 | roadmaps.topic 우선 표시로 통일 |
| 25 | 히스토리 토큰 누적 | messages 전체 전송으로 비용 선형 증가 | chat/review route.js — slice(-10)으로 최근 10턴만 전송 |
| 26 | 어드민 피드백 목록 미표시 | 서버 컴포넌트에서 클라이언트 supabase 사용 | createServerClient (@supabase/ssr) 직접 사용으로 교체 |
| 27 | 인앱 브라우저 소셜 로그인 차단 | 카카오톡/인스타 등 인앱 브라우저에서 OAuth 팝업 차단 | useInAppBrowser 훅 추가, iOS 자동 Magic Link 전환, Android Chrome Intent URL |

---

## 🔴 미해결 — 알려진 기술 부채

| # | 항목 | 내용 | 우선순위 |
|---|------|------|----------|
| T1 | 게스트 데이터 보안 | user_id IS NULL 데이터는 RLS 상 누구나 조회 가능 | P2 |
| T3 | AI 모델 개발/프로덕션 불일치 | claude-haiku-4-5 상태, 배포 전 claude-sonnet-4-6 교체 필요 | P1 (배포 전) |
| T4 | RSC prefetch 503 | Vercel cold start 간헐적 발생 (실사용 영향 없음) | P3 |
| T5 | 복습 후 재진입 미검증 | is_complete=true 저장 후 복습 분기 재진입 시나리오 미검증 | P2 |
| T6 | 교안 진행률 미구현 | v0.3 스텝 분할 방식으로 해결 예정 | v0.3 |
| T7 | IncompleteSessions 컴포넌트 미사용 | 대시보드 이어하기 제거 후 컴포넌트만 남음, 정리 필요 | P3 |
| T8 | /growth streak 불일치 | 오늘 학습해도 streak 0 표시 가능, 시각과 수치 불일치 | P2 |
| T9 | 모바일 탭바 일관성 | 게스트/로그인 전환 시 탭바 항목 변화 검증 필요 | P3 |

---

## 🟡 UI/UX 개선 필요 — 상태 표시 중복 문제 (2026.03.22)

### 문제 요약

`sessions.is_complete`와 `roadmaps.status`가 여러 페이지에서 중복 표시되는 구조.

| # | 위치 | 현재 문제 |
|---|------|-----------|
| U1 | 대시보드 학습 시작하기 | active 로드맵 전체 표시 → 완료된 카드와 미완료 카드 혼재 |
| U2 | 대시보드 최근 학습 | 완료 세션 카드에 완료 여부 뱃지 없음 |
| U3 | 학습 페이지 `/study` | 로드맵 카드에 완료 여부 표시 없음 |
| U4 | 기록 페이지 `/history` | ✅ 해결 완료 (Fix 5) — /history 탭 제거, 완료 세션만 표시 |

### 수정 방향

**U1 — 대시보드 학습 시작하기**
- 완료된 로드맵(최근 세션 `is_complete=true`) 카드 제거
- 시작 전(⚪) + 진행 중(🟡)만 표시

**U2 — 대시보드 최근 학습**
- 세션 카드에 완료 뱃지(✅) + 모드(대화/리뷰) 뱃지 추가

**U3 — 학습 페이지 `/study`**
- 완료된 로드맵 메인 그리드에서 제거 (기록 페이지에서 확인)

**U4 — 기록 페이지 `/history`**
- "완료/학습 중" 탭 제거, 완료 세션만 표시
- `SessionCard`의 "🟡 학습 중" 뱃지 + "이어서 학습하기" 링크 제거

### 수정 후 역할 분담

| 페이지 | 역할 |
|--------|------|
| 대시보드 | 미완료 로드맵 + 최근 완료 기록 3개 (상태 뱃지 포함) |
| 학습 페이지 | 진행 중 / 시작 전 로드맵만 |
| 기록 페이지 | 완료된 세션 전체 목록 (탭 없이 단순화) |

---

## 📋 다음 단계 (v0.2 남은 것)

| 우선순위 | 기능 | 난이도 | 비고 |
|----------|------|--------|------|
| ~~P1~~ | ~~커스텀 카테고리 UI~~ | ~~쉬움~~ | ✅ 완료 (2026.03.23) |
| P2 | URL 교재 기능 (Cheerio 크롤링) | 중간 | |
| P3 | 학습 후 자동 퀴즈 | 중간 | |
| P4 | 스케줄 복습 알림 (에빙하우스) | 어려움 | |

---

## 🟡 미해결 — 추가 발견 (2026.03.24)

| # | 위치 | 현재 문제 | 우선순위 |
|---|------|-----------|----------|
| U5 | login/page.jsx | Android 인앱 `openInChrome` Intent URL fallback setTimeout이 href를 window.location.href 값으로 재설정하는 구조적 오류 | P2 |
