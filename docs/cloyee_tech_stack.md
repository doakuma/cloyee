# Cloyee 기술 스택
> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.22 | 버전: v0.2

---

## 확정 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | reactStrictMode: false (useEffect 이중 호출 방지) |
| 스타일링 | Tailwind CSS + shadcn/ui | Vercel 팀 제작 UI 컴포넌트 |
| AI | Claude API | Next.js API Route 경유 (보안), SSE 스트리밍 |
| DB | Supabase (PostgreSQL + RLS) | 프로젝트: InstructorCloyee |
| 인증 | Supabase Auth | Google / GitHub / 이메일 / Magic Link |
| 배포 | Vercel | GitHub 연동 자동 CI/CD |
| 패키지 매니저 | pnpm | npm/yarn 사용 금지 |
| 개발 도구 | Claude Code | AI 페어 프로그래밍 |
| 언어 | JavaScript | TypeScript 사용 안 함 |

---

## AI 모델 정책

| 환경 | 모델 | 비고 |
|------|------|------|
| 개발/테스트 | `claude-haiku-4-5` | 저비용 |
| 프로덕션 (예정) | `claude-sonnet-4-6` | 배포 전 교체 필요 |

---

## 기술 선택 이유

### Next.js
- React 기반 프레임워크로 라우팅 내장
- API Route로 백엔드 별도 구성 없이 서버 로직 처리 가능 (Claude API 키 보안)
- Vercel 배포와 최적 궁합

### Tailwind CSS + shadcn/ui
- Tailwind CSS로 유틸리티 기반 스타일링
- shadcn/ui로 버튼, 카드, 모달 등 주요 컴포넌트 즉시 활용
- 커스터마이징 자유도 높음

### Claude API (SSE 스트리밍)
- API 키를 서버(Next.js API Route)에서만 관리 → 보안 안전
- SSE 방식으로 타이핑 효과 구현 (ThinkingBubble 없이 실시간 출력)
- DONE 이벤트로 메타데이터(score, is_complete, choices 등) 전송

### Supabase
- PostgreSQL 기반 오픈소스 BaaS
- 무료 플랜으로 MVP 운영 충분
- Auth 내장 (Google/GitHub/이메일/Magic Link)
- RLS(Row Level Security)로 행 단위 보안

---

## 실제 프로젝트 구조

```
cloyee/
├── src/
│   ├── app/
│   │   ├── page.jsx              # 랜딩페이지 (미로그인 전용)
│   │   ├── dashboard/
│   │   │   └── page.jsx          # 대시보드 (로그인/게스트 공용)
│   │   ├── login/
│   │   │   └── page.jsx          # 로그인 (소셜/이메일/Magic Link 탭)
│   │   ├── onboarding/
│   │   │   └── page.jsx          # 온보딩 3단계
│   │   ├── study/
│   │   │   ├── page.jsx          # 카테고리/로드맵 선택
│   │   │   ├── new/
│   │   │   │   └── page.jsx      # 학습 로드맵 추가
│   │   │   ├── chat/
│   │   │   │   └── page.jsx      # 학습 대화 (SSE 스트리밍)
│   │   │   └── review/
│   │   │       └── page.jsx      # 코드 리뷰 (Monaco Editor)
│   │   ├── history/
│   │   │   ├── page.jsx          # 학습 기록 목록 (탭/필터/삭제/편집)
│   │   │   └── [id]/
│   │   │       └── page.jsx      # 기록 상세
│   │   ├── growth/
│   │   │   └── page.jsx          # 성장 현황 (레벨/streak/카테고리)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.js      # OAuth code + Magic Link token_hash 처리
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.js      # Claude API 학습 대화 (SSE)
│   │       └── review/
│   │           └── route.js      # Claude API 코드 리뷰 (SSE)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── common/
│   │   │   ├── Sidebar.jsx       # 사이드바 (LNB + 모바일 탭바)
│   │   │   └── ChoiceButtons.jsx # 선택형 4지선다 컴포넌트
│   │   ├── landing/              # 랜딩페이지 컴포넌트
│   │   └── home/                 # 대시보드 컴포넌트
│   ├── lib/
│   │   └── supabase.js           # Supabase 클라이언트
│   └── middleware.js             # 인증 미들웨어 (/my만 보호)
├── docs/                         # 프로젝트 문서
├── public/
├── next.config.js                # reactStrictMode: false
└── .env.local                    # 환경 변수
```

---

## 환경 변수 목록

```
ANTHROPIC_API_KEY=                   # Claude API 키
NEXT_PUBLIC_SUPABASE_URL=            # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anon 키
```

---

## 주요 기술 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| reactStrictMode | false | useEffect 이중 호출 방지 |
| Magic Link 방식 | token_hash | PKCE 방식은 크로스 브라우저 문제 |
| 대화 임시 저장 | sessionStorage | 새로고침 시 복원, 키: `cloyee_chat_{id}` |
| category_id 참조 | roadmap?.category_id | URL 파라미터 기준 (category state 직접 사용 금지) |
| messages 필터링 | `map(({ role, content }) => ...)` | extra 필드 API 전송 방지 |
| 게스트 데이터 | user_id = NULL 허용 | 추후 익명 auth로 개선 고려 |

---

## 패키지 버전 (주요)

| 패키지 | 버전 |
|--------|------|
| Next.js | 15.x |
| Tailwind CSS | 3.x |
| shadcn/ui | latest |
| @supabase/supabase-js | 2.x |
| @supabase/ssr | latest |
| @anthropic-ai/sdk | latest |

---

> 이 문서는 Cloyee 프로젝트 진행과 함께 계속 업데이트됩니다.
