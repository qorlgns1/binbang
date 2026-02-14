# 워커 큐 실시간 모니터링 구현 상세 계획서 (Backlog)

> 작성일: 2026-02-13  
> 대상: `apps/worker` + `apps/web`  
> 목적: 초보 운영자도 “워커가 지금 무엇을 하고 있는지”를 웹에서 실시간(폴링 기반)으로 이해할 수 있게 한다.

---

## 0. 배경 설명

### 0.1 현재 시스템이 어떻게 동작하는가

현재 워커는 BullMQ + Redis 구조이며, 큐는 2개다.

- `accommodation-check-cycle` (사이클 트리거/스케줄 잡)
- `accommodation-check` (실제 숙소 체크 잡)

흐름은 아래와 같다.

1. 사이클 스케줄러가 `cycle-trigger` 잡을 넣는다.
2. cycle worker가 활성 숙소를 조회한다.
3. 숙소 수만큼 `check` 잡을 bulk enqueue 한다.
4. check worker들이 병렬로 체크를 처리한다.
5. 완료 시 로그/상태/알림/케이스 이벤트를 반영한다.

코드 기준 근거:

- 워커 엔트리/HTTP 제어 서버: `apps/worker/src/main.ts`
- cycle 처리: `apps/worker/src/cycleProcessor.ts`
- check 처리: `apps/worker/src/checkProcessor.ts`
- 큐 이름 정의: `packages/worker-shared/src/runtime/queues.ts`

### 0.2 현재 운영 화면의 한계

관리자 화면에는 하트비트 상태는 있으나, “큐 내부에 현재 어떤 job이 대기/실행/실패 상태인지”는 보이지 않는다.

- 있음: 워커 헬스/하트비트/재시작
- 없음: 큐 상태 카운트, 최근 잡 목록, 실패 원인, 처리 흐름 시각화

결과적으로 초보자는 아래 질문에 답하기 어렵다.

- 지금 워커가 멈춘 건지, 대기 중인지?
- 왜 알림이 안 왔는지?
- 잡이 실패하고 있는지?
- 설정 변경이 실제 처리량에 반영되는지?

### 0.3 왜 “초보자 친화”가 중요한가

이 화면의 목적은 단순 디버깅이 아니라 운영 학습이다.  
즉, “워커가 어떤 단계로 돌아가는지”를 직관적으로 보여줘야 한다.

- 상태 카운트만 나열하면 초보자는 해석을 못 한다.
- 단계 설명 + 현재 단계 강조 + 최근 예시 잡이 같이 보여야 이해된다.

### 0.4 아키텍처 제약(중요)

이 저장소의 규칙상 다음 제약을 지켜야 한다.

- `apps/web`는 `@workspace/worker-shared/*` import 금지
- 웹은 BullMQ/Redis에 직접 붙지 않고, 워커 내부 HTTP를 통해 조회
- 관리자 권한(ADMIN) 없는 요청은 차단

즉, 구현 경로는 **Web -> Web API(Route Handler) -> Worker Internal HTTP -> BullMQ** 구조가 안전하다.

---

## 1. 목표와 비목표

## 1.1 목표 (이번 작업)

1. `/admin/heartbeat` 페이지에서 큐 상태를 2~5초 주기로 실시간 확인 가능
2. 초보자용 워커 흐름 설명(현재 단계 포함) 제공
3. 최근 잡 목록과 실패 이유를 한 화면에서 확인 가능
4. 워커가 내려갔을 때도 화면이 안전하게 degraded 표시

## 1.2 비목표 (이번 범위 제외)

1. Bull Board 전체 기능 도입
2. 실시간 WebSocket/SSE 강제 도입 (옵션으로만 문서화)
3. 큐 관리(삭제/재처리/pause/resume)까지 제공

---

## 2. 최종 사용자 경험 (완성 기준)

관리자 `Heartbeat` 페이지에서 아래가 보인다.

1. 워커 상태 카드 (기존)
2. 워커 흐름 카드 (신규)
3. 큐 카운트 카드 2개 (cycle/check)
4. 최근 잡 테이블 (신규)
5. 잡 상세 패널 (신규, 클릭 시)

초보 운영자는 화면만 보고 아래 5문장에 답할 수 있어야 한다.

