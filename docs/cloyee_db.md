# Cloyee DB 설계
> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.24 | 버전: v0.2 | DB: Supabase (PostgreSQL)
> Supabase 프로젝트: InstructorCloyee (fycowopnxqjkpyjarwul)

---

## 테이블 구조 overview

```
auth.users (Supabase Auth)
    │
    ├── profiles          ← 사용자 프로필 (트리거 자동 생성)
    │
    ├── feedback          ← 사용자 피드백 (user_id nullable)
    │
    └── categories ───┐
                      ├── roadmaps   ← 학습 로드맵 (sessions와 연결)
                      │
                      └── sessions ──┬── reviews
```

---

## 테이블 상세

### 1. categories (카테고리)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, 자동 생성 |
| name | varchar(50) | 카테고리명 (예: 개발) |
| icon | varchar(10) | 이모지 아이콘 (예: 💻) |
| is_default | boolean | 기본 카테고리 여부 |
| user_id | uuid | FK → auth.users(id), NULL이면 기본 카테고리 |
| created_at | timestamp | 생성일시 |

**기본 데이터 (user_id = NULL, is_default = true):**
```
개발 / 💻 / true
기획 / 📐 / true
디자인 / 🎨 / true
AI 활용 / 🤖 / true
```

**RLS 정책:**
- SELECT: `user_id IS NULL` (기본 카테고리) OR `auth.uid() = user_id` (본인 것)
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

---

### 2. profiles (사용자 프로필)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, FK → auth.users(id) |
| job_role | varchar | 직군 (예: 프론트엔드) |
| experience | varchar | 경력 (예: 5년~10년) |
| level | varchar | 레벨 (예: 중급) |
| onboarding_done | boolean | 온보딩 완료 여부 |
| is_admin | boolean | 어드민 여부 (default: false) |
| category_order | jsonb | 카테고리 표시 순서 |
| created_at | timestamp | 생성일시 |
| updated_at | timestamp | 수정일시 |

> 신규 사용자 가입 시 `handle_new_user` 트리거로 자동 생성됨

---

### 3. roadmaps (학습 로드맵)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, 자동 생성 |
| category_id | uuid | FK → categories.id |
| user_id | uuid | FK → auth.users(id) |
| topic | varchar | 학습 주제 (예: React useEffect) |
| level | varchar | 난이도 (예: 초급 / 중급 / 고급) |
| status | varchar | 상태 (`active` / `paused` / `completed`) |
| chapters | jsonb | 교안 챕터 목록 (v0.3 예정, 현재 미사용) |
| created_at | timestamp | 생성일시 |

> `chapters` 컬럼은 v0.3 스텝 분할 방식으로 재사용 예정, DB에 유지 중

---

### 4. sessions (학습 세션)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, 자동 생성 |
| category_id | uuid | FK → categories.id |
| roadmap_id | uuid | FK → roadmaps.id (선택) |
| user_id | uuid | FK → auth.users(id), NULL이면 게스트 |
| title | varchar(100) | 학습 주제 |
| mode | varchar(20) | 학습 모드 (chat / review) |
| summary | text | 대화 요약 (Claude 생성) |
| score | integer | 이해도 점수 (0~100, 완료 시 assistant 메시지 평균) |
| duration | integer | 학습 시간 (분) |
| is_complete | boolean | 학습 완료 여부 (default: false) |
| created_at | timestamp | 생성일시 |

**RLS 정책:**
- SELECT: `auth.uid() = user_id` OR `user_id IS NULL` (게스트 세션)
- INSERT: `auth.uid() = user_id` OR `user_id IS NULL`

> ⚠️ user_id = NULL 게스트 데이터는 RLS 상 누구나 조회 가능한 상태 (알려진 제약사항)

---

### 5. reviews (코드 리뷰)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, 자동 생성 |
| session_id | uuid | FK → sessions.id |
| user_id | uuid | FK → auth.users(id), NULL이면 게스트 |
| code | text | 입력한 코드 원문 (NOT NULL 제약 해제 상태) |
| good_points | text | 잘 된 점 (Claude 생성) |
| improve_points | text | 개선할 점 (Claude 생성) |
| messages | jsonb | 리뷰 대화 전체 히스토리 |
| created_at | timestamp | 생성일시 |

