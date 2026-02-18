# Phase 2: 게스트 인증 + 대화 히스토리 + 비용 제어

Status: IN PROGRESS (updated on 2026-02-18, open items tracked below)  
Priority: HIGH  
Depends on: Phase 1  
Working branch: `feature/phase-2-guest-auth-history`

## Goal

로그인 없이도 서비스를 즉시 사용할 수 있는 게스트 세션을 구현하고, 대화를 저장/관리하는 히스토리 기능을 추가한다. LLM 토큰 비용을 제어하는 장치를 함께 구축한다.

## Scope Boundary (Phase 2 Non-Goals)

- 브라우저 쿠키/로컬스토리지 초기화 우회(게스트 한도 리셋 악용) 완전 방지는 이번 단계 범위에서 제외
- IP/device fingerprint/CAPTCHA 기반 anti-abuse 도입은 보류
- 동일 기기 다계정 정책 강제는 보류
- 위 항목은 초기 트래픽 단계에서 리스크 수용하고, 사용자/트래픽 증가 시 Phase 3+에서 재평가

## Architecture

```
방문자 → 게스트 세션 (sessionId: UUID, localStorage)
         ↓
       AI 채팅
         ↓
       저장/히스토리 접근 시 → 로그인 유도 모달
         ↓
       OAuth 로그인 (Google/Kakao)
         ↓
       세션 병합 (게스트 대화 → 유저 계정 귀속)
```

## API Contract (핵심)

| Endpoint | Auth | Request (핵심 필드) | Success | Error / Note |
| --- | --- | --- | --- | --- |
| `POST /api/chat` | optional (guest/user) | `messages`(required), `sessionId?`, `conversationId?`, `id?` | stream 응답 + 저장 성공 시 conversation 갱신 | `429` 시 `{ error: "Rate limit exceeded", reason }`; conversation 식별 우선순위는 `conversationId` -> `id` |
| `POST /api/auth/merge-session` | required | `sessionId?`, `sessionIds?` (header/cookie 포함 최소 1개 필요) | `{ success: true, mergedCount, refreshedSessionId }` | 세션 후보가 없으면 `400` (`sessionId or sessionIds is required`) |
| `GET /api/conversations` | required | `q?` | `{ conversations: [...] }` | 미인증 `401` |
| `GET /api/conversations/:id` | required | path `id` | `{ conversation }` | 없으면 `404`, 소유자 불일치 `403` |

## Current Implementation Snapshot

- 인증: NextAuth(google/kakao) + Prisma Adapter 연동 완료
- 세션: `travel_session_id` 기반 게스트 세션(localStorage, httpOnly cookie, 7일 TTL) 적용
- 세션 추출: API 공통 추출 유틸(cookie -> header -> body) 적용
- 병합: 로그인 시 `/api/auth/merge-session`으로 게스트 대화 `userId` 귀속 (다중 sessionId 지원)
- 로그인 대화 저장: 인증 사용자는 대화 생성 시점부터 `userId`로 직접 저장
- 히스토리: 사이드바 목록/상세 로드/삭제/새 대화 시작 구현
- 비용 제어: Sliding Window + rate limiting + 429 에러 UI 처리(로그인 유도)
  - 게스트: DB 기반 영속 한도 체크(기본), 실패 시 in-memory fallback
  - 로그인: `userId` 키 기반 in-memory 한도 체크
- 프롬프트: 시스템 프롬프트에 이전 대화 요약 슬롯 추가(기본값 NONE)
- 정리 작업: 7일 지난 guest conversation 삭제 BullMQ worker 스케줄 등록

## Tasks

### P2-1: 게스트 세션 관리

- [x] P2-1-T1: sessionId 생성 로직 (UUID v4, 브라우저 cookie/localStorage 저장)
- [x] P2-1-T2: API route에서 sessionId 추출 미들웨어
- [x] P2-1-T3: `TravelConversation.sessionId`로 게스트 대화 저장 (userId=null)
- [x] P2-1-T4: 게스트 세션 만료 정책 (7일 TTL, worker 스케줄러로 자동 삭제)
- [x] P2-1-T5: 게스트 데이터 정리 worker job 구현

### P2-2: OAuth 인증 연동

**기존 인프라**: `apps/web`에서 NextAuth 사용 중 (Google/Kakao OAuth)

- [x] P2-2-T1: apps/travel에 NextAuth 설정 (기존 `packages/db`의 User 모델 공유)
- [x] P2-2-T2: Google OAuth provider 설정
- [x] P2-2-T3: Kakao OAuth provider 설정
- [x] P2-2-T4: 로그인/로그아웃 API route 구현
- [x] P2-2-T5: 인증 상태 관리 (SessionProvider, useSession)

