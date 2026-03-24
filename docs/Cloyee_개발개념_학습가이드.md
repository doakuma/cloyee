# Cloyee 프로젝트 기반 개발 개념 학습 가이드

> SSE · RLS · OAuth · useEffect · Props 설계 · 미들웨어 · Supabase 클라이언트

---

## 01. SSE (Server-Sent Events) `들어봤어요`

### 무엇인지

서버에서 클라이언트로 데이터를 실시간으로 **단방향** 전송하는 HTTP 기반 프로토콜이다. 클라이언트가 한 번 연결을 열면, 서버가 연결을 유지하면서 데이터를 조금씩 흘려보낸다. `Content-Type: text/event-stream`을 사용한다.

### 왜 쓰는지

- 클라이언트가 주기적으로 서버에 요청을 보내는 폴링(polling)보다 효율적이다
- WebSocket보다 구현이 단순하고, 단방향 스트리밍에는 SSE가 더 적합하다
- HTTP 위에서 동작하므로 기존 인프라(프록시, 로드밸런서)와 호환성이 좋다
- AI 응답처럼 서버에서 데이터가 생성되는 즉시 전달해야 할 때 필수적이다

### 언제 쓰는지

- AI 응답을 타이핑되듯 실시간 출력할 때 (Cloyee 채팅 스트리밍)
- 실시간 알림, 뉴스피드처럼 서버 → 클라이언트 단방향 푸시가 필요할 때
- 서버에서 오래 걸리는 작업의 진행률을 실시간으로 보여줄 때
- 클라이언트가 메시지를 보낼 필요 없이 서버 데이터만 받으면 될 때

### 이러면 안돼

- **채팅처럼 클라이언트도 서버에 메시지를 보내야 하는 양방향 통신** → WebSocket 사용
- **단순히 버튼 클릭 후 결과 한 번만 받는 요청** → 일반 fetch로 충분
- **연결 끊겼을 때 자동 재연결 로직 없이 운영** → 반드시 재연결 처리 구현
- **대용량 바이너리 데이터 전송** → SSE는 텍스트 기반이라 부적합

### 코드 예시 — Cloyee에서 SSE 응답 파싱하는 방식

```js
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify(payload),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // chunk: 'data: {"type":"chunk","text":"안녕"}\n\n'
  // DONE:  'data: [DONE] {"score":75,"is_complete":false}\n\n'
}
```

---

## 02. RLS (Row Level Security) `몰라요`

### 무엇인지

PostgreSQL(Supabase)에서 테이블의 **행(Row) 단위로 접근을 제어**하는 보안 기능이다. 어떤 사용자가 어떤 행을 SELECT/INSERT/UPDATE/DELETE 할 수 있는지를 SQL 정책(Policy)으로 정의한다. API 키가 노출되더라도 정책이 DB 레벨에서 막아주는 **마지막 방어선**이다.

### 왜 쓰는지

- Supabase는 프론트엔드에서 DB에 직접 접근하는 구조라 RLS 없으면 모든 데이터가 노출된다
- 백엔드 코드 없이 DB 레벨에서 다중 사용자 데이터 격리를 구현할 수 있다
- anon 키가 클라이언트에 노출되어도 정책으로 접근 범위를 제한할 수 있다
- 서버 없이 클라이언트 SDK로 직접 쿼리하는 아키텍처에서 필수 보안 레이어다

### 언제 쓰는지

- Supabase를 프론트엔드에서 직접 사용할 때 **항상** 활성화해야 한다
- 사용자별 데이터 격리가 필요할 때 (내 세션만, 내 카테고리만 조회)
- 특정 행만 공개하고 나머지는 숨겨야 할 때 (기본 카테고리는 전체 공개)
- INSERT는 허용하되 SELECT는 자신 것만 허용하는 등 작업별 세분화가 필요할 때

### 이러면 안돼

- **RLS를 활성화하고 정책을 안 만들면** → 아무도 데이터에 접근 못한다 (기본 차단)
- **`user_id IS NULL` 조건을 열어두면** → 게스트 데이터가 모두에게 노출된다 (Cloyee 알려진 기술 부채)
- **서비스 키(service_role key)를 프론트에서 사용하면** → RLS를 우회하므로 절대 금지
- **정책 없이 프론트에서 user_id 필터링에만 의존하면** → URL 조작으로 타인 데이터 접근 가능

### 코드 예시 — Cloyee sessions 테이블 RLS 정책

```sql
-- RLS 활성화
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 본인 데이터 또는 게스트(NULL) 허용
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- INSERT 정책: 본인 user_id 또는 NULL만 삽입 가능
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );
```

