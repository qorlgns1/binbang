# Worker Runtime Deep Dive (BullMQ + Playwright)

## 이 문서의 목적

이 문서는 **현재 staging된 워커 리팩터링 코드**가 실제 실행 시 어떤 순서로 동작하는지, 초보자가 따라갈 수 있게 단계별로 설명합니다.

- 대상: `apps/worker`, `packages/shared/src/worker` 중심 변경

핵심 변화:

1. `node-cron + in-process limiter` 구조 제거
2. `BullMQ(Redis)` 기반 `cycle/check` 2단계 큐 구조 도입
3. `Puppeteer`에서 `Playwright` 기반 브라우저 풀로 전환
4. `shared/worker`를 `browser/jobs/runtime/observability` 도메인으로 재구성

---

## 변경 전/후 한 줄 비교

| 구분 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 스케줄링 | `node-cron`에서 직접 실행 | BullMQ `upsertJobScheduler`로 `cycle` 잡 반복 등록 |
| 병렬 처리 | 앱 내부 `createLimiter(concurrency)` | BullMQ `check worker` 동시성(`concurrency`) |
| 실행 구조 | `checkAllAccommodations()` 단일 루프 | `cycle job`이 `check job`들을 큐잉하는 2단계 구조 |
| 브라우저 | Puppeteer(+stealth) | Playwright Chromium |
| 런타임 경계 | settings/heartbeat/selectors가 혼재 | `runtime`, `observability`, `browser`, `jobs`로 분리 |
| 필수 인프라 | DB 중심 | DB + Redis 필수 (`REDIS_URL`) |

---

## 파일 기준 지도

### 엔트리/실행

- `apps/worker/src/main.ts`
- `apps/worker/src/config.ts`
- `apps/worker/src/cycleProcessor.ts`
- `apps/worker/src/checkProcessor.ts`

### 공유 런타임 모듈

- `packages/shared/src/worker/index.ts`
- `packages/shared/src/worker/jobs/types.ts`
- `packages/shared/src/worker/runtime/connection.ts`
- `packages/shared/src/worker/runtime/queues.ts`
- `packages/shared/src/worker/runtime/workers.ts`
- `packages/shared/src/worker/runtime/scheduler.ts`
- `packages/shared/src/worker/runtime/settings/index.ts`
- `packages/shared/src/worker/runtime/settings/env.ts`

### 브라우저/체커

- `packages/shared/src/worker/browser/browser.ts`
- `packages/shared/src/worker/browser/browserPool.ts`
- `packages/shared/src/worker/browser/baseChecker.ts`
- `packages/shared/src/worker/browser/airbnb.ts`
- `packages/shared/src/worker/browser/agoda.ts`
- `packages/shared/src/worker/browser/selectors/index.ts`

### 관측/알림

- `packages/shared/src/worker/observability/heartbeat/index.ts`
- `packages/shared/src/worker/observability/heartbeat/history.ts`
- `packages/shared/src/worker/observability/kakao/message.ts`

---

## 전체 실행 흐름 (큰 그림)

```text
main.ts 시작
  ├─ initConfig()            // env + DB 설정 로드
  ├─ initBrowserPool()       // Playwright 브라우저 풀 준비
  ├─ Redis 3개 연결 생성      // queue / cycleWorker / checkWorker
  ├─ Queue 생성               // cycle, check
  ├─ Worker 생성              // cycle worker(1), check worker(N)
  ├─ setupRepeatableJobs()    // cron pattern으로 cycle-trigger 등록
  ├─ startupDelay 후 cycle-trigger 1회 즉시 enqueue
  └─ 대기

cycle worker가 cycle-trigger 실행
  ├─ 활성 accommodation 조회
  ├─ checkCycle row 생성(스냅샷)
  └─ 숙소 수만큼 check job bulk enqueue

check worker들이 check job 병렬 처리
  ├─ checkAccommodation(플랫폼별 Playwright 체크)
  ├─ checkLog 저장 + 숙소 상태 업데이트
  ├─ 필요 시 카카오 알림
  └─ checkCycle success/error 카운터 원자적 업데이트

마지막 check job 완료 시
  ├─ checkCycle.completedAt/durationMs 확정
  └─ heartbeat isProcessing=false 전환
```

---

## 1) 부팅 단계 상세 (`main.ts`)

### 1-1. 설정 초기화

`initConfig()`에서 아래를 수행합니다.

1. `validateWorkerEnv()`로 필수 env 검사
2. `loadSettings()`로 DB 설정 캐시 로드
3. `concurrency = min(worker.concurrency, worker.browserPoolSize)` 계산
4. `redisUrl`, `schedule`, `startupDelay` 등 런타임 값 확정

중요: 필수 env는 현재 `DATABASE_URL`, `REDIS_URL`입니다.