### P2-3: 로그인 유도 모달

- [x] P2-3-T1: 로그인 유도 모달 UI 컴포넌트 (부드러운 UX, 강제 차단 아님)
- [x] P2-3-T2: 트리거 포인트 정의 및 구현
- [x] P2-3-T3: "나중에" 버튼으로 모달 닫기 (계속 게스트로 사용 가능)
- [x] P2-3-T4: 모달 내 소셜 로그인 버튼 (Google, Kakao)

### P2-4: 세션 병합

- [x] P2-4-T1: 로그인 성공 시 게스트 sessionId → userId 매핑 로직
- [x] P2-4-T2: 여러 기기에서 같은 사용자가 게스트로 사용한 경우 병합 처리
- [x] P2-4-T3: 병합 후 sessionId 쿠키 갱신

### P2-5: 대화 히스토리 UI

- [x] P2-5-T1: 사이드바 대화 목록 UI (제목, 날짜, 미리보기)
- [x] P2-5-T2: 대화 이어가기 기능 (기존 대화 로드 → 채팅 패널에 표시)
- [x] P2-5-T3: 대화 제목 자동 생성 (첫 메시지 기반, 또는 LLM 요약)
- [x] P2-5-T4: 대화 검색 기능 (제목 기준 검색)
- [x] P2-5-T5: 대화 삭제 기능
- [x] P2-5-T6: 새 대화 시작 버튼
- [x] P2-5-T7: 대화 목록 API endpoints 구현

### P2-6: Sliding Window 컨텍스트 관리

- [x] P2-6-T1: 최근 N턴만 LLM 컨텍스트에 포함하는 로직 구현 (기본값: 10턴)
- [x] P2-6-T2: `apps/travel/src/app/api/chat/route.ts` 수정 - 메시지 슬라이싱
- [x] P2-6-T3: 시스템 프롬프트에 "이전 대화 요약" 슬롯 추가 (Phase 5에서 활용)
- [x] P2-6-T4: 컨텍스트 윈도우 크기 환경 변수로 설정 가능하게

### P2-7: 사용 제한 (Rate Limiting)

- [x] P2-7-T1: 게스트 사용 제한 정책 정의  
  게스트: 하루 1대화, 대화당 5턴 / 로그인: 하루 20대화, 대화당 50턴
- [x] P2-7-T2: Rate limiter 구현
  - guest: DB persistent check + in-memory fallback
  - user: in-memory check (`userId` key)
- [x] P2-7-T3: 제한 초과 시 안내 메시지 UI
- [x] P2-7-T4: 제한 카운터 리셋 로직 (일일 리셋)
  - 현재 구현 기준: 서버 런타임 로컬 타임존 기준으로 일일 윈도우 계산
  - 운영 정책 목표: KST(Asia/Seoul) 00:00 리셋으로 명시/고정

## Open Items (Exit Criteria / Owner / Due Date)

| Item | Owner | Due Date | Exit Criteria |
| --- | --- | --- | --- |
| OI-01 운영 cleanup 실행 검증 | Marco | 2026-02-20 | worker 로그에 `travel-guest-cleanup` 1회 이상 성공 + 삭제 건수 확인 |
| OI-02 Auth/대화 복원 장애 대응 Runbook 확정 | Marco | 2026-02-20 | 아래 Runbook 절차로 재현/복구 가능, on-call 체크리스트 완료 |
| OI-03 배포 전 env preflight 점검 | Marco | 2026-02-19 | 필수 env 누락 시 로그인/콜백 요청이 5xx 없이 사전 실패로 감지 |
| OI-04 Rate limit 리셋 시간대 고정 | Marco | 2026-02-21 | 운영 리셋 기준을 KST 00:00으로 코드/문서 일치 |

## DB Schema Changes

완료:

```prisma
model TravelConversation {
  messageCount Int @default(0) // 턴 수 추적
}
```

## Acceptance Criteria

- [x] 비로그인 사용자가 즉시 AI 채팅 가능
- [x] 로그인 후 게스트 때 나눈 대화가 계정에 보존
- [x] 사이드바에서 이전 대화 목록 확인 및 이어가기 가능
- [x] 대화 검색, 삭제, 제목 수정 동작
- [x] 10턴 이상 대화해도 LLM 비용이 선형 증가하지 않음 (sliding window, 기본 10턴)
- [x] 게스트 사용 제한이 정상 동작 (게스트 1대화/5턴, 로그인 20대화/50턴)
- [ ] 7일 이상 된 게스트 데이터 자동 삭제 확인  
  worker schedule(`travel-guest-cleanup`) 설정 완료, 실운영 실행 검증 필요

