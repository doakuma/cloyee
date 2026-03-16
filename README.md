# Cloyee — AI 스터디메이트

나의 성장을 함께 기록하는 소크라테스식 AI 학습 도우미

**배포 URL**: https://cloyee.vercel.app

---

## 주요 기능

### 소크라테스식 대화 학습
AI가 정답을 알려주는 대신 질문과 힌트로 학습자 스스로 답을 이끌어내도록 유도합니다. 대화형 / 4지선다 선택형 두 가지 모드를 지원합니다.

### 이해도 점수 측정
세션 완료 시 AI가 대화 흐름을 기반으로 이해도를 0~100점으로 자동 산출합니다. 학습 중에는 숨기고 완료 후에만 공개합니다.

### 학습 로드맵 관리
주제별 학습 로드맵을 생성하고 진행 상태(시작 전 / 진행 중 / 완료)를 대시보드에서 한눈에 확인합니다.

### 성장 시각화
총 학습일, 연속 학습 streak, 이번 주 세션 수, 레벨 진행도를 대시보드에서 실시간으로 확인합니다.

### 코드 리뷰
코드를 붙여넣으면 AI가 잘한 점 / 개선 포인트를 소크라테스식으로 피드백합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Claude API (SSE 스트리밍) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google / GitHub / 이메일 / Magic Link) |
| 배포 | Vercel + GitHub CI/CD |
| 패키지 매니저 | pnpm |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm
- Supabase 프로젝트
- Anthropic API 키

### 설치

```bash
git clone https://github.com/doakuma/cloyee.git
cd cloyee
pnpm install
```

### 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000` 에서 확인합니다.

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (dashboard)/        # 대시보드, 학습, 기록, 성장 페이지
│   │   ├── dashboard/      # 메인 대시보드
│   │   ├── study/          # 학습 시작 / 채팅 / 코드리뷰
│   │   ├── history/        # 학습 기록
│   │   └── growth/         # 성장 통계
│   ├── api/
│   │   ├── chat/           # 소크라테스 대화 API (SSE)
│   │   └── review/         # 코드 리뷰 API (SSE)
│   ├── auth/callback/      # OAuth / Magic Link 콜백
│   ├── login/              # 로그인 페이지
│   └── page.jsx            # 랜딩 페이지
├── components/
│   ├── common/             # MarkdownMessage, ChoiceButtons 등
│   ├── home/               # 대시보드 전용 컴포넌트
│   ├── landing/            # 랜딩 페이지 컴포넌트
│   └── ui/                 # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase.js         # 클라이언트 Supabase 인스턴스
│   ├── supabase-server.js  # 서버 Supabase 인스턴스
│   └── claude.js           # Claude API 유틸
└── utils/
    └── parseChoices.js     # [[CHOICES]] 파서
```

---

## 인증

- **Google OAuth** — 소셜 로그인
- **GitHub OAuth** — 소셜 로그인
- **이메일 + 비밀번호** — 로그인 / 회원가입 자동 분기
- **Magic Link** — 이메일 링크 로그인 (token_hash 방식)
- **게스트 모드** — 로그인 없이 학습 가능 (데이터 저장 안 됨)

`/my` 경로만 로그인 필수이며 나머지는 게스트 접근 가능합니다.

---

## AI 스트리밍 구조

```
클라이언트 → POST /api/chat → Claude API (SSE)
                                ↓
             text chunks → data: "..."
             완료 메타   → data: [DONE]{score, feedback, is_complete, summary}
             에러        → data: [ERROR]{error}
```

AI 응답 내 `<<<CLOYEE_META>>>` 구분자로 학습 텍스트와 메타데이터 JSON을 분리합니다.

---

## 라이선스

MIT
