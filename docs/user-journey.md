# Cloyee 사용자 여정 (User Journey)

> 최종 업데이트: 2026-03-22 | 코드베이스 기반 실제 동작 기준

---

## 전체 여정 맵

```
[랜딩 /]
    │
    ├─ 로그인된 유저 → /dashboard (자동 리다이렉트)
    │
    └─ 미로그인 유저
           │
           ▼
       [로그인 /login]
       소셜(Google/GitHub) / 이메일+비번 / Magic Link / 게스트
           │
           ├─ 게스트 → /dashboard (데이터 미저장)
           │
           └─ 로그인 성공
                  │
                  ├─ onboarding_done = false → /onboarding
                  │
                  └─ onboarding_done = true → /dashboard
```

---

## 1. 랜딩 페이지 (`/`)

**대상**: 미로그인 사용자

| 섹션 | 내용 |
|------|------|
| Hero | 앱 소개 + Google 로그인 버튼 |
| 핵심 기능 | 소크라테스식 학습 / 이해도 점수 / 성장 시각화 |
| How it works | 1. 카테고리 선택 → 2. AI 대화 학습 → 3. 기록 & 복습 |
| 타겟 유저 | 부트캠프 수강생 / 취준 개발자 / 현직 개발자 |
| 하단 CTA | 로그인 버튼 + 개인정보처리방침/이용약관 |

---

## 2. 로그인 (`/login`)

**4가지 로그인 방식**

1. **Google OAuth** — 팝업/리다이렉트
2. **GitHub OAuth** — InstructorCloyee 앱
3. **이메일+비밀번호** — 로그인/회원가입 자동 분기
4. **Magic Link** — token_hash 방식 (크로스 브라우저 대응)
5. **게스트 모드** — 로그인 없이 진입, user_id = NULL

**콜백 처리**: `/auth/callback` — code(OAuth) + token_hash(Magic Link) 처리

---

## 3. 온보딩 (`/onboarding`)

**조건**: 로그인 유저 중 `profiles.onboarding_done = false`인 경우만 진입

**3단계 스텝**

```
Step 1 — 직군 선택
    개발자 💻 / 기획자 📋 / 디자이너 🎨 / 기타 ✨

Step 2 — 현재 레벨
    경력: 1년 미만 / 1~3년 / 3~5년 / 5년 이상
    자가평가: 입문 / 초급 / 중급 / 고급

Step 3 — 첫 로드맵 설정 (건너뛰기 가능)
    - 학습 주제 (필수)
    - 카테고리 선택
    - 관심도 (별점 1~5)
    - 현재/목표 지식 수준
    - 참고 URL
    - 학습 기간 / 난이도 / 메모
```

**완료 후**: `profiles.onboarding_done = true` 저장 → `/dashboard`

---

## 4. 대시보드 (`/dashboard`)

**표시 정보**

| 섹션 | 내용 |
|------|------|
| 통계 4개 | 총 학습일 / 연속 학습 streak / 이번 주 세션 수 / 현재 레벨 |
| 학습 시작하기 | 활성 로드맵 카드 (상태 뱃지: ⚪시작 전 / 🟡진행 중 / ✅완료) |
| 최근 학습 | 완료된 세션 3개 (→ /history 전체 보기 링크) |

**빈 상태**: 로드맵 없으면 "학습 추가하기" CTA 표시

---

## 5. 학습 관리 (`/study`)

**내 로드맵 목록** (로그인 필수)

- **active** 로드맵: 카드 그리드로 표시
- **paused** 로드맵: 보관함 섹션 (1개 이상일 때만)
- "새 로드맵 추가" 버튼 → `/study/new`
- 게스트가 로드맵 추가 버튼 클릭 시 → 로그인 유도 모달 표시 분기

**카테고리 관리** (페이지 하단)

- 기본 카테고리(is_default=true) + 유저 커스텀 카테고리 목록 표시
- 로그인 유저: "+ 카테고리 추가" 버튼 → Dialog 모달 (이모지 + 이름 입력)
- 커스텀 카테고리 호버 시 X 버튼 → 삭제 (본인 카테고리만)
- 게스트: 추가 버튼 숨김, 목록만 표시

---

## 6. 로드맵 추가 (`/study/new`)

**로그인 필수** (비로그인 시 → `/login`)

입력 필드: 학습 주제(필수) / 카테고리 / 관심도 / 현재·목표 수준 / 참고 URL / 기간 / 난이도 / 메모

완료 후 → `/dashboard`

---

## 7. 채팅 학습 (`/study/chat?roadmap_id=...`)

**핵심 플로우**

### 7-1. 진입 분기

```
진입
 │
 ├─ session_id 파라미터 있음 → 이전 세션 복원 (이어하기)
 │
 ├─ sessionStorage에 저장된 진행 중 학습 있음 → 바로 복원 (플로우 생략)
 │
 └─ 신규 진입
        │
        ├─ 이전 학습 기록 있음 (lastSession 존재)
        │   → "다시 돌아오셨군요!" 복습 제안
        │       ├─ 📖 복습하고 시작 → 지난 학습 요약 표시 → 방식 선택
        │       └─ ▶ 바로 이어서 → 방식 선택
        │
        └─ 이전 기록 없음 (첫 학습)
            → "오늘도 함께 공부해봐요!" 방식 선택
```