1. “지금 워커는 정상인지?”
2. “현재 단계는 사이클 생성인지, 체크 처리인지?”
3. “대기 잡이 쌓이는지, 실패가 나는지?”
4. “최근에 어떤 숙소/케이스 잡이 돌았는지?”
5. “실패하면 왜 실패했는지?”

---

## 3. 기술 설계

## 3.1 설계 선택지

### 선택지 A: 웹이 Redis/BullMQ 직접 조회

- 장점: 워커 우회 가능
- 단점: 웹에 BullMQ/Redis 의존 + 보안/권한/운영 복잡도 증가
- 결론: 채택하지 않음

### 선택지 B: 워커에서 큐 스냅샷 API 제공, 웹은 폴링

- 장점: 현재 구조와 일치, 구현 난이도 낮음, 안정적
- 단점: 완전 실시간은 아님(2~5초 지연)
- 결론: **이번 기본안으로 채택**

### 선택지 C: QueueEvents + SSE/WebSocket

- 장점: 진짜 실시간
- 단점: 연결 관리/인프라 복잡도 증가
- 결론: 2차 확장안으로 문서만 남김

## 3.2 채택 아키텍처

1. Worker: `GET /queue/snapshot` 제공
2. Web API: `GET /api/admin/worker/queue` 제공(ADMIN 체크 + worker proxy)
3. Client Query: 3초 polling
4. UI: 기존 `/admin/heartbeat`에 큐 섹션 추가

---

## 4. API 계약(LLM이 반드시 지켜야 할 스펙)

## 4.1 Worker Internal API

엔드포인트:

- `GET /queue/snapshot?limit=20`

응답 스키마:

```ts
interface QueueSnapshotResponse {
  timestamp: string;
  queues: {
    cycle: QueueStats;
    check: QueueStats;
  };
  recentJobs: {
    cycle: QueueJobSummary[];
    check: QueueJobSummary[];
  };
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

type QueueJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';

interface QueueJobSummary {
  id: string;
  name: string;
  state: QueueJobState;
  attemptsMade: number;
  attemptsMax: number;
  createdAt: string | null;
  processedAt: string | null;
  finishedAt: string | null;
  failedReason: string | null;
  dataPreview: {
    accommodationId?: string;
    cycleId?: string;
    caseId?: string;
    platform?: string;
    name?: string;
  };
}
```

실패 응답:

- 500 + `{ error: string }`

주의사항:

1. `job.data` 전체를 그대로 내려주지 말고 `dataPreview`로 축약
2. `failedReason`은 최대 300자 정도로 truncate
3. `limit` 기본값 20, 상한 50

## 4.2 Web Public(Admin) API

엔드포인트:

- `GET /api/admin/worker/queue?limit=20`

동작:

1. `requireAdmin()`으로 권한 체크
2. `WORKER_INTERNAL_URL`(기본 `http://localhost:3500`)로 프록시
3. worker 타임아웃 3~5초
4. worker 다운 시 503 + 사용자 친화 오류 메시지

응답:

- 성공 시 Worker 응답 그대로 전달
- 실패 시 `{ error, timestamp }`

---

## 5. 구현 작업 단위 (LLM 실행용)

아래 WU는 순서대로 진행한다.

---

### WU-01. Worker 큐 스냅샷 서비스 구현

목표:

- 워커에서 BullMQ 큐 상태/최근 잡 스냅샷 생성

수정 파일:

- `apps/worker/src/main.ts`
- `apps/worker/src/queueSnapshot.ts` (신규)

세부 작업:

1. `queueSnapshot.ts` 생성
2. `buildQueueSnapshot(cycleQueue, checkQueue, limit)` 함수 구현
3. `Queue.getJobCounts(...)`로 카운트 조회
4. `Queue.getJobs([...], 0, limit - 1, false)`로 최근 잡 조회
5. job별 `getState()`로 상태 매핑
6. 응답 스키마에 맞게 serialize
7. `main.ts`의 HTTP server에 `GET /queue/snapshot` 분기 추가

검증 포인트:

1. 워커 실행 중 `curl http://localhost:3500/queue/snapshot` 응답 확인
2. 큐 비어있을 때도 200 + 빈 배열 반환
3. 오류 시 500 JSON 반환

