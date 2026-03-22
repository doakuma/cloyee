# Cloyee v2 아이디어

> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.22
> MVP 완성 후 다음 버전에서 구현할 아이디어 모음

---

## Idea 1. 사용자 커스텀 카테고리

> **현재 상태**: DB 준비 완료 ✅ | UI 구현 예정 (v0.2 P1)

### 배경
현재 카테고리가 개발/기획/디자인/AI 활용 4개로 고정되어 있어서
사용자가 원하는 주제로 자유롭게 학습하기 어려움.

### 방향
- 사용자가 카테고리를 직접 추가/삭제 가능
- 기본 카테고리 4개는 유지 (is_default: true, user_id: NULL)
- 커스텀 카테고리는 categories 테이블에 user_id 연결로 저장

### 구현 현황

**DB 완료 (v0.2):**
```sql
-- 이미 적용됨
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

**RLS 완료 (v0.2):**
- SELECT: `user_id IS NULL` (기본) OR `auth.uid() = user_id` (본인)
- INSERT/DELETE: `auth.uid() = user_id`

**UI 미구현 (v0.2 P1):**
- 카테고리 선택 화면에 "+ 카테고리 추가" 버튼
- 이름 + 이모지 입력 후 저장
- 내 카테고리 목록에서 삭제 가능

**장점:**
- 사용자별 맞춤 학습 환경 구성 가능
- 예) TypeScript, 알고리즘, 영어회화, 이력서 작성 등 무한 확장

---

## Idea 2. URL 교재 기능

### 배경
공식 문서나 학습하고 싶은 링크를 직접 붙여넣으면
Cloyee가 해당 내용을 파악하고 교재로 활용해 소크라테스식 문답 진행.

### 동작 흐름
```
사용자가 URL 입력
→ 서버에서 페이지 크롤링 (fetch + Cheerio로 본문 추출)
→ 추출된 내용을 시스템 프롬프트에 교재로 주입
→ Claude가 해당 내용 기반으로 소크라테스식 문답 시작
```

### 구현 방법

**Option 1. 기본 fetch (간단)**
- Next.js API Route에서 URL fetch → HTML 텍스트 추출
- 단순한 정적 페이지는 잘 됨
- SPA는 내용 못 가져올 수 있음

**Option 2. Cheerio (추천) ✅**
```bash
pnpm add cheerio
```
- HTML 파싱 후 nav/footer/광고 제거, 본문만 추출
- MDN, React 공식문서, Next.js docs 등 대부분의 기술 문서 커버
- Vercel 무료플랜에서도 동작

**Option 3. Puppeteer / Playwright (고급)**
- SPA(React로 만든 사이트)도 크롤링 가능
- 서버 리소스 많이 소비 → Vercel 무료플랜 어려움
- 필요 시 별도 서버 고려

### UI 추가
- 학습 시작 화면에 "URL로 학습하기" 옵션 추가
- URL 입력 → 내용 파악 중 로딩 → 학습 시작
- 추출된 교재 제목/출처 상단에 표시

### 활용 예시
- MDN Web Docs → JavaScript 심화 학습
- React 공식문서 → Hook 학습
- Next.js docs → App Router 학습
- 블로그 포스트 → 특정 기술 개념 학습
- 회사 위키 → 온보딩 학습

### 주의사항
- 크롤링 차단하는 사이트 있음 (robots.txt 확인 필요)
- 너무 긴 페이지는 토큰 초과 → 본문 앞 N자만 사용하는 트런케이션 처리 필요
- 저작권 이슈 → 개인 학습 용도로만 사용 안내 필요

---

## Idea 3. 학습 테스트 기능

### 배경
학습 후 실제로 내용을 이해했는지 확인할 수 있는 테스트 기능 필요.

### 방식 1. 학습 후 자동 퀴즈 ✅ 기본
- 학습 완료 시 "테스트 해볼까요?" 버튼 표시
- Claude가 학습 내용 기반으로 퀴즈 3~5문제 자동 생성
- 객관식 or 단답형 선택 가능
- 결과 점수 sessions 테이블에 저장

### 방식 2. 언제든지 테스트 ✅ 기본
- 기록 상세 페이지에서 "다시 테스트" 버튼
- 이전에 학습한 내용으로 새 퀴즈 생성
- 복습 용도, 몇 번이든 반복 가능

### 방식 3. 스케줄 테스트 🚀 고오오급
- 에빙하우스 망각곡선 기반 복습 알림
- 학습 후 1일, 3일, 7일, 14일, 30일 뒤 자동 테스트 알림
- 테스트 통과 시 다음 주기로 이동, 실패 시 주기 리셋
- 구현 필요 요소:
  - 알림 시스템 (Web Push Notification 또는 이메일)
  - 스케줄 관리 테이블 (복습 예정일, 완료 여부)
  - 백그라운드 작업 (Vercel Cron Jobs)

```sql
-- 복습 스케줄 테이블
create table review_schedules (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  score integer,
  cycle integer default 1  -- 1일/3일/7일/14일/30일
);
```

---

## 구현 우선순위

```
Priority 1 — 커스텀 카테고리 UI (쉬움, 임팩트 큼) — DB 완료, UI만 남음
  └─ 카테고리 선택 화면에 "+ 추가" 버튼 구현

Priority 2 — URL 교재 기능 (중간, 차별화 큼)
  └─ Cheerio 설치 + API Route 수정 + UI 추가
  └─ Cloyee의 핵심 차별화 포인트가 될 수 있음

