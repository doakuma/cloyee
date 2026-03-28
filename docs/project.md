# Cloyee — 프로젝트 정의

> 거의 변하지 않는 파일입니다.
> 기술 스택 교체, 방향 전환 시에만 업데이트합니다.

---

## 서비스 정의

- **서비스명**: Cloyee
- **한 줄 소개**: AI 기반 소크라테스식 학습 도우미 — 직접 가르쳐 주는 대신 질문으로 이해를 유도
- **핵심 문제**: 혼자 공부할 때 "안다고 착각"하는 문제 — 능동적 회상(Active Recall)을 AI가 자동으로 유도
- **타겟 사용자**: 개발자 / IT 학습자 (초급~중급), 특히 혼자 공부하면서 이해도를 확인하고 싶은 사람
- **비즈니스 모델**: 현재 무료 (API 비용 최소화 전략 — Haiku 개발, Sonnet 프로덕션)

---

## 기술 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| Framework | Next.js (App Router) | 16.x | SSE, API Route, 서버 컴포넌트 통합 |
| Language | JavaScript | ES2022+ | 빠른 프로토타이핑, TypeScript 미도입 |
| Styling | Tailwind CSS + shadcn/ui | latest | 컴포넌트 속도 + 디자인 일관성 |
| AI | Claude API (Anthropic SDK) | claude-haiku-4-5 / claude-sonnet-4-6 | 소크라테스식 대화 품질 |
| DB | Supabase (PostgreSQL + RLS) | latest | Auth 통합, 멀티유저 격리 |
| Auth | Supabase Auth | — | OAuth + Magic Link, RLS 통합 |
| 배포 | Vercel + GitHub CI/CD | — | 자동 배포, 환경변수 관리 |
| 패키지 | pnpm | latest | 빠른 설치, 디스크 절약 |

---

## 코드 컨벤션 (반드시 지킬 것)

- **파일명**: 컴포넌트는 PascalCase (`SessionCard.jsx`), 나머지는 kebab-case
- **컴포넌트**: 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- **언어**: JavaScript 전용 (TypeScript 미사용)
- **패키지 매니저**: pnpm 전용 (npm / yarn 금지)
- **API 라우트**: `src/app/api/` 하위 (Next.js App Router 방식)
- **category_id**: URL 파라미터의 `roadmap?.category_id` 사용 — category state 직접 사용 금지 (UUID 아님)
- **messages 필터링**: Claude API 전송 전 `map(({ role, content }) => ...)` 필수 (extra 필드 제거)
- **DB Insert**: user_id는 항상 `supabase.auth.getUser()` 로 가져올 것 (직접 하드코딩 금지)

---

## 배포 정보

- **환경**: Vercel (Production) + localhost:3000 (Development)
- **URL**: https://cloyee.vercel.app
- **CI/CD**: GitHub main 브랜치 push → Vercel 자동 배포
- **Supabase 프로젝트**: InstructorCloyee (`fycowopnxqjkpyjarwul`)

---

## DB 테이블 구조

| 테이블 | 주요 컬럼 |
|--------|---------|
| categories | id, name, icon, is_default, user_id, created_at |
| sessions | id, category_id, user_id, title, mode, summary, score, duration, created_at |
| reviews | id, session_id, user_id, code, good_points, improve_points, messages(jsonb), created_at |
| feedback | id, user_id, category, content, images(text[]), created_at |
| profiles | id, is_admin, created_at |

---

## 명시적 제외 항목 (Won't Do)

| 항목 | 이유 |
|------|------|
| TypeScript 도입 | 개발 속도 > 타입 안정성 (현 규모) |
| npm / yarn 사용 | pnpm 전용 프로젝트 |
| 오프라인 모드 | AI 필수 서비스 |
| 실시간 협업 | 1인 학습 앱 기본 목표 |
| 음성/영상 | 모바일 웹 복잡도 증가 |
| 블록체인/NFT | 학습 앱과 무관 |
| 클래스 컴포넌트 | 함수형 컴포넌트 전용 |
