# Cloyee 기술 스택
> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.24 | 버전: v0.2

---

## 전체 스택 요약

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 | `reactStrictMode: false` |
| 언어 | JavaScript | ES2022+ | TypeScript 미사용 |
| 스타일링 | Tailwind CSS | 4.x | PostCSS 방식 |
| UI 컴포넌트 | shadcn/ui + Radix UI | latest | 필요한 컴포넌트만 설치 |
| AI | Claude API (Anthropic) | SDK 0.78+ | API Route 경유, SSE 스트리밍 |
| DB | Supabase (PostgreSQL) | 2.99+ | RLS 활성화 |
| 인증 | Supabase Auth | — | Google / GitHub / 이메일 / Magic Link |
| 배포 | Vercel | — | GitHub 연동 자동 CI/CD |
| 패키지 매니저 | pnpm | — | npm/yarn 사용 금지 |
| 개발 도구 | Claude Code | — | AI 페어 프로그래밍 |

---

## 프레임워크 — Next.js (App Router)

### 왜 Next.js?
- React 기반으로 CSR/SSR/SSG를 상황에 맞게 혼용 가능
- **API Route**로 별도 백엔드 없이 서버 로직 처리 (Claude API 키 보안)
- Vercel과 최적 궁합 (Zero-config 배포)

### 주요 설정

```js
// next.config.js
reactStrictMode: false  // useEffect 이중 호출 방지
```

### 렌더링 전략

| 페이지 | 방식 | 이유 |
|--------|------|------|
| `/` 랜딩 | SSR (async Server Component) | 로그인 여부 판단 후 리다이렉트 |
| `/dashboard` | SSR | Supabase 세션 데이터 서버에서 조회 |
| `/study/chat` | CSR | SSE 스트리밍, sessionStorage 접근 필요 |
| `/admin/*` | SSR | is_admin 권한 검증 후 리다이렉트 |

### 미들웨어

```
/my/* → 비로그인 시 /login 리다이렉트
/admin/* → 비로그인 시 /login 리다이렉트
나머지 → 게스트 허용
```

---

## 스타일링 — Tailwind CSS + shadcn/ui

### Tailwind CSS v4
- `@tailwindcss/postcss` 방식 (config 파일 없이 CSS 파일에서 직접 설정)
- 유틸리티 클래스 기반으로 인라인 스타일 없이 빠른 UI 구현

### shadcn/ui
- Radix UI 기반 헤드리스 컴포넌트를 Tailwind로 스타일링한 라이브러리
- 설치 명령: `pnpm dlx shadcn@latest add [컴포넌트명]`
- 현재 설치된 컴포넌트: `button`, `dialog`, `textarea`, `alert-dialog`, `dropdown-menu`, `table`, `input`, `sonner`
- `src/components/ui/` 디렉토리에 복사된 소스 코드로 관리 (수정 가능)

### 아이콘

| 라이브러리 | 용도 |
|-----------|------|
| `lucide-react` | 일반 UI 아이콘 (Sidebar, 버튼 등) |
| `@hugeicons/react` | 보조 아이콘 |

---

## AI — Claude API (Anthropic)

### 모델 정책

| 환경 | 모델 | 비고 |
|------|------|------|
| 개발/테스트 | `claude-haiku-4-5` | 저비용, 빠른 응답 |
| 프로덕션 (예정) | `claude-sonnet-4-6` | 배포 직전 교체 필요 |

### SSE 스트리밍 구조

```
클라이언트 fetch → Next.js API Route → Anthropic SDK (stream) → SSE text/event-stream
```

- `text/event-stream` Content-Type으로 청크 단위 전송
- 각 청크: `data: [텍스트]\n\n` 형식
- 완료 시: `data: [DONE] {...메타데이터}\n\n` 형식으로 score, is_complete, choices 등 전송
- 클라이언트는 `ReadableStream` + `TextDecoder`로 파싱

### 히스토리 슬라이싱

```js
// API 전송 전 최근 10턴만 추출 (토큰 비용 제어)
const recentMessages = messages
  .map(({ role, content }) => ({ role, content }))  // extra 필드 제거 필수
  .slice(-10);
```

### API Route 목록

| 경로 | 기능 |
|------|------|
| `/api/chat` | 학습 대화 SSE |
| `/api/review` | 코드 리뷰 SSE |
| `/api/chat/summarize` | 중단 세션 요약 (max_tokens: 256) |

---

## DB — Supabase (PostgreSQL)

### 프로젝트 정보
- **프로젝트명**: InstructorCloyee
- **프로젝트 ID**: fycowopnxqjkpyjarwul

### 테이블 구조