Priority 3 — 학습 후 자동 퀴즈 + 언제든지 테스트 (중간)
  └─ 학습 완료 후 퀴즈 생성 API 추가
  └─ 객관식/단답형 UI 구현 (ChoiceButtons 재활용 가능)

Priority 4 — 스케줄 테스트 🚀 고오오급 (어려움, 임팩트 매우 큼)
  └─ 에빙하우스 망각곡선 기반 복습 알림
  └─ Vercel Cron Jobs + Web Push 알림 구현
  └─ review_schedules 테이블 추가

Priority 5 — 태블릿 펜 입력 + 음성 지원 (중간 난이도, UX 차별화)
  └─ Web Speech API로 음성은 비교적 빠르게 구현 가능
  └─ 펜 입력은 OCR 연동 필요

Priority 6 — 외부 서비스 연동 (Velog/노션/Slack)
  └─ 노션/Slack은 OAuth 구현 필요
  └─ Velog는 클립보드 복사 방식으로 빠르게 구현 가능
```

---

## Idea 4. 사용자 AI 모델 선택

### 배경
다중 사용자 서비스에서 모든 사용자에게 동일한 모델을 강요할 필요 없음.
비용 민감도, 성능 요구사항이 사용자마다 다르기 때문.

### 방향
- 사용자가 설정 페이지에서 모델 직접 선택
- 무료/유료 티어와 연동 가능
- 본인 API 키 사용 시 원하는 모델 자유롭게 선택

### 모델 티어 구성 (예시)
```
⚡ 빠른 응답 — claude-haiku-4-5    (무료 티어)
🧠 균형잡힌 — claude-sonnet-4-6   (유료 티어) ← 현재 Cloyee 기본값
🚀 최고 성능 — claude-opus-4-6    (유료 티어 고급)
```

### 비용 비교 (2026.03 기준)
| 모델 | Input | Output | 비고 |
|------|-------|--------|------|
| claude-haiku-4-5 | $0.80/MTok | $4/MTok | 무료 티어 제공 가능 |
| claude-sonnet-4-6 | $3/MTok | $15/MTok | 현재 사용 중 |
| claude-opus-4-6 | $15/MTok | $75/MTok | 고급 유료 티어 |

### 구현 방법
- 설정 페이지에 모델 선택 UI 추가
- 선택한 모델을 Supabase profiles 테이블에 저장
- API Route에서 사용자 설정 모델을 동적으로 받아서 호출

```javascript
// API Route에서
const model = user.preferred_model ?? 'claude-sonnet-4-6'
const response = await client.messages.create({ model, ... })
```

### DB 변경
```sql
alter table profiles add column preferred_model varchar(50) 
  default 'claude-sonnet-4-6';
```

---

## Idea 5. 태블릿 펜 입력 지원

### 배경
태블릿 사용자가 펜으로 필기하듯 학습 내용을 입력할 수 있는 환경 필요.

### 방향
- Canvas API 기반 필기 입력 → 텍스트 변환 (OCR) 후 Cloyee에 전달

### 구현 방법
- Web Canvas API + HWR(Handwriting Recognition) API 또는 외부 OCR 서비스 연동

### 우선순위
Priority 5

---

## Idea 6. 음성 입력/출력 지원

### 배경
타이핑 없이 말로 대화하듯 학습하고 싶은 사용자 니즈.

### 방향
- **입력**: Web Speech API (STT) 로 음성 → 텍스트 변환 후 전송
- **출력**: Web Speech API (TTS) 로 Cloyee 답변을 음성으로 읽어주기

### 구현 방법
- 브라우저 내장 Web Speech API 활용 (별도 서버 불필요)

### 우선순위
Priority 5

---

## Idea 7. 요약 노트 블로그 게시 (Velog 등)

### 배경
학습 완료 후 생성된 요약 문서를 블로그에 바로 올리고 싶은 니즈.

### 방향
- **Velog**: Velog는 공식 API 미제공 → 마크다운 복사 후 수동 게시 안내
- **향후**: Medium API, Dev.to API 등 공식 API 제공 플랫폼 우선 연동

### 구현 방법
- 요약 페이지에 "블로그에 게시" 버튼 → 마크다운 클립보드 복사 + 해당 블로그 에디터 페이지 새 탭 오픈

### 우선순위
Priority 6

---

## Idea 8. 노션 연동

### 배경
노션을 지식 베이스로 활용하는 사용자가 학습 기록을 노션에 자동 저장하고 싶은 니즈.

### 방향
- 학습 완료 시 노션 페이지 자동 생성
- 노션 DB에 학습 기록 누적 저장

### 구현 방법
- Notion API + OAuth 연동, 사용자가 연결할 노션 워크스페이스/DB 선택

### 우선순위
Priority 6

---

## Idea 9. Slack 연동

### 배경
팀 단위로 Cloyee를 활용하거나 학습 완료 알림을 Slack으로 받고 싶은 니즈.

### 방향
- 학습 완료 시 지정 채널에 요약 자동 전송
- 개인 DM으로 복습 리마인더 전송 (Idea 3 스케줄 테스트와 연동)

### 구현 방법
- Slack Incoming Webhook 또는 Slack API + OAuth

### 우선순위
Priority 6

---

> 이 문서는 v2 개발 시작 시 업데이트합니다 🌱
