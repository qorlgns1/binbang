# 구글폼 운영형 MVP 테스트 가이드

> 목적: “구글폼 운영형 MVP(조건 충족/열림 확인 과금 모델)”의 핵심 운영 흐름을 로컬에서 재현/검증한다.  
> 기준 문서: `docs/backlog/google-form-ops-mvp-backlog.md`, `docs/guides/google-form-service-operations.md`

## 0. 테스트 원칙

- 판단/과금 기준은 **Q4 원문**과 **Q7 동의**만 사용한다.
- “예약/결제 완료 보장” 테스트는 범위 밖이다.
- 동일 케이스의 조건 충족(열림 확인)은 **최초 1회만 유효**하다.
- 결제 확인 전에는 모니터링 시작이 **불가능**해야 한다.

## 1. 준비물

- Node.js 24+, pnpm 10+
- Docker (PostgreSQL + Redis)
- 로컬 환경 변수 파일
  - `.env` (루트)
  - `apps/web/.env.local`

로컬 실행 방법과 필수 변수는 `docs/guides/local-development.md`를 따른다.

### 필수 환경 변수 (추가로 확인)

- `GOOGLE_FORM_WEBHOOK_SECRET`: `POST /api/intake/google-form` Webhook 시크릿

### 관리자 API 호출에 대한 주의

- `GET /api/admin/**` 및 `POST/PATCH /api/admin/**`는 **NextAuth 세션 + ADMIN role**이 필요하다.
- 로컬에서 가장 쉬운 호출 방법은:
  - 브라우저로 관리자 로그인 후, 같은 브라우저에서 API URL을 열거나
  - DevTools Console에서 `fetch('/api/admin/...')`로 호출하는 것이다(쿠키 자동 포함).

## 2. 로컬 실행 (권장 플로우)

```bash
pnpm install

cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
# .env / apps/web/.env.local 값 채우기

pnpm local:docker up -d db redis
pnpm db:migrate
pnpm db:seed

pnpm dev:web
pnpm dev:worker
```

## 3. 시드 계정

개발 시드에는 아래 계정이 포함된다.

- 관리자: `admin@example.com` / 비밀번호 `password123`
- 일반 유저: `user@example.com` / 비밀번호 `password123`

> 주의: 위 비밀번호는 **로컬 시드 전용**이며, 실서비스에서 사용/재사용하면 안 됩니다.

## 4. 빠른 확인 (시드 기반)

### 4-1. 관리자 로그인

1. 웹 접속: `http://localhost:3000`
2. 로그인 페이지에서 관리자 계정으로 로그인
3. 관리자 케이스 목록으로 이동: `/admin/cases`

### 4-2. Prisma Studio로 시드 데이터 확인(권장)

```bash
pnpm db:studio
```

Studio에서 아래 레코드들이 존재하는지 확인한다.

- `Case`: `seed_case_5` (status: `CONDITION_MET`)
- `ConditionMetEvent`: `seed_evidence_1` (caseId: `seed_case_5`)
- `BillingEvent`: `seed_billing_1` (caseId: `seed_case_5`, conditionMetEventId: `seed_evidence_1`)
- `CaseNotification`: `seed_notification_1` (caseId: `seed_case_5`, status: `SENT`)

### 4-3. “조건 충족(열림 확인)” 케이스 확인 (Case 5)

시드에는 `CONDITION_MET` 상태 케이스 1건이 포함된다(`seed_case_5`).

케이스 상세(`/admin/cases/<id>`)에서 아래를 확인한다.

- 상태가 `CONDITION_MET`
- 증거 이벤트(`ConditionMetEvent`)가 1건 이상 존재
- 과금 이벤트(`BillingEvent`)가 1건 존재
- 알림 기록(`CaseNotification`)이 존재하며 `status`, `sentAt`, `failReason`, `retryCount/maxRetries`가 표시됨

관리자 API로도 확인 가능하다(로그인된 브라우저 콘솔에서 실행).