```
categories
  id (uuid, PK)
  name (text)
  icon (text)
  is_default (boolean)
  user_id (uuid, FK → auth.users, nullable)  ← 커스텀 카테고리 소유자
  created_at (timestamptz)

sessions
  id (uuid, PK)
  category_id (uuid, FK → categories)
  roadmap_id (uuid, FK → roadmaps, nullable)
  user_id (uuid, FK → auth.users, nullable)  ← 게스트는 NULL
  title (text)
  mode (text)  — "chat" | "review"
  summary (text, nullable)  ← 중단 세션 AI 요약
  score (int)
  is_complete (boolean)
  duration (int)
  created_at (timestamptz)

reviews
  id (uuid, PK)
  session_id (uuid, FK → sessions)
  user_id (uuid, FK → auth.users, nullable)
  code (text, nullable)  ← NOT NULL 제약 해제됨
  good_points (text)
  improve_points (text)
  messages (jsonb)
  created_at (timestamptz)

roadmaps
  id (uuid, PK)
  category_id (uuid, FK → categories)
  user_id (uuid, FK → auth.users, nullable)
  topic (text)
  status (text)  — "active" | "completed"
  chapters (jsonb)  ← v0.3 재사용 예정
  created_at (timestamptz)

profiles
  id (uuid, PK, FK → auth.users)
  job_role (varchar)
  experience (varchar)
  level (varchar)
  onboarding_done (boolean)
  is_admin (boolean)
  category_order (jsonb)
  created_at, updated_at

feedback
  id (uuid, PK)
  user_id (uuid, nullable)
  category (text)  — "bug" | "suggestion" | "other"
  content (text)
  created_at (timestamptz)
```

### RLS 정책 요약

| 테이블 | 정책 |
|--------|------|
| categories | is_default=true → 전체 읽기 / 본인 user_id → 읽기+쓰기 |
| sessions | 본인 user_id 또는 NULL (게스트) |
| reviews | sessions 조인으로 소유권 확인 |
| profiles | 본인만 읽기+쓰기 |
| feedback | insert: 전체 허용 / select: 서버 클라이언트만 |

### 클라이언트 사용 패턴

```js
// 클라이언트 컴포넌트 (브라우저)
import { supabase } from "@/lib/supabase";

// 서버 컴포넌트 / API Route (서버)
import { createSupabaseServerClient } from "@/lib/supabase-server";
// 또는 Admin 페이지처럼 cookies() 직접 전달
import { createServerClient } from "@supabase/ssr";
```

---

## 인증 — Supabase Auth

### 지원 방식

| 방식 | 설명 |
|------|------|
| Google OAuth | 소셜 로그인 (프로덕션 앱 게시 완료) |
| GitHub OAuth | 소셜 로그인 (InstructorCloyee 앱) |
| 이메일+비밀번호 | 계정 없으면 자동 signUp |
| Magic Link | token_hash 방식 (크로스 브라우저 대응) |
| 게스트 | 비로그인 허용, user_id = NULL |

### Magic Link — token_hash 방식을 선택한 이유

PKCE 방식은 인증 코드를 브라우저 sessionStorage에 저장하는데, 카카오톡 인앱 브라우저처럼 세션이 격리된 환경에서는 code를 검증할 수 없어 로그인 실패. token_hash 방식은 URL 자체에 검증 정보가 포함되어 크로스 브라우저 상황에서도 동작.

### 인앱 브라우저 대응 (`useInAppBrowser` 훅)

카카오톡, 인스타그램, 네이버 앱 등 인앱 브라우저는 OAuth 팝업을 차단함.

```
iOS 인앱 → Magic Link 탭 자동 전환 + 경고 배너 ("Safari에서 열어주세요")
Android 인앱 → 경고 배너 + "Chrome에서 열기" 버튼 (Intent URL 방식)
```

---

## 배포 — Vercel

- GitHub 연동으로 `main` 브랜치 push 시 자동 배포
- 환경 변수는 Vercel 대시보드에서 관리
- **배포 URL**: https://cloyee.vercel.app

### 환경 변수

```
ANTHROPIC_API_KEY=             # Claude API 키 (서버 전용)
NEXT_PUBLIC_SUPABASE_URL=      # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon 키
```

---

## 주요 패키지

