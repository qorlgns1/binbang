# Plan: Binbang BullMQ Repeat Jobs ✅ 완료

## Context

`vercel.json`의 `crons` 설정은 Vercel에 배포됐을 때만 동작했다.
현재 배포 환경은 OCI + Docker Compose이므로 3개의 Binbang cron이 실제로 실행되지 않고 있었다 (→ BullMQ Repeat Job으로 이관 완료, `vercel.json` 삭제):
- `POST /api/internal/accommodations/poll-due` (30분)
- `POST /api/internal/accommodations/notifications/dispatch` (5분)
- `POST /api/internal/snapshots/cleanup` (매일 03:00)

이를 Worker의 BullMQ repeat job으로 이관하여 실제 동작하도록 한다.
`travelCachePrewarm`이 동일 문제를 동일 방식으로 해결한 선행 패턴이 있으므로 이를 따른다.

---

## 수정 파일 목록

1. `packages/worker-shared/src/runtime/settings/env.ts`
2. `packages/worker-shared/src/runtime/binbangCron.ts` ← 신규
3. `packages/worker-shared/src/runtime/index.ts`
4. `packages/worker-shared/src/runtime/scheduler.ts`
5. `apps/worker/src/cycleProcessor.ts`

---

## 상세 구현

### 1. `settings/env.ts` — config 함수 추가

```ts
export interface BinbangCronConfig {
  webInternalUrl: string;
  internalApiToken: string | null;
  pollDueCron: string;
  dispatchCron: string;
  snapshotCleanupCron: string;
  timeoutMs: number;
}

export function getBinbangCronConfig(): BinbangCronConfig {
  return {
    webInternalUrl: process.env.BINBANG_WEB_INTERNAL_URL?.trim() || 'http://web:3000',
    internalApiToken: readOptionalEnv(process.env.BINBANG_INTERNAL_API_TOKEN),
    pollDueCron: process.env.BINBANG_POLL_DUE_CRON?.trim() || '*/30 * * * *',
    dispatchCron: process.env.BINBANG_DISPATCH_CRON?.trim() || '*/5 * * * *',
    snapshotCleanupCron: process.env.BINBANG_SNAPSHOT_CLEANUP_CRON?.trim() || '0 3 * * *',
    timeoutMs: parsePositiveInt(process.env.BINBANG_CRON_TIMEOUT_MS, 120_000),
  };
}
```

`readOptionalEnv`, `parsePositiveInt`은 같은 파일에 이미 있는 헬퍼 재사용.

---

### 2. `binbangCron.ts` — 신규 파일 (travelCachePrewarm.ts 패턴 동일)

```ts
import { getBinbangCronConfig } from './settings/env';

// 인증 헤더: x-binbang-internal-token (poll-due/route.ts 참고)
// 각 함수는 HTTP POST → ok 확인 → 실패 시 throw

export async function triggerBinbangPollDue(): Promise<{ polled: number }>
export async function triggerBinbangDispatch(): Promise<{ dispatched: number }>
export async function triggerBinbangSnapshotCleanup(): Promise<{ deleted: number }>
```

공통 helper `callBinbangInternal(path)` 로 중복 제거.

---

### 3. `index.ts` — export 추가

```ts
export { triggerBinbangPollDue, triggerBinbangDispatch, triggerBinbangSnapshotCleanup } from './binbangCron';
export type { BinbangCronConfig } from './settings/env';
export { getBinbangCronConfig } from './settings/env';
```

---

### 4. `scheduler.ts` — scheduler 3개 추가

`SetupRepeatableJobsOptions`에 binbang 스케줄 필드 추가:
```ts
binbangPollDueCron?: string;
binbangDispatchCron?: string;
binbangSnapshotCleanupCron?: string;
```

`setupRepeatableJobs()` 말미에 `upsertJobScheduler` 3개 추가:
- `binbang-poll-due-scheduler` → job name `binbang-poll-due`
- `binbang-dispatch-scheduler` → job name `binbang-dispatch`
- `binbang-snapshot-cleanup-scheduler` → job name `binbang-snapshot-cleanup`

`removeRepeatableJobs()`에 3개 `removeJobScheduler` 추가.

---

### 5. `cycleProcessor.ts` — job handler 3개 추가

```ts
if (job.name === 'binbang-poll-due') {
  const result = await triggerBinbangPollDue();
  console.log(`[binbang-poll-due] polled=${result.polled}`);
  return;
}
if (job.name === 'binbang-dispatch') {
  const result = await triggerBinbangDispatch();
  console.log(`[binbang-dispatch] dispatched=${result.dispatched}`);
  return;
}
if (job.name === 'binbang-snapshot-cleanup') {
  const result = await triggerBinbangSnapshotCleanup();
  console.log(`[binbang-snapshot-cleanup] deleted=${result.deleted}`);
  return;
}
```

---

## 환경변수 (서버 `.env.production`에 추가 필요)

| 변수 | 기본값 | 설명 |
|---|---|---|
| `BINBANG_WEB_INTERNAL_URL` | `http://web:3000` | Docker 서비스명 기반 URL |
| `BINBANG_INTERNAL_API_TOKEN` | (없으면 토큰 검사 건너뜀) | 이미 apps/web에 사용 중인 토큰 |
| `BINBANG_POLL_DUE_CRON` | `*/30 * * * *` | 선택적 오버라이드 |
| `BINBANG_DISPATCH_CRON` | `*/5 * * * *` | 선택적 오버라이드 |
| `BINBANG_SNAPSHOT_CLEANUP_CRON` | `0 3 * * *` | 선택적 오버라이드 |
| `BINBANG_CRON_TIMEOUT_MS` | `120000` | HTTP 호출 타임아웃 |

---

## 검증

1. `pnpm ci:check` 통과 확인
2. 로컬에서 worker 재시작 후 BullMQ 대시보드(또는 로그)에서 3개 scheduler가 등록됐는지 확인
3. 수동 트리거: worker HTTP 제어서버가 있으므로 `POST /api/internal/accommodations/poll-due`를 직접 호출해 응답 확인