---

## 03. OAuth 인증 플로우 `몰라요`

### 무엇인지

사용자가 비밀번호를 직접 제공하지 않고, **제3자(Google, GitHub 등)가 인증을 대신 처리**해주는 표준 프로토콜(OAuth 2.0)이다. '구글로 로그인' 버튼 뒤에서 동작하는 흐름이다. Supabase가 이 흐름을 추상화해주지만, 내부를 모르면 오류 디버깅이 어렵다.

### 왜 쓰는지

- 사용자가 비밀번호를 우리 서비스에 직접 입력할 필요가 없어 보안이 높아진다
- Google/GitHub 계정으로 즉시 로그인 가능해 가입 마찰이 줄어든다
- 비밀번호 분실, 해킹 등의 책임을 서비스가 직접 지지 않아도 된다
- 사용자 이메일, 프로필 정보를 인증 제공자에서 안전하게 받아올 수 있다

### 언제 쓰는지

- 소셜 로그인(Google, GitHub, Kakao 등)을 구현할 때
- 사용자가 비밀번호를 관리하지 않아도 되는 간편 로그인이 필요할 때
- 타사 서비스(Notion, Slack 등)의 API를 사용자 대신 호출해야 할 때

### 이러면 안돼

- **Authorization callback URL을 잘못 설정하면** → Invalid Redirect URI 에러 발생 (Cloyee 이슈 #16)
- **카카오톡 인앱 브라우저에서 OAuth 팝업 시도** → 차단되므로 인앱 감지 후 대체 수단 필요
- **PKCE 방식을 인앱 브라우저에서 사용** → sessionStorage 격리로 실패 (Cloyee가 token_hash로 전환한 이유)
- **access_token을 localStorage에 평문 저장** → XSS 공격에 취약

### 코드 예시 — Authorization Code Flow 핵심 흐름

```js
// 1. 로그인 버튼 클릭 → Google 인증 페이지로 이동
await supabase.auth.signInWithOAuth({ provider: "google" });

// 2. Google 로그인 성공 → callback URL로 리다이렉트
// https://myapp.com/auth/callback?code=AUTHORIZATION_CODE

// 3. /auth/callback/route.js 에서 code → session 교환
const { error } = await supabase.auth.exchangeCodeForSession(code);

// 4. 세션 발급 완료 → 쿠키에 저장 → /dashboard 이동
return NextResponse.redirect("/dashboard");
```

```
전체 흐름 요약

[로그인 버튼 클릭]
      ↓
[Google 로그인 페이지]
      ↓ 로그인 성공
[callback URL + code 파라미터로 리다이렉트]
      ↓
[/auth/callback → code를 session으로 교환]
      ↓
[쿠키에 세션 저장 → /dashboard 이동]
```

---

## 04. useEffect 의존성 배열 & cleanup `어느 정도 알아요`

### 무엇인지

`useEffect`는 컴포넌트 렌더링 후 **사이드 이펙트를 실행**하는 React 훅이다. 두 번째 인자인 **의존성 배열(dependency array)**이 useEffect 재실행 타이밍을 결정한다. **cleanup 함수**는 컴포넌트가 언마운트되거나 다음 effect 실행 전에 정리 작업을 하는 함수다.

### 왜 쓰는지

- 데이터 페칭, 이벤트 리스너 등록, 타이머 설정처럼 렌더링 외부의 작업을 처리해야 한다
- 의존성 배열로 불필요한 재실행을 막아 성능을 최적화할 수 있다
- cleanup으로 메모리 누수(이벤트 리스너 미제거, 타이머 미해제 등)를 방지한다
- `reactStrictMode`에서 effect가 두 번 실행되는 건 cleanup 미작성 버그를 잡아주는 신호다

### 언제 쓰는지

- API 데이터 페칭 시 (컴포넌트 마운트 1회, 또는 특정 값 변경 시마다)
- DOM 이벤트 리스너 추가/제거 (스크롤, 리사이즈 등)
- WebSocket, SSE 연결처럼 연결을 열고 닫아야 할 때
- 외부 라이브러리(차트, 에디터 등) 초기화 및 정리

### 이러면 안돼

- **의존성 배열 없이 사용** → 매 렌더마다 실행되어 무한 루프나 불필요한 API 호출 발생
- **effect 내에서 사용하는 값을 의존성 배열에 안 넣으면** → stale closure(오래된 값 참조) 버그
- **fetch 요청 후 cleanup 없이 setState** → 컴포넌트 언마운트 후 상태 업데이트 시도 경고
- **Supabase 구독(subscribe) 후 cleanup에서 unsubscribe 안 하면** → 메모리 누수 발생

### 코드 예시 — 의존성 배열 패턴 비교 및 cleanup

```js
// 의존성 배열 패턴 3가지
useEffect(() => {
  fetchData();
}, []); // 마운트 1회만
useEffect(() => {
  fetchData();
}); // 매 렌더마다 (거의 사용 안 함)
useEffect(() => {
  fetchSession(id);
}, [id]); // id 바뀔 때마다

// cleanup 필수 예시 1 — 이벤트 리스너
useEffect(() => {
  const handler = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler); // cleanup
}, []);

// cleanup 필수 예시 2 — fetch 취소
useEffect(() => {
  const controller = new AbortController();
  fetch("/api/data", { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => setData(data));
  return () => controller.abort(); // cleanup
}, [id]);
```

---

## 05. 재사용 컴포넌트 Props 설계 `어느 정도 알아요`

### 무엇인지

재사용 컴포넌트의 props 설계는 **컴포넌트가 어떤 맥락에서도 유연하게 사용**될 수 있도록 인터페이스를 정의하는 과정이다. Boolean flag 방식, 렌더 props 방식, Compound Component 패턴 등 여러 접근법이 있고 각각 적합한 상황이 다르다.

### 왜 쓰는지

- props 설계가 나쁘면 flag가 계속 추가되어 컴포넌트가 점점 복잡해진다
- 좋은 설계는 내부 구현이 바뀌어도 사용하는 쪽의 코드가 바뀌지 않는다
- 컴포넌트를 여러 맥락(대시보드/히스토리)에서 다르게 동작시키려면 설계가 중요하다
- Compound Component 패턴은 외부에서 조합할 수 있어 확장성이 훨씬 높다

### 언제 쓰는지

- Boolean flag props가 3개 이상 생기기 시작할 때 → 패턴 재검토 신호
- 같은 컴포넌트를 2개 이상의 페이지에서 다르게 쓸 때
- 컴포넌트 내부에 조건부 렌더링이 너무 많아질 때
- 공통 컴포넌트 설계 시 (SessionCard, Button, Modal 등)

### 이러면 안돼

- **showMenu, showBadge, isCompact, hasDelete 등 flag가 쌓이면** → 사실상 컴포넌트가 여러 개, 분리 고려
- **props로 모든 스타일을 주입하려 하면** → `className` prop 하나로 열어두는 게 낫다
- **너무 일찍 과도한 추상화** → 실제로 재사용되기 전엔 단순하게 시작하는 게 낫다
- **부모에서 자식 내부 구현에 의존하는 props 설계** → 내부 변경 시 외부도 같이 수정해야 함

### 코드 예시 — Boolean flag 방식 vs Compound Component 패턴

```jsx
// ❌ flag가 쌓이는 패턴 (위험 신호)
<SessionCard
  showMenu={true}
  showBadge={false}
  isCompact={true}
  hasDelete={true}
/>

// ✅ Compound Component 패턴 (조합 가능)
<SessionCard session={session}>
  <SessionCard.Badge />
  <SessionCard.Menu onDelete={handleDelete} />
</SessionCard>

// ✅ 현재 Cloyee 수준 (flag 1개 → 아직 괜찮음)
<SessionCard session={session} showMenu={false} />  // 대시보드
<SessionCard session={session} showMenu={true} />   // 히스토리
```

> **공부 키워드**: Compound Component 패턴, Render Props 패턴

---

## 06. Next.js 미들웨어 (middleware.js) `몰라요`

### 무엇인지

Next.js 미들웨어는 **요청이 페이지나 API Route에 도달하기 전에 실행**되는 함수다. Edge Runtime에서 실행되어 매우 빠르며, 인증 확인, 리다이렉트, 헤더 수정 등을 페이지 렌더링 전에 처리할 수 있다. 프로젝트 루트의 `middleware.js` 파일에 작성한다.

### 왜 쓰는지

- 페이지 컴포넌트 안에서 인증 체크하면 잠깐 페이지가 보였다가 튕기는 현상이 생긴다
- 미들웨어는 렌더링 전에 실행되므로 인증 안 된 사용자에게 페이지 내용이 노출되지 않는다
- 여러 경로에 공통 로직(인증, 로깅)을 한 곳에서 관리할 수 있다
- Edge Runtime에서 실행되어 서버리스 함수보다 빠르고 지연시간이 낮다

### 언제 쓰는지

- 특정 경로를 비로그인 사용자로부터 보호할 때 (`/my`, `/admin` 등)
- 로그인한 사용자가 `/login` 페이지에 접근 시 `/dashboard`로 리다이렉트
- 국제화(i18n)에서 언어별 경로로 자동 리다이렉트할 때
- 요청 헤더에 인증 토큰을 추가하거나 특정 조건에서 응답을 수정할 때

### 이러면 안돼

- **DB 직접 조회나 Node.js API(`fs`, `crypto` 등) 사용** → Edge Runtime은 Node 환경이 아님
- **무거운 연산이나 외부 API 호출** → 모든 요청마다 실행되므로 지연시간에 민감
- **`createBrowserClient`를 미들웨어에서 사용** → 반드시 `createServerClient` 사용
- **`matcher` 없이 모든 경로에 적용** → 정적 파일(`_next/static` 등)에도 실행되어 낭비

### 코드 예시 — Cloyee middleware.js 패턴

```js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 보호할 경로 정의
  const protectedPaths = ["/my", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get: (name) => request.cookies.get(name)?.value } },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// 적용할 경로 패턴 (정적 파일 제외)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 07. Supabase 클라이언트 vs 서버 클라이언트 `몰라요`

### 무엇인지

Supabase는 실행 환경에 따라 **다른 클라이언트**를 써야 한다.

| 환경                               | 사용할 함수           | 파일                 |
| ---------------------------------- | --------------------- | -------------------- |
| 클라이언트 컴포넌트 (`use client`) | `createBrowserClient` | `supabase.js`        |
| 서버 컴포넌트                      | `createServerClient`  | `supabase-server.js` |
| API Route (`route.js`)             | `createServerClient`  | `supabase-server.js` |
| middleware.js                      | `createServerClient`  | 직접 생성            |

차이의 핵심은 **쿠키 접근 방식**이다. Supabase Auth는 세션을 쿠키에 저장하는데, 브라우저와 서버가 쿠키에 접근하는 방법이 다르다.

### 왜 쓰는지

- 브라우저는 `document.cookie`로 접근하지만, 서버는 요청 헤더에서 읽고 응답 헤더로 써야 한다
- 잘못된 클라이언트를 쓰면 서버에서 인증 상태를 읽지 못해 '로그인 안 된 것처럼' 동작한다
- 서버 컴포넌트에서 `createBrowserClient`를 쓰면 → 세션 누락 버그 발생 (Cloyee 이슈 #26)

### 언제 쓰는지

- `'use client'` 컴포넌트 → `createBrowserClient`
- `async` 서버 컴포넌트, API Route, middleware → `createServerClient`
- admin 전용 작업(RLS 우회 필요) → `service_role` 키로 서버에서만 사용

### 이러면 안돼

- **서버 컴포넌트에서 `createBrowserClient` 사용** → 세션을 못 읽어 인증 상태 오류 발생
- **API Route에서 브라우저 supabase 클라이언트 import** → 동일하게 세션 누락
- **`service_role` 키를 클라이언트 컴포넌트에서 사용** → RLS 우회로 보안 구멍 발생
- **서버 컴포넌트에서 `cookies()`를 `await` 없이 동기 호출** → Next.js 15에서 오류 발생

### 코드 예시 — 환경별 Supabase 클라이언트 사용 패턴

```js
// ✅ 클라이언트 컴포넌트 (브라우저)
// src/lib/supabase.js
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
```

```js
// ✅ 서버 컴포넌트 / API Route
// src/lib/supabase-server.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    },
  );
}
```

```js
// ✅ 서버 컴포넌트에서 사용
// app/dashboard/page.jsx
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: sessions } = await supabase.from("sessions").select("*");
  return <div>...</div>;
}
```

---

## 학습 우선순위 요약

| 순서 | 주제                        | 이유                                                |
| ---- | --------------------------- | --------------------------------------------------- |
| 1    | OAuth 인증 플로우           | 인증은 모든 서비스에 필수, 디버깅 시 원리 이해 필요 |
| 2    | Supabase 클라이언트 vs 서버 | Cloyee 실제 버그 원인, 실전 연결 바로 가능          |
| 3    | RLS                         | 보안 직결, 직접 정책 작성해보면 빠르게 이해         |
| 4    | Next.js 미들웨어            | Cloyee에서 이미 쓰고 있으니 코드 보면서 이해        |
| 5    | SSE                         | 개념 보완, Cloyee 채팅 코드로 직접 확인             |
| 6    | useEffect cleanup           | 쓰고 있는데 빠진 부분 채우기                        |
| 7    | Props 설계 패턴             | Compound Component 패턴 공부로 확장                 |