### 1-2. 브라우저 풀 초기화

`initBrowserPool()`는 이제 숫자 하나가 아니라 설정 객체를 받습니다.

- `poolSize`: 최대 브라우저 수
- `launchConfig.protocolTimeoutMs`: Playwright 브라우저 런치 타임아웃

### 1-3. Redis 연결을 3개로 분리한 이유

`main.ts`는 Redis 연결을 3개 만듭니다.

1. Queue 조작용 (`queueConnection`)
2. cycle worker용 (`cycleWorkerConnection`)
3. check worker용 (`checkWorkerConnection`)

BullMQ worker는 내부적으로 blocking 동작이 있어, 실무에서는 연결 분리를 권장합니다.

### 1-4. 큐/워커 생성

- `createCycleQueue()` 이름: `accommodation-check-cycle`
- `createCheckQueue()` 이름: `accommodation-check`
- `createCycleWorker(..., { concurrency: 1 })`
- `createCheckWorker(..., { concurrency: config.concurrency })`

즉, cycle은 항상 직렬 1개, check는 설정값만큼 병렬입니다.

### 1-5. 반복 스케줄 등록

`setupRepeatableJobs()`는 BullMQ `upsertJobScheduler`를 사용합니다.

- scheduler id: `cycle-scheduler`
- cron pattern: DB/환경설정에서 읽은 `schedule`
- 생성되는 잡: `cycle-trigger`

### 1-6. 초기 1회 실행

워커 시작 직후 바로 돌지 않고 `startupDelay` 후 아래를 enqueue합니다.

- `cycleQueue.add('cycle-trigger', { triggeredAt: ISOString })`

초기 시스템 안정화 시간을 주고 첫 사이클을 시작하려는 의도입니다.

---

## 2) Cycle 단계 상세 (`cycleProcessor.ts`)

`createCycleProcessor(checkQueue)`는 cycle worker가 실제로 실행할 함수를 만듭니다.

### 2-1. 사이클 시작 시 동적 설정 재로딩

사이클 시작마다 `loadSettings()`를 다시 호출합니다.

- DB 설정이 바뀌면 다음 사이클부터 자동 반영
- DB 실패 시 기존 캐시 유지 + 경고 로그

### 2-2. 하트비트 처리 상태 진입

사이클 시작 시 `updateHeartbeat(true)` 호출로 “현재 처리 중” 표시를 남깁니다.

### 2-3. 대상 숙소 조회

조회 조건:

- `isActive = true`
- `checkIn >= now`

조회 필드:

- 숙소 식별/체크 정보 (`id`, `url`, `platform`, `checkIn`, `checkOut`, `adults`)
- 알림 관련 (`user.id`, `user.kakaoAccessToken`)
- 이전 상태 (`lastStatus`)

### 2-4. `checkCycle` 생성

사이클 메타데이터를 스냅샷으로 기록합니다.

- `totalCount`
- `concurrency`, `browserPoolSize`
- `navigationTimeoutMs`, `contentWaitMs`, `maxRetries`
- `startedAt`

### 2-5. check 잡 생성/큐잉

숙소마다 `CheckJobPayload`를 만들어 `checkQueue.addBulk(jobs)`로 한 번에 넣습니다.

payload 핵심:

- `cycleId` (사이클 연결 키)
- 숙소 체크 입력값
- 사용자 알림 토큰 존재 여부
- `lastStatus`

이 단계는 **잡을 생성만** 하고 결과를 기다리지 않습니다.

---

## 3) Check 단계 상세 (`checkProcessor.ts`)

check worker가 실제 숙소 체크를 수행하는 핵심입니다.

### 3-1. 런타임 설정을 명시적으로 주입

이전에는 checker 내부가 `getSettings()`를 직접 읽었지만, 지금은 `CheckerRuntimeConfig`를 만들어 명시적으로 전달합니다.

- `maxRetries`
- `navigationTimeoutMs`
- `contentWaitMs`
- `patternRetryMs`
- `retryDelayMs`
- `blockResourceTypes`

### 3-2. 플랫폼 체크 실행

`checkAccommodation(accommodation, { runtimeConfig })` 호출 시:

- AIRBNB면 `checkAirbnb`
- AGODA면 `checkAgoda`

각 함수는 `runtimeConfig`가 없으면 에러를 던지도록 바뀌었습니다.

### 3-3. 결과 저장 순서

순서가 중요합니다.

1. 상태 판정 (`AVAILABLE` / `UNAVAILABLE` / `ERROR`)
2. `checkLog` 저장
3. 조건 충족 시 카카오 알림
4. `accommodation` 현재 상태/가격/메타데이터 업데이트
5. `checkCycle` 성공/실패 카운터 업데이트

### 3-4. 알림 중복 방지 로직

