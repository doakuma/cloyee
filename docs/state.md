# Cloyee — 현재 상태

> 이 문서는 Phase/버전이 완료될 때마다, 그리고 주요 결정 후에 업데이트됩니다.
> 새로운 대화나 서브 에이전트가 프로젝트 상태를 파악하려면 이 파일을 읽으면 됩니다.

---

## 📊 메타

| 항목 | 값 |
|------|-----|
| **현재 버전** | v0.2 진행 중 |
| **마지막 업데이트** | 2026.03.28 (GSD 문서 구조 셋업 + 어드민 패널 완료) |
| **배포 URL** | https://cloyee.vercel.app |
| **로컬** | http://localhost:3000 |

---

## ✅ 완료된 것

### v0.1 완료
- 카테고리 선택 → 학습 대화(chat) / 코드 리뷰(review) 플로우
- 소크라테스식 대화 + 이해도 점수 + 완료 감지 (is_complete)
- 학습 기록 자동 저장 (sessions / reviews 테이블)
- 성장 시각화 (레벨, streak, 카테고리별 학습량)
- 모바일 전수 검증 완료 (14개 이슈 해결)

### v0.2 Priority 1 완료 ✅
**사용자 인증**
- Google OAuth ✅
- GitHub OAuth ✅
- 이메일+비밀번호 로그인/회원가입 ✅
- Magic Link (token_hash 방식) ✅
- 게스트 모드 ✅
- RLS 정책 (categories/sessions/reviews) ✅
- Sidebar & 모바일 탭바 업데이트 ✅

### v0.2 기술 개선 (2026.03.17~03.26)
- SSE 스트리밍 적용 (실시간 타이핑 효과)
- 학습 플로우 재설계 (첫학습 / 복습 분기)
- UX 휴리스틱 평가 (Nielsen 10) — 7개 이슈 발견, 5개 해결
- 중단 세션 복습 요약 (`/api/chat/summarize`)
- 히스토리 슬라이싱 (`messages.slice(-10)`)
- SessionCard 공통 컴포넌트 추출
- **Feedback 이미지 업로드** ✅
  - Supabase Storage 버킷 생성 (feedback-images)
  - 파일명 처리 (한글/특수문자 제거, 고유성 보장)
  - feedback.images TEXT[] 저장
- **FeedbackButton 모달 UI 개선** ✅
  - 부제목 폰트 사이즈 증대 (text-xs → text-sm)
  - 카테고리 버튼 가시성 강화 (border-2, 호버 효과)
  - 이미지 첨부 버튼 리디자인 (텍스트 레이블, 테두리 스타일)
  - 글자수 카운터 추가 (maxLength=500, 색 강조)
  - 전달하기 버튼 높이 증가 (size="lg")
  - 간격 최적화 (gap-6→gap-2, space-y-4→space-y-2)
  - Border-radius 설정 (DialogContent 12px, Textarea 8px, 버튼 4px)

### v0.2 기타 완료 (2026.03.26~03.28)
- **어드민 패널** ✅
  - `/admin/users`, `/admin/categories`, `/admin/feedback`, `/admin/docs`
  - Sidebar Admin 탭 (is_admin=true일 때만 표시, Shield 아이콘)
  - middleware.js + admin/layout.jsx 접근 제어
- **보안 체크리스트** ✅ — 구현 완료/주의 항목 분류
- **GSD 문서 구조** ✅ — docs/project.md, tasks/, .claude/commands/ 셋업

---

## 🔄 지금 진행 중

| 항목 | 상태 | 우선순위 |
|------|------|---------|
| 커스텀 카테고리 (DB user_id + UI) | 계획 중 | Priority 1 (다음 작업) |

---

## 📋 즉시 실행 가능한 것

### v0.2 남은 것

| # | 기능 | 난이도 | 우선순위 |
|---|------|--------|---------|
| 1 | 커스텀 카테고리 — DB user_id 컬럼 + UI | 쉬움 | Priority 1 |
| 2 | URL 교재 기능 — Cheerio 크롤링 | 중간 | Priority 2 |
| 3 | 학습 후 자동 퀴즈 | 중간 | Priority 3 |
| 4 | 스케줄 복습 알림 (에빙하우스) | 어려움 | Priority 4 |

---

## ⚠️ 블로커 및 알려진 이슈

| # | 이슈 | 우선순위 | 영향도 |
|---|------|---------|--------|
| 1 | 게스트 데이터 노출 (user_id IS NULL) | Major | 추후 익명 auth로 개선 |
| 2 | 모바일 Review 탭바 overflow 가능성 | Minor | P3 |
| 3 | RSC prefetch 503 (Vercel cold start) | Minor | 실사용 영향 없음 |
| 4 | 복습 후 세션 완료 시나리오 미검증 | Major | 배포 전 테스트 필요 |
| 5 | 교안 진행률 미구현 | - | v0.3에서 스텝 분할로 해결 |

---

## 🔭 v0.3 예정

| 기능 | 난이도 | 예정 시점 |
|------|--------|---------|
| 교안 기반 학습 플로우 (스텝 분할 방식) | 어려움 | v0.3 Priority 1 |
| URL/교재 업로드 기반 교안 | 중간 | v0.3 Priority 2 |

---

## 🔑 핵심 기술 결정사항

| 항목 | 값 | 이유 |
|------|-----|------|
| **AI 모델** | claude-haiku-4-5 (개발) → claude-sonnet-4-6 (프로덕션) | 개발 속도 vs 품질 |
| **스트리밍** | SSE (text/event-stream) | 실시간 타이핑 효과 |
| **인증** | Supabase Auth (Google/GitHub/Magic Link) | 크로스 브라우저 호환성 |
| **DB** | Supabase (PostgreSQL) + RLS | 보안 + 멀티유저 |
| **배포** | Vercel + GitHub CI/CD | 자동 배포 |
| **스타일** | Tailwind CSS + shadcn/ui | 개발 속도 |

---

## 📝 최근 결정사항

- **2026.03.28**: GSD 문서 구조 셋업 (docs/project.md, tasks/, .claude/commands/ 생성)
- **2026.03.26**: 어드민 패널 + 보안 체크리스트 구축
- **2026.03.25**: FeedbackButton 책갈피 스타일 (오른쪽 상단 고정) 적용
- **2026.03.22**: UX 휴리스틱 평가 후 5개 이슈 수정
- **2026.03.17**: 학습 플로우 재설계 (첫학습 / 복습 분기)
- **이전**: 교안 기능 revert (v0.3로 미루고 우선순위 재조정)

> 상세한 기술 결정 로그는 `docs/decisions.md` 참고
