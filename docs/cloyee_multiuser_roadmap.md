# Cloyee 다중 사용자 서비스 전환 로드맵

> 최초 작성: 2026.03 | 최종 업데이트: 2026.03.22
> 현재 상태: Phase 1~3 완료, Phase 4 예정

---

## 현재 상태 (v0.2 — 다중 사용자 전환 완료)

- ✅ Supabase Auth 연동 완료
- ✅ Google / GitHub / 이메일 / Magic Link 로그인
- ✅ 게스트 모드 (user_id = NULL 허용)
- ✅ DB 모든 테이블에 user_id 컬럼 추가
- ✅ RLS(Row Level Security) 활성화
- ✅ 미들웨어로 `/my` 경로 보호 (나머지 게스트 허용)
- ✅ sessionStorage로 대화 임시 저장 (키: `cloyee_chat_{id}`)

---

## Phase별 진행 현황

### Phase 1 — 단일 사용자 MVP ✅ 완료 (2026.03.14)

- 기능 완성 + 안정화
- 카테고리, 학습 대화, 코드 리뷰, 학습 기록, 성장 시각화
- Vercel 배포

---

### Phase 2 — 인증 추가 ✅ 완료 (2026.03.15)

- Supabase Auth 연동
- Google OAuth (프로덕션 앱 게시 완료)
- GitHub OAuth (InstructorCloyee 앱, callback URL 수정 완료)
- 이메일+비밀번호 (계정 없으면 자동 signUp)
- Magic Link (token_hash 방식, 크로스 브라우저 대응)
- 게스트 모드 (데이터 미저장, user_id = NULL)
- 미들웨어 보호 (`/my`만 필수, 나머지 허용)
- 로그인 페이지 탭 UI (`/login`)
- 사이드바 로그아웃 버튼 + 게스트 모드 UI
- Magic Link 이메일 템플릿 커스텀

---

### Phase 3 — 다중 사용자 DB 전환 ✅ 완료 (2026.03.15)

```sql
-- 실행 완료된 마이그레이션
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

- RLS 정책 활성화 완료
  - categories: `user_id IS NULL` (기본) OR `auth.uid() = user_id` (본인)
  - sessions: `auth.uid() = user_id` OR `user_id IS NULL` (게스트)
  - reviews: sessions 조인으로 소유권 확인
- API Route 인증 처리: 게스트 허용 (user_id = NULL로 저장)
- profiles 테이블 + handle_new_user 트리거 추가
- roadmaps 테이블 추가 + sessions.roadmap_id 컬럼 연결

**알려진 제약사항:**
> user_id = NULL 게스트 데이터는 RLS 상 누구나 조회 가능.
> 추후 익명 auth(anonymous auth)로 개선 고려.

---

### Phase 4 — 사용량 제한 + 과금 📋 예정

- 무료/유료 티어 구분
- 사용자별 일일 사용 횟수 제한

```sql
-- 구현 예시: 오늘 사용 횟수 조회
select count(*) from sessions
where user_id = auth.uid()
and created_at >= current_date;
```

- Stripe 결제 연동
- 사용자 대시보드 (내 사용량 확인)

---

### Phase 5 — 운영 안정화 📋 예정

- 에러 모니터링 (Sentry)
- 분석 (Mixpanel 또는 PostHog)
- 성능 최적화

---

## 사용자별 카테고리 (구현 완료)

- 기본 카테고리: `is_default: true`, `user_id: NULL` → 모든 사용자 공유
- 커스텀 카테고리: `user_id` 기반으로 분리 (DB 준비 완료, UI 구현 예정)

---

## API 비용 관리

다중 사용자 시 API 비용 증가 우려 → `docs/AI 토큰 비용 및 최적화 전략.md` 참고

현재 적용 중:
- claude-haiku-4-5 사용 (저비용, 개발 단계)

미적용 (권장):
- 히스토리 슬라이싱 (최근 6~10턴만 전송) — P2

---

> 이 문서는 Cloyee 서비스 확장 단계에서 업데이트됩니다.