---

### WU-02. 웹 관리자용 큐 프록시 API 구현

목표:

- ADMIN만 접근 가능한 웹 API 추가

수정 파일:

- `apps/web/src/app/api/admin/worker/queue/route.ts` (신규)

세부 작업:

1. `requireAdmin()` 권한 체크
2. query param `limit` 파싱/검증(1~50)
3. worker URL: `process.env.WORKER_INTERNAL_URL ?? 'http://localhost:3500'`
4. `fetch(${workerUrl}/queue/snapshot?limit=...)` with timeout
5. 성공 시 JSON pass-through
6. worker down/timeout 시 503 응답

검증 포인트:

1. 관리자 로그인 상태에서 200
2. 비관리자 401
3. 워커 중지 시 503 + 에러 메시지

---

### WU-03. 프론트 Query/타입 추가

목표:

- 클라이언트에서 3초 주기로 큐 상태 조회

수정 파일:

- `apps/web/src/types/admin.ts`
- `apps/web/src/lib/queryKeys.ts`
- `apps/web/src/features/admin/monitoring/queries.ts`
- `apps/web/src/features/admin/monitoring/index.ts`

세부 작업:

1. `admin.ts`에 `QueueSnapshotResponse`, `QueueStats`, `QueueJobSummary` 타입 추가
2. `queryKeys.ts`에 `adminKeys.workerQueue(filters?)` 추가
3. `queries.ts`에 `useWorkerQueueQuery(limit=20)` 추가
4. `fetch('/api/admin/worker/queue?limit=20')`
5. `refetchInterval: 3000`, `staleTime: 1000`

검증 포인트:

1. 네트워크 탭에서 3초 polling 확인
2. 에러 발생 시 query error state 정상 노출

---

### WU-04. `/admin/heartbeat`에 큐 모니터 UI 통합

목표:

- 초보자도 이해 가능한 구조로 시각화

수정 파일:

- `apps/web/src/app/admin/heartbeat/page.tsx`
- `apps/web/src/app/admin/heartbeat/_components/QueueOverviewCard.tsx` (신규)
- `apps/web/src/app/admin/heartbeat/_components/QueueJobsTable.tsx` (신규)
- `apps/web/src/app/admin/heartbeat/_components/WorkerFlowGuide.tsx` (신규)

UI 요구사항:

1. `WorkerFlowGuide`
   - 단계 4개: 스케줄 대기 -> 사이클 생성 -> 숙소 체크 처리 -> 완료/다음 사이클 대기
   - 현재 단계 하이라이트 로직 포함
2. `QueueOverviewCard`
   - cycle/check 각각 waiting/active/completed/failed/delayed 표시
   - failed > 0이면 경고 스타일
3. `QueueJobsTable`
   - 최근 잡 목록(큐별 탭 또는 섹션)
   - 컬럼: queue, state, name, attempts, createdAt, finishedAt, failedReason
   - row click 시 우측/하단 상세(데이터 preview)

상태 판별 가이드(초보자용):

1. `cycle.active > 0` => “사이클 생성 중”
2. `check.active > 0` => “숙소 확인 중”
3. `check.waiting > 0 && check.active === 0` => “확인 대기 중”
4. 그 외 => “다음 스케줄 대기”

검증 포인트:

1. 모바일(세로)에서 표가 깨지지 않는지
2. 데이터 없음 상태에서 빈 상태 UI가 자연스러운지
3. failedReason 긴 문자열 줄바꿈/ellipsis 처리

---

### WU-05. 문구/학습 가이드(초보자 배려)

목표:

- 운영자가 “이 숫자가 의미하는 바”를 즉시 이해

수정 파일:

- `apps/web/src/app/admin/heartbeat/_components/WorkerFlowGuide.tsx`
- 필요 시 `apps/web/messages/*` (다국어 반영 시)

필수 문구:

1. “waiting: 아직 실행되지 않은 대기 작업 수”
2. “active: 현재 워커가 처리 중인 작업 수”
3. “failed: 오류로 종료된 작업 수(원인 확인 필요)”
4. “delayed: 지정 시각 이후 실행 예정 작업 수”

추가 UX:

