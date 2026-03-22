# Cloyee API 설계
> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.22 | 버전: v0.2

---

## API 구조 overview

```
프론트엔드
    │
    ├── Supabase SDK → DB 직접 연동 (categories, sessions, reviews, roadmaps, profiles)
    │
    └── Next.js API Route
            ├── POST /api/chat    → Claude API (학습 대화, SSE 스트리밍)
            └── POST /api/review  → Claude API (코드 리뷰, SSE 스트리밍)
```

> Supabase는 SDK로 프론트에서 직접 연동하므로 별도 API Route 불필요
> `/api/curriculum/generate` 라우트는 v0.2에서 구현 후 revert됨 (v0.3 재설계 예정)

---

## 공통: SSE 스트리밍 방식

응답은 JSON이 아닌 **SSE(Server-Sent Events)** 방식으로 스트리밍됩니다.

```
Content-Type: text/event-stream

data: {"type":"chunk","text":"안녕"}
data: {"type":"chunk","text":"하세요"}
data: {"type":"done","score":75,"is_complete":false,"choices":null,"summary":null}
```

| 이벤트 타입 | 설명 |
|-------------|------|
| `chunk` | AI 응답 텍스트 청크 (실시간 출력) |
| `done` | 스트림 종료 + 메타데이터 전송 |

---

## 1. POST /api/chat (학습 대화)

### 요청 (Request)

```json
{
  "category": "개발",
  "title": "React useEffect",
  "roadmapId": "uuid-optional",
  "chatMode": "chat",
  "messages": [
    { "role": "user", "content": "useEffect가 뭔가요?" },
    { "role": "assistant", "content": "useEffect는 렌더링 이후 실행되는 Hook이에요." }
  ],
  "message": "의존성 배열은 왜 쓰나요?"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| category | string | ✅ | 학습 카테고리명 |
| title | string | ✅ | 학습 주제 |
| roadmapId | string | ❌ | 로드맵 ID (로드맵 기반 학습 시) |
| chatMode | string | ❌ | 학습 방식 (`chat` / `choice`) |
| messages | array | ✅ | 대화 히스토리 (`{role, content}`만 포함, extra 필드 제거 필수) |
| message | string | ✅ | 사용자가 방금 입력한 메시지 |

> ⚠️ **중요**: `messages`는 반드시 `{ role, content }`만 포함해야 함.
> `score`, `feedback`, `isDone` 등 extra 필드가 포함되면 API 오류 발생.
> 프론트엔드에서 `messages.map(({ role, content }) => ({ role, content }))` 필터링 필수.

### 응답 — SSE done 이벤트 메타데이터

```json
{
  "score": 75,
  "is_complete": false,
  "choices": ["의존성 배열 없이 사용", "빈 배열 사용", "값 넣어서 사용", "useCallback과 함께"],
  "summary": null
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| score | integer | 현재 이해도 점수 (0~100). **학습 완료 시에만** sessions.score로 평균 저장 |
| is_complete | boolean | 학습 완료 여부 |
| choices | array \| null | 선택형 모드일 때 4지선다 보기 배열, 없으면 null |
| summary | string \| null | 완료 시 대화 요약, 미완료 시 null |

> **score 처리 규칙**: 학습 중에는 score를 UI에 표시하지 않음. 완료(is_complete=true) 시 전체 assistant 메시지의 score 평균을 sessions.score에 저장.

---

## 2. POST /api/review (코드 리뷰)

### 요청 (Request)

```json
{
  "category": "개발",
  "title": "useEffect API 호출 코드",
  "code": "useEffect(() => {\n  fetch('/api/data')\n    .then(res => res.json())\n    .then(data => setData(data))\n}, [])",
  "messages": [
    { "role": "user", "content": "이 코드 리뷰해줘" },
    { "role": "assistant", "content": "잘 된 점은 의존성 배열을 잘 활용했어요..." }
  ],
  "message": "에러 처리는 어떻게 하면 좋을까요?"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| category | string | ✅ | 학습 카테고리명 |
| title | string | ✅ | 학습 주제 |
| code | string | ✅ | 리뷰받을 코드 원문 |
| messages | array | ✅ | 대화 히스토리 (`{role, content}`만 포함) |
| message | string | ✅ | 사용자의 추가 질문 또는 요청 |

### 응답 — SSE done 이벤트 메타데이터

```json
{
  "score": 80,
  "is_complete": false,
  "summary": null
}
```

---

## 공통 규칙

### 에러 응답

```json
{ "error": "에러 메시지" }
```

| HTTP 상태코드 | 설명 |
|---------------|------|
| 200 | 성공 (SSE 스트림 시작) |
| 400 | 잘못된 요청 (필수 필드 누락 등) |
| 500 | 서버 오류 (Claude API 오류 등) |

### 현재 AI 모델

| 환경 | 모델 |
|------|------|
| 개발/테스트 | `claude-haiku-4-5` (저비용) |
| 프로덕션 전환 예정 | `claude-sonnet-4-6` |

### Claude 시스템 프롬프트 방향

**학습 대화:**
- 소크라테스식 문답법으로 진행
- 일방적인 설명보다 질문으로 이해도 확인
- 한국어로 친근하게 대화
- `chatMode: "choice"` 시 4지선다 보기 제공
- 충분히 학습됐다고 판단되면 `is_complete: true` 반환

**코드 리뷰:**
- 잘 된 점 먼저 언급 후 개선점 제시
- 구체적인 코드 예시와 함께 설명
- 추가 질문에 친절하게 답변
- 리뷰가 마무리됐다고 판단되면 `is_complete: true` 반환

---

## DB 연동 흐름

### 학습 대화 완료 시
```
is_complete: true 수신
→ sessions 테이블에 저장
  (category_id, roadmap_id, user_id, title, mode: 'chat', summary, score평균, duration, is_complete: true)
```

### 코드 리뷰 완료 시
```
is_complete: true 수신
→ sessions 테이블에 저장 (mode: 'review', is_complete: true)
→ reviews 테이블에 저장 (session_id, user_id, code, messages)
```

### 게스트 모드
```
user_id = null 로 저장 허용
데이터는 저장되지만 RLS 상 누구나 조회 가능한 상태 (알려진 제약사항)
```

---

> 이 문서는 Cloyee 프로젝트 진행과 함께 계속 업데이트됩니다.