```js
await fetch('/api/admin/cases?limit=20&status=CONDITION_MET').then((r) => r.json());
```

## 5. Webhook(폼 접수) 검증

### 5-1. Webhook 요청 보내기

`GOOGLE_FORM_WEBHOOK_SECRET`가 설정되어 있어야 한다.

요청 스키마(코드 기준):

- body: `{ responseId: string, rawPayload: Record<string, unknown> }`
- header: `x-webhook-secret: <GOOGLE_FORM_WEBHOOK_SECRET>`

```bash
curl -sS -X POST "http://localhost:3000/api/intake/google-form" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: ${GOOGLE_FORM_WEBHOOK_SECRET}" \
  -d '{
    "responseId": "manual_test_response_1",
    "rawPayload": {
      "contact_channel": "카카오톡",
      "contact_value": "user_kakao_1",
      "target_url": "https://www.airbnb.com/rooms/12345",
      "condition_definition": "2인 기준 1박 30만원 이하로 예약 가능한 상태",
      "request_window": "2026-12-31",
      "check_frequency": "30분",
      "billing_consent": true,
      "scope_consent": true
    }
  }'
```

### 5-2. 관리자 제출 목록 확인

관리자 API로 제출 목록을 확인한다.

- 목록: `GET /api/admin/submissions`
- 상세: `GET /api/admin/submissions/:id`

중복 전송(동일 `responseId`) 시 2건 생성이 아니라 **멱등 처리**가 되어야 한다.

기대 응답(코드 기준):

- 최초 수신: `201` + `{ submission: ... }`
- 동일 `responseId` 재전송: `200` + `{ submission: ..., duplicate: true }`
- secret 불일치: `401` + `{ error: "Unauthorized" }`

## 6. 케이스 파이프라인(상태 머신) 검증

아래는 “가드가 제대로 막는지”를 확인하는 체크리스트다.  
관리자 API(코드 기준) 요청/응답 스펙도 함께 적었다.

### 6-1. 케이스 생성 가드

- `REJECTED` 제출로 케이스 생성 시도는 차단되어야 한다.
- `PROCESSED` 제출로 케이스 생성 시도는 차단되어야 한다.

케이스 생성 API(코드 기준):

- `POST /api/admin/cases`
- body: `{ "submissionId": "<formSubmissionId>" }`
- 성공: `201` + `{ case: ... }`
- 실패(가드): `400` + `{ error: "<message>" }`

### 6-2. 결제 확인 전 시작 금지 (하드 게이트)

`WAITING_PAYMENT -> ACTIVE_MONITORING` 전이는 아래 조건이 모두 충족되어야 한다.

- `paymentConfirmedAt`가 존재
- `accommodationId`가 연결되어 있음

관련 API(코드 기준):

- 결제 확인: `POST /api/admin/cases/:id/payment` (body: `{ "note"?: string }`)
  - 허용: 현재 상태가 `WAITING_PAYMENT`
  - 실패 메시지 예시: `"Payment confirmation requires WAITING_PAYMENT status, current: ..."`
- 숙소 연결: `PATCH /api/admin/cases/:id/accommodation` (body: `{ "accommodationId": string }`)
  - 허용: 현재 상태가 `WAITING_PAYMENT`
  - 실패 메시지 예시: `"Accommodation link requires WAITING_PAYMENT status, current: ..."`
- 상태 전이: `PATCH /api/admin/cases/:id/status` (body: `{ "status": string, "reason"?: string }`)
  - 가드 위반 시 `400` + `{ error: "..."}`

### 6-3. 상태 전이 유효성(코드 기준)

케이스 상태 전이 규칙은 서버에서 강제된다.

- `REVIEWING -> WAITING_PAYMENT`: 모호성 AMBER/RED이면 `clarificationResolvedAt` 없을 때 차단
- `WAITING_PAYMENT -> ACTIVE_MONITORING`: 결제 확인 + 숙소 연결 없으면 차단
- `ACTIVE_MONITORING -> CONDITION_MET`: `ConditionMetEvent`가 0건이면 차단