1. “실무에서 이렇게 사용하세요” 블록
2. 문제 판단 예시 3개
   - waiting 증가 + active 0 => 워커 정지 의심
   - failed 급증 => 셀렉터/네트워크/사이트 변경 점검
   - completed 증가 정상 + failed 0 => 안정 상태

---

## 6. 확장안 (선택): SSE 실시간 스트림

이번 릴리즈에서는 폴링으로 충분하나, 필요 시 다음 단계로 확장한다.

1. worker에 `QueueEvents` 구독 추가
2. web에 SSE route(`text/event-stream`) 추가
3. client에서 `EventSource` 구독
4. 폴링 fallback 유지

적용 시점:

- 운영자가 2~5초 지연도 아쉽다고 판단할 때
- 큐 규모가 커져 폴링 비용이 의미 있을 때

---

## 7. 테스트 계획

## 7.1 자동 검증

1. `pnpm --filter @workspace/worker typecheck`
2. `pnpm --filter @workspace/web typecheck`
3. `pnpm --filter @workspace/web test`

## 7.2 수동 시나리오

1. 워커 실행 + admin 페이지 접속
2. 신규 숙소 생성 후 queue waiting/active 변화 확인
3. 실패 유도(의도적 잘못된 URL) 후 failedReason 노출 확인
4. 워커 종료 후 503/degraded 상태 확인

## 7.3 회귀 체크

1. 기존 heartbeat 상태 카드가 계속 정상 동작
2. 기존 워커 재시작 버튼 동작 유지
3. selectors 관련 워커 API(`/test`, `/cache/invalidate`) 영향 없음

---

## 8. 완료 조건 (DoD)

아래가 모두 충족되면 완료로 본다.

1. `/admin/heartbeat`에서 큐 상태가 3초 내 주기로 갱신됨
2. cycle/check 큐 카운트와 최근 잡 목록이 보임
3. 실패 잡 원인 문자열을 UI에서 확인 가능
4. 초보자용 흐름 설명/현재 단계 하이라이트가 보임
5. 비관리자 접근 차단(401) 확인
6. 워커 다운 시 서비스 전체 크래시 없이 우아한 에러 처리

---

## 9. 리스크와 대응

1. 리스크: `getJobs` 호출 비용 증가
   - 대응: `limit` 기본 20, 상한 50
2. 리스크: worker 내부 API 노출
   - 대응: 외부 공개 금지, 웹 서버에서 admin 인증 후 프록시
3. 리스크: payload 과다 노출
   - 대응: `dataPreview` 최소 필드만 전달
4. 리스크: 폴링 과다
   - 대응: 페이지 focus일 때만 refetch 유지(React Query 기본 동작 활용 가능)

---

## 10. LLM 실행 프롬프트 템플릿

아래 텍스트를 LLM에게 그대로 전달해도 된다.

```text
다음 문서를 기준으로 구현해줘: docs/backlog/worker-queue-live-monitoring-plan.md

요구사항:
1) WU-01부터 WU-05까지 순서대로 구현
2) 파일 경로와 API 스펙을 문서와 동일하게 유지
3) 기존 기능(heartbeat/restart/selectors API) 회귀 없게 유지
4) 완료 후 타입체크 및 테스트 명령 실행 결과를 요약 보고
5) 변경 파일 목록 + 핵심 구현 포인트 + 남은 리스크를 보고

중요 제약:
- apps/web에서 @workspace/worker-shared import 금지
- Queue payload는 dataPreview로 축약해서 노출
- 관리자 권한 없는 요청은 반드시 401
```

---

## 11. 구현 참고 파일 (읽기 전용)

1. `apps/worker/src/main.ts`
2. `apps/worker/src/cycleProcessor.ts`
3. `apps/worker/src/checkProcessor.ts`
4. `packages/worker-shared/src/runtime/queues.ts`
5. `apps/web/src/app/admin/heartbeat/page.tsx`
6. `apps/web/src/features/heartbeat/queries.ts`
7. `apps/web/src/features/admin/monitoring/queries.ts`
8. `apps/web/src/lib/queryKeys.ts`
9. `apps/web/src/app/api/admin/selectors/test/route.ts`
10. `apps/web/src/app/api/admin/selectors/cache/route.ts`