### 7-2. 학습 방식 선택

| 방식 | 설명 |
|------|------|
| 💬 대화형 | 소크라테스식 자유 대화 |
| ✅ 선택형 | 4지선다 문제 + 선택 시 opacity 0.35 흐려짐 + 300ms 딜레이 후 자동 전송 |

### 7-3. 학습 진행

- AI가 SSE 스트리밍으로 실시간 청크 출력
- 문항 카운트: "N문항 학습 중" (1문항 이상, 학습 중에만 표시)
- score: 학습 중 숨김, 완료 시 평균 계산
- "오늘은 여기까지" 버튼: 중단 세션 저장 → `/dashboard`

### 7-4. 학습 완료 (`is_complete = true`)

1. CompleteBanner: "학습 완료! 오늘의 이해도 N점"
2. sessions + reviews DB 저장 (sessionStorage 클리어)
3. 2초 후 → `/history` 자동 이동

---

## 8. 코드 리뷰 (`/study/review?category=...`)

**플로우**

```
/study (또는 카테고리 선택)
    │
    ▼
코드 입력 단계 (phase: "input")
    - 언어 선택 (JS / TS / Python / Java / C++ / Go / Rust / SQL / CSS / HTML / 기타)
    - Monaco Editor로 코드 붙여넣기 (최대 50,000자)
    - "리뷰 시작" 버튼 클릭
    │
    ▼
리뷰 진행 단계 (phase: "reviewing")
    - 데스크톱: 왼쪽 코드 패널 + 오른쪽 채팅 패널 (2분할)
    - 모바일: "리뷰 / 코드" 탭 전환
    - Cloyee가 대화형으로 리뷰 제공 (일반 JSON 응답, 스트리밍 미사용)
    - 헤더에 현재 점수 프로그레스 바 실시간 표시
    - 추가 질문 가능 (textarea 입력)
    │
    ▼
리뷰 완료 (is_complete = true)
    - CompleteBanner: "리뷰 완료! 코드 점수 N점"
    - sessions(mode: "review") + reviews(code 포함) DB 저장
    - 2초 후 → /history 자동 이동
```

---

## 9. 학습 기록 (`/history`, `/history/[id]`)

- **완료된 세션만** 표시 (`is_complete = true`), 탭 없이 단순화
- 세션 클릭 → 상세: 대화 내용, 점수, 요약

---

## 10. 성장 시각화 (`/growth`)

- 레벨, streak, 카테고리별 학습량 차트
- 통계 기반 성장 추이 확인

---

## 11. 마이 페이지 (`/my`)

- 로그인 필수 (middleware에서 보호)
- 프로필 정보, 설정

---

## 12. 어드민 (`/admin`)

**접근 조건**: 로그인 + `profiles.is_admin = true`

- 비로그인 → `/login` 리다이렉트 (middleware)
- `is_admin = false` → `/dashboard` 리다이렉트 (layout)
- 기존 Sidebar 미사용, 어드민 전용 상단 네비 (사용자 / 카테고리 / 피드백 탭)

| 경로 | 내용 |
|------|------|
| `/admin/users` | 전체 사용자 목록 (ID 8자리, 직군, 가입일, 완료 세션 수, 어드민 여부) |
| `/admin/categories` | 전체 카테고리 목록 + 기본 카테고리 추가/삭제 |
| `/admin/feedback` | 피드백 기능 준비 중 (placeholder) |

---

## 사용자 유형별 여정 요약

### 신규 유저 (최초 방문)
```
/ → /login → /onboarding (3단계) → /dashboard → /study/new → /study/chat → 완료 → /history
```

### 재방문 유저 — 학습 대화
```
/ → /dashboard (자동) → 로드맵 클릭 → /study/chat → 복습 제안 → 방식 선택 → 학습 → 완료 → /history
```

### 재방문 유저 — 코드 리뷰
```
/ → /dashboard (자동) → /study/review → 코드 붙여넣기 → 리뷰 시작 → 대화형 리뷰 → 완료 → /history
```

### 게스트 유저
```
/ → /login (게스트 버튼) → /dashboard → /study/chat → 학습 (데이터 미저장)
```

---

## 주요 상태 & 조건 정리

| 조건 | 동작 |
|------|------|
| 로그인 + onboarding_done=false | `/dashboard` 접근 시 → `/onboarding` 리다이렉트 |
| 미로그인 + `/my` 접근 | middleware → `/login` 리다이렉트 |
| 로그인 + `/` 접근 | → `/dashboard` 리다이렉트 |
| sessionStorage 복원 가능 | 채팅 플로우 인사 생략, 바로 학습 재개 |
| is_complete=true + choices 동시 수신 | is_complete 무시 (질문 진행 중) |
| 게스트 데이터 | user_id = NULL, RLS 정책상 모두 접근 가능 |