## 7. 알림/과금 원자 트리거(P0-7) 검증 포인트

`triggerConditionMet()`는 워커 런타임에서 수행된다.

- TX 내부에서 `ConditionMetEvent` + `BillingEvent` + `CaseNotification(PENDING)` + Case 상태 전이/로그가 **같이** 생성된다.
- TX 외부에서 실제 알림 발송을 시도하고 `SENT/FAILED`로 업데이트된다.

중복 방지(코드 기준):

- `ConditionMetEvent`: `@@unique([caseId, checkLogId])`
- `BillingEvent`: `caseId @unique`, `conditionMetEventId @unique`
- `CaseNotification`: `idempotencyKey @unique` (`${caseId}:${checkLogId}`)
- 트랜잭션 중 유니크 충돌(P2002)이 나면 `alreadyTriggered: true`로 반환되어 “최초 1회만 유효”를 보장한다.

외부 플랫폼 상태(AVAILABLE/UNAVAILABLE)에 따라 E2E 재현이 흔들릴 수 있으므로, 로컬에서는 아래 2가지를 기본 검증으로 권장한다.

1. **시드 Case 5로 결과 데이터 구조 검증** (4-2)
2. **알림 재시도 경로 검증** (8)

## 8. 알림 재시도 검증

### 8-1. 수동 재시도 (관리자 API)

관리자 권한이 있어야 하며, 대상 알림이 `FAILED` 상태일 때만 재시도 가능하다(코드 기준).

- `POST /api/admin/cases/:id/notifications/:notificationId/retry`

기대 결과:

- `retryCount`가 1 증가
- 전송 성공 시 `SENT` + `sentAt` 설정
- 실패 시 `FAILED` + `failReason` 갱신

주의(코드 기준):

- 알림 전송은 카카오 토큰이 필요하다. 로컬 시드에는 카카오 토큰이 기본으로 들어있지 않으므로, 성공(`SENT`)을 기대하면 안 된다.
- 토큰이 없으면 `failReason`이 `"유효한 카카오 토큰 없음"`으로 업데이트되며, `retryCount`가 증가한다.

### 8-2. 자동 재시도 (워커 잡)

워커는 `FAILED` 또는 오래된 `PENDING` 알림을 주기적으로 재시도한다(코드 기준).

- 스케줄: `*/2 * * * *` (2분마다)
- 실행 잡 이름: `notification-retry`
- 처리 로직: `FAILED` 또는 `PENDING(updatedAt < now - 2분)`인 알림을 batch로 스캔해 claim 후 전송 시도
- 워커 로그(기대): `[notification-retry] scanned=... claimed=... sent=... failed=... skipped=...`

검증 방법(안전/무해):

1. Prisma Studio로 `seed_notification_1`의 `status`를 `FAILED`로 변경
2. `retryCount < maxRetries`를 만족하게 설정(예: `retryCount=0`, `maxRetries=3`)
3. 워커가 실행 중인지 확인(로컬에서 `pnpm dev:worker`)
4. 워커 로그에서 `notification-retry` 처리 로그를 확인
5. DB에서 아래 변화를 확인
   - `retryCount`가 증가
   - 성공하면 `SENT + sentAt`
   - 실패하면 `FAILED + failReason`

## 9. 단위 테스트 / CI 체크

```bash
pnpm test
pnpm ci:check
```

## 10. 자주 겪는 문제

- Webhook 401: `GOOGLE_FORM_WEBHOOK_SECRET` 미설정 또는 `x-webhook-secret` 불일치
- 워커가 안 뜸: `REDIS_URL` 미설정 또는 Redis 미기동
- 케이스 전이 불가: 결제 확인/숙소 연결/증거 이벤트 등 가드 조건 미충족
- 자동 재시도 로그가 안 보임: 워커 실행 중인지, Redis가 살아있는지, 알림이 `FAILED` 또는 오래된 `PENDING`인지 확인