## Operational Metrics (Phase 2)

- `guest_to_login_conversion`: guest 세션 중 로그인까지 이어진 비율
- `guest_429_rate`: guest `POST /api/chat` 중 429 비율
- `merge_session_success_rate`: `POST /api/auth/merge-session` 성공(200) 비율
- `conversation_restore_404_rate`: 로그인 직후 `GET /api/conversations/:id` 404 비율

운영 기준(초기):
- `merge_session_success_rate < 95%` 이면 즉시 조사
- `conversation_restore_404_rate > 2%` 이면 복원 로직 우선 점검
- 지표 수집은 초기에는 API 로그 집계 기반으로 주간 점검, 추후 대시보드로 전환

## Test Use Cases

### TC-01: 게스트 세션 생성/동기화

- 사전조건: 비로그인 브라우저, localStorage 초기화
- 절차: `/travel` 진입 후 첫 질문 전송
- 기대결과: `localStorage.travel_session_id` 생성, `/api/session` 호출 후 `travel_session_id` httpOnly cookie 생성, DB `TravelConversation.userId = null`

### TC-02: 로그인 유도 모달 트리거

- 사전조건: 비로그인 상태
- 절차: 대화 저장 버튼 클릭, 히스토리 버튼 클릭, 빈방 알림(북마크) 클릭
- 기대결과: 모두 `LoginPromptModal` 노출, "나중에" 클릭 시 현재 화면 유지

### TC-03: 로그인 후 세션 병합 + 세션 재발급

- 사전조건: 게스트 상태에서 대화 1개 이상 생성
- 절차: OAuth 로그인 수행
- 기대결과: `/api/auth/merge-session` 성공, 기존 guest 대화의 `userId`가 로그인 사용자로 갱신, 응답의 `refreshedSessionId`로 localStorage/cookie 교체

### TC-04: 다중 세션 병합

- 사전조건: 동일 사용자 기준 서로 다른 `sessionId`로 guest 대화 데이터 준비
- 절차: `/api/auth/merge-session`에 `sessionIds` 배열 포함 호출
- 기대결과: 전달한 복수 `sessionId`의 guest 대화가 모두 동일 사용자 `userId`로 귀속

### TC-05: 히스토리 조회/검색/수정/삭제

- 사전조건: 로그인 사용자 대화 2개 이상 존재(서로 다른 제목/내용)
- 절차: 히스토리 열기 -> 검색어 입력 -> 항목 제목 인라인 수정 -> 항목 삭제
- 기대결과: 검색은 제목 기준 서버 필터(`/api/conversations?q=...`), 제목 수정은 `PATCH /api/conversations/:id` 200, 삭제 후 목록에서 즉시 제거

### TC-06: Sliding Window 적용

- 사전조건: `CONTEXT_WINDOW_SIZE=10`
- 절차: 12턴 이상 대화 진행 후 응답 품질/속도 확인
- 기대결과: 요청은 정상 처리되고 컨텍스트 길이가 무한 증가하지 않음(최근 window 기준 유지)

### TC-07: Rate Limit 동작

- 사전조건: 비로그인 상태
- 절차: 하루 기준 정책 이상으로 요청(게스트 1대화/5턴 초과)
- 기대결과: API 429 반환, UI에 제한 안내 문구 표시 + 로그인 버튼 노출

### TC-08: worker 기반 guest cleanup 수동 검증

- 사전조건: 로컬 worker 실행(`pnpm --filter @workspace/worker dev`), DB/Redis 정상
- 절차: 7일 초과 guest 대화 1건 삽입 -> `accommodation-check-cycle` 큐에 `travel-guest-cleanup` enqueue -> worker 로그 확인
- 기대결과: worker 로그에 `[travel-guest-cleanup] ... deleted=1` 출력, DB에서 테스트 레코드 삭제 확인

```sql
-- 샘플 삽입 (9일 전 guest 대화)
insert into "TravelConversation"
  (id, "sessionId", "userId", title, "messageCount", "createdAt", "updatedAt")
values
  ('manual_cleanup_probe_x', 'session_manual_cleanup_probe_x', null, 'cleanup probe', 0, now() - interval '9 days', now() - interval '9 days');
```

```bash
# 샘플 enqueue (apps/worker에서 실행)
node -e '(async () => {
  const { Queue } = await import("bullmq");
  const Redis = (await import("ioredis")).default;
  const connection = new Redis(process.env.REDIS_URL);
  const queue = new Queue("accommodation-check-cycle", { connection });
  await queue.add("travel-guest-cleanup", { triggeredAt: new Date().toISOString(), retentionDays: 7, source: "manual-verify" });
  await queue.close();
  await connection.quit();
})();'
```