**RLS 정책:**
- SELECT/INSERT: sessions 테이블 조인으로 소유권 확인

---

### 6. feedback (피드백)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK, 자동 생성 |
| user_id | uuid | FK → auth.users(id), NULL이면 게스트 |
| category | text | 피드백 유형 (`bug` / `suggestion` / `other`) |
| content | text | 피드백 내용 |
| created_at | timestamp | 생성일시 |

**RLS 정책:**
- INSERT: 전체 허용 (로그인/게스트 모두)
- SELECT: 서버 클라이언트 전용 (어드민 페이지에서 `createServerClient`로 조회)

---

## 성장 데이터 집계 방식

growth 테이블 없이 sessions 테이블에서 집계로 처리.
**is_complete = true인 세션만** 성장/기록 집계에 포함.

| 데이터 | 집계 방법 |
|--------|-----------|
| 총 학습일 | sessions.created_at 날짜 기준 distinct count |
| 연속 학습 streak | sessions.created_at 날짜 연속 여부 계산 |
| 카테고리별 학습 횟수 | sessions.category_id 기준 group by count |
| 현재 레벨 | 총 학습 세션 수 기준 계산 |

---

## 레벨 산정 기준

| 레벨 | 누적 세션 수 |
|------|-------------|
| Lv.1 | 0 ~ 4 |
| Lv.2 | 5 ~ 9 |
| Lv.3 | 10 ~ 19 |
| Lv.4 | 20 ~ 34 |
| Lv.5 | 35 ~ |

---

## 주요 마이그레이션 SQL (누적)

```sql
-- v0.1: 기본 테이블 생성
create table categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  icon varchar(10),
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  title varchar(100) not null,
  mode varchar(20) not null check (mode in ('chat', 'review')),
  summary text,
  score integer check (score >= 0 and score <= 100),
  duration integer,
  created_at timestamp with time zone default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  code text,
  good_points text,
  improve_points text,
  created_at timestamp with time zone default now()
);

-- v0.1: 기본 카테고리 데이터
insert into categories (name, icon, is_default) values
  ('개발', '💻', true),
  ('기획', '📐', true),
  ('디자인', '🎨', true),
  ('AI 활용', '🤖', true);

-- v0.1: reviews.messages 컬럼 추가 (이슈 #6)
ALTER TABLE reviews ADD COLUMN messages jsonb;

-- v0.1: reviews.code NOT NULL 제약 해제 (이슈 #7)
ALTER TABLE reviews ALTER COLUMN code DROP NOT NULL;

-- v0.2: 인증 전환 — user_id 컬럼 추가
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- v0.2: sessions.is_complete 컬럼 추가
ALTER TABLE sessions ADD COLUMN is_complete boolean default false;

-- v0.2: roadmaps 테이블 생성
create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  user_id uuid references auth.users(id) on delete cascade,
  topic varchar not null,
  level varchar,
  chapters jsonb,
  created_at timestamp with time zone default now()
);

-- v0.2: sessions.roadmap_id 컬럼 추가
ALTER TABLE sessions ADD COLUMN roadmap_id UUID REFERENCES roadmaps(id);

-- v0.2: profiles 테이블 + 트리거
create table profiles (
  id uuid references auth.users(id) primary key,
  job_role varchar,
  experience varchar,
  level varchar,
  onboarding_done boolean default false,
  category_order jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- handle_new_user 트리거 (Supabase 대시보드에서 설정)
-- 신규 사용자 가입 시 profiles 레코드 자동 생성

-- v0.2: profiles.is_admin 컬럼 추가 (어드민 페이지 접근 제어)
ALTER TABLE profiles ADD COLUMN is_admin boolean default false;

-- v0.2: roadmaps.status 컬럼 추가
ALTER TABLE roadmaps ADD COLUMN status varchar default 'active';

-- v0.2: feedback 테이블 생성
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('bug', 'suggestion', 'other')),
  content text not null,
  created_at timestamptz default now()
);
```

---

> 이 문서는 Cloyee 프로젝트 진행과 함께 계속 업데이트됩니다.