`shouldSendAvailabilityNotification` 조건:

1. 이번 상태가 `AVAILABLE`
2. 이전 상태가 `AVAILABLE`이 아님
3. 카카오 토큰이 있음

추가로 최근 로그의 날짜와 현재 체크 날짜를 비교해서, 일정이 바뀐 경우 `effectiveLastStatus = null`로 초기화해 새 일정 첫 알림을 허용합니다.

### 3-5. 사이클 완료 확정 방식

`finalizeCycleCounter()`는 트랜잭션에서:

1. success 또는 error 카운터 +1
2. `(success + error) >= totalCount`이면
3. `completedAt`, `durationMs`를 1회만 기록

즉, 다수 check worker가 동시에 끝나도 completed 처리 경합을 줄이도록 구성되어 있습니다.

---

## 4) 브라우저/체커 상세

### 4-1. Playwright 전환 포인트

- 패키지: `playwright`
- 브라우저 런치: `chromium.launch(...)`
- 리소스 차단: request interception 대신 `page.route('**/*', ...)`
- viewport API: `setViewportSize`

### 4-2. 브라우저 풀 동작

`browserPool.ts` 내부 상태:

- `browsers`: 생성된 전체 브라우저 집합
- `idle`: 유휴 브라우저 스택
- `waiters`: 대기 중 요청
- `creating`: 생성 중 개수
- `poolSize`: 상한

`acquireBrowser()`는:

1. idle에서 건강한 브라우저 재사용
2. 여유가 있으면 새로 생성
3. 꽉 찼으면 waiter 큐에서 대기

`releaseBrowser()`는:

1. waiter가 있으면 즉시 전달
2. 없으면 idle로 복귀
3. 비정상 브라우저는 폐기

### 4-3. `baseCheck`의 판정 모델

1. 페이지 진입 및 스크롤
2. available/unavailable 패턴 대기
3. 커스텀 extractor 우선 시도
4. selector 기반 판정
5. body text 패턴 fallback
6. 실패 시 재시도 정책 적용

결과는 `available`, `price`, `error`, `retryCount` 외에도:

- `metadata`
- `matchedSelectors`
- `matchedPatterns`
- `testableElements`

까지 포함할 수 있어 디버깅 정보를 강화했습니다.

---

## 5) 동적 셀렉터 캐시와 운영 API

### 5-1. 셀렉터 캐시 (`browser/selectors/index.ts`)

- 플랫폼별 TTL: 5분
- 캐시 미스 시: fallback 즉시 반환 + 비동기 DB 갱신
- DB 실패 시: 하드코딩 fallback 유지

DB에서 읽는 데이터:

1. `platformSelector` (PRICE/AVAILABILITY/METADATA/PLATFORM_ID)
2. `platformPattern` (AVAILABLE/UNAVAILABLE)

읽은 값으로 page.evaluate에서 실행 가능한 extractor 함수 문자열을 동적으로 조합합니다.

### 5-2. 워커 HTTP 제어 엔드포인트 (`main.ts`)

- `GET /health`: 상태/업타임 확인
- `POST /restart`: 1초 후 프로세스 종료(컨테이너 재기동 유도)
- `POST /cache/invalidate`: 플랫폼별 또는 전체 셀렉터 캐시 무효화 + 즉시 재로딩
- `POST /test`: URL/플랫폼/날짜 입력으로 체크 결과를 즉시 테스트

`/test`는 `matchedSelectors`, `matchedPatterns`, `testableElements`까지 반환하므로 셀렉터 디버깅에 유용합니다.

---

## 6) 하트비트/모니터링 상세

### 6-1. 하트비트 기록

`updateHeartbeat(isProcessing)`는 `workerHeartbeat` 단일 row(`id='singleton'`)를 upsert합니다.

### 6-2. 정기 상태 감시

`startHeartbeatMonitoring()`는 `heartbeat.checkIntervalMs`마다 아래를 점검합니다.

1. 마지막 하트비트 경과 시간
2. missed beat 수 (`timeSinceLastHeartbeat / intervalMs`)
3. `isProcessing=true` 상태 지속 시간

임계치 초과 시 관리자(ADMIN role + 카카오 토큰 보유)에게 카카오 알림을 보냅니다.

### 6-3. Smart heartbeat interval

`main.ts`의 20초 주기 타이머는 매번 DB를 쓰지 않고, 최소 60초 간격일 때만 healthy 기록을 남겨 write 빈도를 제어합니다.

---

## 7) 종료(Graceful Shutdown) 시퀀스

SIGINT/SIGTERM 수신 시:

1. cycle/check worker close
2. cycle/check queue close
3. Redis 연결 quit
4. browser pool close
5. Prisma disconnect
6. `process.exit(0)`