### TC-09: 로그인 직후 자동 복원(Conversation ID 정합성)

- 사전조건: 비로그인 상태에서 대화 생성 후(로컬 `travel_current_conversation` 존재), 로그인 진행
- 절차:
  1. `/api/auth/merge-session` 응답에서 `refreshedSessionId` 수신 확인
  2. 로그인 직후 클라이언트가 복원 대상으로 가진 `conversationId`로 `GET /api/conversations/:id` 호출 확인
  3. 404 발생 시 목록 `GET /api/conversations`에서 최신 대화 ID 재선택 로직 확인
- 기대결과: 로그인 후 첫 진입에서 `Conversation not found` 토스트 없이 정상 대화 화면 유지(또는 자동 fallback 후 복구)

### TC-10: `/api/chat` payload 호환성 (`conversationId` / `id`)

- 사전조건: 클라이언트 SDK가 `id` 필드만 보내는 케이스 준비
- 절차: 동일 요청을 `conversationId`만 보낸 케이스, `id`만 보낸 케이스 각각 호출
- 기대결과: 두 케이스 모두 같은 conversation으로 저장/이어쓰기 동작

## Required Env Checklist (Travel App)

- `NEXTAUTH_URL` (예: `http://localhost:3300`)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
- `DATABASE_URL`
- `REDIS_URL` (worker/cleanup 검증 시 필수)
- `CONTEXT_WINDOW_SIZE` (기본 10)
- `TRAVEL_GUEST_DAILY_LIMIT` (기본 1), `TRAVEL_GUEST_PER_CONVERSATION_LIMIT` (기본 5)

점검 규칙:
- 로그인 시도 전 `GET /api/auth/providers`가 200이어야 함
- OAuth 로그인 시작 시 `client_id is required`가 발생하면 provider env 누락으로 간주
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` 누락 경고는 배포 전 차단

## Runbook (Auth / Merge / Restore 장애 대응)

1. 증상 분류
   - `429 Rate limit exceeded`
   - `OAUTH_CALLBACK_ERROR`, `SIGNIN_OAUTH_ERROR`
   - `Conversation not found` (로그인 직후)
2. 1차 점검
   - `GET /api/auth/session` (인증 상태)
   - `POST /api/auth/merge-session` 응답(`mergedCount`, `refreshedSessionId`)
   - `GET /api/conversations`, `GET /api/conversations/:id` 상태코드 비교
3. 복구 절차
   - stale `conversationId` 404면 목록 API 최신 ID로 fallback
   - sessionId 재발급 시 localStorage/cookie 동기화 재확인
   - OAuth 에러면 provider env 즉시 재검증 후 재시도
4. cleanup 이슈 점검
   - `accommodation-check-cycle` 큐 enqueue 여부
   - worker 로그 `travel-guest-cleanup` 실행/삭제 건수 확인

## Known Gaps

- 운영 환경에서 worker `travel-guest-cleanup` 실행 검증 필요 (OI-01)
- Runbook 기반 온콜 대응 리허설 미완료 (OI-02)
- 리셋 시간대(KST 고정) 코드/운영 환경 정렬 미완료 (OI-04)

## Implemented Files (핵심)

- `apps/travel/src/hooks/useGuestSession.ts`
- `apps/travel/src/hooks/useSessionMerge.ts`
- `apps/travel/src/lib/auth.ts`
- `apps/travel/src/lib/session.ts`
- `apps/travel/src/lib/sessionServer.ts`
- `apps/travel/src/services/auth.service.ts`
- `apps/travel/src/services/conversation.service.ts`
- `apps/travel/src/services/rate-limit.service.ts`
- `apps/travel/src/app/api/auth/[...nextauth]/route.ts`
- `apps/travel/src/app/api/auth/merge-session/route.ts`
- `apps/travel/src/app/api/chat/route.ts`
- `apps/travel/src/app/api/session/route.ts`
- `apps/travel/src/app/api/conversations/route.ts`
- `apps/travel/src/app/api/conversations/[id]/route.ts`
- `apps/travel/src/app/login/page.tsx`
- `apps/travel/src/app/page.tsx`
- `apps/travel/src/components/history/HistorySidebar.tsx`
- `apps/travel/src/components/modals/LoginPromptModal.tsx`
- `apps/travel/src/components/chat/ChatPanel.tsx`
- `packages/db/prisma/schema.prisma`
- `apps/worker/src/travelGuestCleanup.ts`
- `packages/worker-shared/src/runtime/scheduler.ts`