### 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 16.1.6 | 프레임워크 |
| `react` / `react-dom` | 19.2.3 | UI |
| `@anthropic-ai/sdk` | 0.78+ | Claude API |
| `@supabase/supabase-js` | 2.99+ | DB/Auth 클라이언트 |
| `@supabase/ssr` | 0.9+ | 서버 컴포넌트용 Supabase |
| `tailwindcss` | 4.x | 스타일링 |
| `shadcn` | 4.x | UI 컴포넌트 설치 CLI |
| `radix-ui` | 1.4+ | 헤드리스 UI 기반 |
| `lucide-react` | 0.577+ | 아이콘 |
| `sonner` | 2.x | Toast 알림 |
| `react-markdown` | 10.x | AI 응답 마크다운 렌더링 |
| `@monaco-editor/react` | 4.7+ | 코드 리뷰 에디터 |
| `@dnd-kit/core` | 6.x | 드래그 앤 드롭 |
| `next-nprogress-bar` | 2.4+ | 페이지 로딩 프로그레스 바 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.jsx                     # 랜딩 (SSR, 미로그인 전용)
│   ├── layout.js                    # 루트 레이아웃 (Sidebar, FeedbackButton, Toaster)
│   ├── dashboard/page.jsx           # 대시보드
│   ├── login/page.jsx               # 로그인 (소셜/이메일/링크 탭)
│   ├── onboarding/page.jsx          # 온보딩 3단계
│   ├── my/page.jsx                  # 내 프로필 (로그인 필수)
│   ├── study/
│   │   ├── page.jsx                 # 카테고리/로드맵 선택 + CategoryManager
│   │   ├── new/page.jsx             # 로드맵 추가
│   │   ├── chat/page.jsx            # 학습 대화 (SSE)
│   │   └── review/page.jsx          # 코드 리뷰 (Monaco)
│   ├── history/page.jsx             # 학습 기록 (완료 세션)
│   ├── growth/page.jsx              # 성장 현황
│   ├── admin/
│   │   ├── layout.jsx               # is_admin 검증
│   │   ├── users/page.jsx           # 사용자 목록
│   │   ├── categories/page.jsx      # 카테고리 관리
│   │   └── feedback/page.jsx        # 피드백 목록
│   ├── auth/callback/route.js       # OAuth + Magic Link 콜백
│   └── api/
│       ├── chat/route.js            # 학습 대화 API (SSE)
│       ├── chat/summarize/route.js  # 세션 요약 API
│       └── review/route.js          # 코드 리뷰 API (SSE)
├── components/
│   ├── ui/                          # shadcn/ui 컴포넌트 (복사본)
│   ├── common/
│   │   ├── Sidebar.jsx              # 사이드바 + 모바일 탭바
│   │   ├── SessionCard.jsx          # 공통 세션 카드 (showMenu prop)
│   │   ├── FeedbackButton.jsx       # 피드백 FAB
│   │   └── ProgressBar.jsx          # 페이지 전환 프로그레스 바
│   ├── study/
│   │   ├── CategoryManager.jsx      # 커스텀 카테고리 UI
│   │   └── ChoiceButtons.jsx        # 선택형 4지선다
│   ├── landing/
│   │   ├── GoogleLoginButton.jsx    # Google OAuth 버튼
│   │   └── LandingCTA.jsx           # 인앱 감지 포함 CTA 래퍼
│   └── admin/
│       └── AdminCategoryActions.jsx # 어드민 카테고리 추가/삭제
├── hooks/
│   └── useInAppBrowser.js           # 인앱 브라우저 감지 훅
├── lib/
│   ├── supabase.js                  # 클라이언트 Supabase
│   ├── supabase-server.js           # 서버 Supabase (cookies 기반)
│   └── utils.js                     # cn() 유틸 (clsx + tailwind-merge)
└── middleware.js                    # /my, /admin 인증 보호
```

---

## 코드 컨벤션

| 항목 | 규칙 |
|------|------|
| 컴포넌트 파일명 | PascalCase (`SessionCard.jsx`) |
| 컴포넌트 스타일 | 함수형 컴포넌트만 사용 |
| 타입 | JavaScript (TypeScript 금지) |
| 패키지 설치 | pnpm만 사용 (npm/yarn 금지) |
| shadcn 설치 | `pnpm dlx shadcn@latest add [컴포넌트]` |
| 서버/클라이언트 분리 | 서버 컴포넌트에서 훅 사용 금지, 클라이언트 래퍼로 분리 |

---

## 알려진 제약사항

| 항목 | 내용 |
|------|------|
| 게스트 데이터 | user_id IS NULL 데이터는 RLS 상 누구나 조회 가능 |
| 인앱 브라우저 | iOS: Magic Link 자동 전환 / Android: Chrome Intent URL |
| RSC prefetch 503 | Vercel cold start 간헐적 발생 (실사용 영향 없음) |
| AI 모델 | 현재 haiku 사용 중 → 배포 전 sonnet으로 교체 필요 |

---

> 이 문서는 Cloyee 프로젝트 진행과 함께 계속 업데이트됩니다.