기존 코드의 “현재 작업 완료까지 대기” 루프는 제거되고, 큐/워커 단위 종료로 단순화되었습니다.

---

## 8) 설정 우선순위와 반영 타이밍

### 8-1. 설정 우선순위 (`runtime/settings/index.ts`)

각 설정 키는 다음 순서로 결정됩니다.

1. DB(`systemSettings`)
2. env (`DEFAULTS`에 env 매핑이 있는 키)
3. 코드 기본값

### 8-2. 캐시 TTL

- 설정 캐시 TTL: 5분
- `loadSettings(force=true)`면 TTL 무시

### 8-3. 실제 반영 시점

- 워커 시작 시 1회 `initConfig()`
- 각 cycle 시작 시 `loadSettings()` 재호출
- 따라서 관리자 설정 변경은 보통 **다음 cycle**에서 반영됩니다.

---

## 9) 인프라/환경 변수 체크리스트

### 9-1. 필수 env

- `DATABASE_URL`
- `REDIS_URL`

`.env.example`에도 `REDIS_URL=redis://localhost:6379`가 추가되었습니다.

### 9-2. Docker 구성

- `docker/docker-compose.local.yml`: `redis` 서비스 추가
- `docker/docker-compose.develop.yml`: `redis` 서비스 + worker 의존성 추가
- `docker/docker-compose.production.yml`: `redis` 서비스 + worker 의존성 추가

즉, 워커를 정상 구동하려면 이제 DB뿐 아니라 Redis가 반드시 살아 있어야 합니다.

---

## 10) 초보자 디버깅 순서 (실전)

문제가 생기면 아래 순서로 보면 대부분 원인을 빠르게 찾을 수 있습니다.

1. `REDIS_URL`이 맞는지 확인
2. worker 시작 로그에서 `Worker started`와 `Worker configuration` 확인
3. `Accommodations to check: N` 로그가 나오는지 확인
4. `checkCycle` row가 생성되는지 DB 확인
5. `check` job 로그(`[숙소명] Check started`)가 병렬로 찍히는지 확인
6. 실패 시 `checkLog.errorMessage`와 `retryCount` 확인
7. 알림 이슈면 `notificationSent`, 사용자 카카오 토큰/만료시각 확인
8. 셀렉터 이슈면 `POST /test`, `POST /cache/invalidate`로 즉시 검증

---

## 11) 현재 코드 기준으로 알아둘 디테일

### 11-1. 실제 check worker 동시성 vs checkCycle 스냅샷

- 실제 check worker 동시성은 `config.concurrency = min(worker.concurrency, browserPoolSize)`입니다.
- 그런데 `checkCycle` 저장 시에는 `settings.worker.concurrency` 원값이 기록됩니다.
- 즉, DB의 사이클 스냅샷 `concurrency`와 실제 worker 동시성이 다를 수 있습니다.

### 11-2. `shutdownTimeoutMs`는 현재 종료 루프에서 사용되지 않음

`config.ts`에서 `shutdownTimeoutMs`를 읽어오지만, 현재 `main.ts` graceful shutdown 흐름에서는 timeout 대기 루프를 쓰지 않습니다.

### 11-3. 20초 주기 heartbeat 타이머의 의미

`main.ts`의 20초 타이머는 “최소 60초 간격으로 healthy 기록” 용도입니다.
실제 처리 시작/종료(`isProcessing=true/false`) 전환은 cycle/check 처리 코드가 직접 `updateHeartbeat(...)`를 호출해서 반영합니다.

---

## 부록: 핵심 타입 요약

### `CheckJobPayload` (`packages/shared/src/worker/jobs/types.ts`)

- cycle 연동: `cycleId`
- 체크 입력: `url`, `platform`, `checkIn`, `checkOut`, `adults`
- 사용자/알림: `userId`, `kakaoAccessToken`
- 중복알림 판단: `lastStatus`

### `CheckerRuntimeConfig` (`packages/shared/src/worker/browser/baseChecker.ts`)

- 재시도/타임아웃/리소스 차단 정책을 checker에 명시적으로 전달
- 테스트(`POST /test`)와 실제 check worker가 같은 구조를 사용

---

## 결론

현재 staging된 워커는 “한 프로세스 안에서 직접 반복/제한/실행”하던 구조에서, “큐로 분리된 단계형 파이프라인”으로 바뀌었습니다.

- cycle 단계는 “무엇을 체크할지 결정”
- check 단계는 “각 숙소를 병렬로 실행/저장/알림”
- runtime 모듈은 Redis/BullMQ/설정/스케줄
- observability 모듈은 heartbeat/알림

이 구조 덕분에 확장성(병렬성), 운영성(큐 기반 제어), 관측성(히스토리/알림)이 이전보다 명확해졌습니다.
