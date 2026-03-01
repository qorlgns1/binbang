import { ensureRedisConnected, getRedisClient } from '@/lib/redis';
import type {
  BulkResult,
  JobDetail,
  JobItem,
  JobListResult,
  JobState,
  QueueStats,
  SchedulerData,
} from '@/types/bullmq';

// ─── 큐 설정 ────────────────────────────────────────────────────────────────

const BULLMQ_PREFIX = 'bull';

export const QUEUE_NAMES = ['accommodation-check-cycle', 'accommodation-check'] as const;
export type QueueName = (typeof QUEUE_NAMES)[number];

/**
 * OCP: 자료구조 유형을 데이터로 선언.
 * 새 state가 추가될 때 이 맵만 수정하면 listJobs/getJobDetail 로직은 변경 불필요.
 */
const STATE_STORE: Readonly<Record<JobState, 'list' | 'zset'>> = {
  waiting: 'list',
  active: 'list',
  failed: 'zset',
  completed: 'zset',
  delayed: 'zset',
};

const SCHEDULER_QUEUE = 'accommodation-check-cycle' as const satisfies QueueName;

// ─── 유틸리티 ────────────────────────────────────────────────────────────────

function queueKey(queueName: string, suffix: string): string {
  return `${BULLMQ_PREFIX}:${queueName}:${suffix}`;
}

function jobKey(queueName: string, jobId: string): string {
  return `${BULLMQ_PREFIX}:${queueName}:${jobId}`;
}

function parseIntOrNull(value: string | undefined | null): number | null {
  if (value == null) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * 단일 소스 큐 이름 검증.
 * OCP: 큐가 추가될 때 QUEUE_NAMES만 수정하면 됨.
 */
export function parseQueueName(name: string): QueueName | null {
  return (QUEUE_NAMES as readonly string[]).includes(name) ? (name as QueueName) : null;
}

// ─── Redis 연결 ───────────────────────────────────────────────────────────────

async function getRedis() {
  const redis = getRedisClient();
  if (!redis) return null;
  const ok = await ensureRedisConnected(redis);
  return ok ? redis : null;
}

// ─── 직렬화 헬퍼 ─────────────────────────────────────────────────────────────

function previewJson(raw: string, maxLen = 120): string {
  try {
    const str = JSON.stringify(JSON.parse(raw));
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
  } catch {
    return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
  }
}

function parseStacktrace(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]).join('\n') : String(parsed);
  } catch {
    return raw;
  }
}

function hashToJobItem(jobId: string, state: JobState, hash: Record<string, string>): JobItem {
  return {
    id: jobId,
    name: hash.name ?? jobId,
    state,
    attemptsMade: parseIntOrNull(hash.attemptsMade) ?? 0,
    timestamp: parseIntOrNull(hash.timestamp),
    processedOn: parseIntOrNull(hash.processedOn),
    finishedOn: parseIntOrNull(hash.finishedOn),
    failedReason: hash.failedReason ?? null,
    dataPreview: previewJson(hash.data ?? '{}'),
  };
}

function hashToJobDetail(jobId: string, state: JobState, hash: Record<string, string>): JobDetail {
  return {
    ...hashToJobItem(jobId, state, hash),
    data: hash.data ?? '{}',
    opts: hash.opts ?? '{}',
    stacktrace: parseStacktrace(hash.stacktrace),
    returnValue: hash.returnvalue ?? null,
  };
}

// ─── 큐 통계 ─────────────────────────────────────────────────────────────────

export async function getQueueStats(queueName: QueueName): Promise<QueueStats> {
  const redis = await getRedis();
  if (!redis) {
    return { name: queueName, waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0, isPaused: false };
  }

  const [waiting, active, failed, completed, delayed, pausedField] = await Promise.all([
    redis.llen(queueKey(queueName, 'wait')),
    redis.llen(queueKey(queueName, 'active')),
    redis.zcard(queueKey(queueName, 'failed')),
    redis.zcard(queueKey(queueName, 'completed')),
    redis.zcard(queueKey(queueName, 'delayed')),
    redis.hget(queueKey(queueName, 'meta'), 'paused'),
  ]);

  return { name: queueName, waiting, active, failed, completed, delayed, isPaused: pausedField === '1' };
}

export async function getAllQueuesStats(): Promise<QueueStats[]> {
  return Promise.all(QUEUE_NAMES.map((name) => getQueueStats(name)));
}

// ─── 잡 목록 ─────────────────────────────────────────────────────────────────

export async function listJobs(
  queueName: QueueName,
  state: JobState,
  page: number,
  limit: number,
): Promise<JobListResult> {
  const redis = await getRedis();
  if (!redis) return { jobs: [], total: 0, page, limit };

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  const storeType = STATE_STORE[state];

  let jobIds: string[] = [];
  let total = 0;

  if (storeType === 'list') {
    const key = queueKey(queueName, state);
    [total, jobIds] = await Promise.all([redis.llen(key), redis.lrange(key, start, end)]);
  } else {
    const key = queueKey(queueName, state);
    [total, jobIds] = await Promise.all([redis.zcard(key), redis.zrevrange(key, start, end)]);
  }

  if (jobIds.length === 0) return { jobs: [], total, page, limit };

  // 단일 파이프라인으로 모든 해시 조회
  const pipeline = redis.pipeline();
  for (const id of jobIds) pipeline.hgetall(jobKey(queueName, id));
  const results = await pipeline.exec();

  const jobs = jobIds.map((id, i) => {
    const hash = (results?.[i]?.[1] ?? {}) as Record<string, string>;
    return hashToJobItem(id, state, hash);
  });

  return { jobs, total, page, limit };
}

// ─── 잡 상세 ─────────────────────────────────────────────────────────────────

/**
 * SRP: state 결정 로직을 별도 함수로 추출.
 * OCP: STATE_STORE 맵을 기반으로 동적으로 처리하므로 새 state 추가 시 이 함수 변경 불필요.
 */
async function resolveJobState(
  redis: NonNullable<Awaited<ReturnType<typeof getRedis>>>,
  queueName: QueueName,
  jobId: string,
): Promise<JobState> {
  // 단일 파이프라인으로 모든 state 위치를 동시 조회 (순차 N 왕복 → 1 왕복)
  const pipeline = redis.pipeline();
  for (const [state, storeType] of Object.entries(STATE_STORE) as [JobState, 'list' | 'zset'][]) {
    if (storeType === 'list') {
      pipeline.lpos(queueKey(queueName, state), jobId);
    } else {
      pipeline.zscore(queueKey(queueName, state), jobId);
    }
  }
  const results = await pipeline.exec();

  const states = Object.keys(STATE_STORE) as JobState[];
  for (let i = 0; i < states.length; i++) {
    if (results?.[i]?.[1] !== null && results?.[i]?.[1] !== undefined) {
      return states[i] as JobState;
    }
  }
  return 'waiting';
}

export async function getJobDetail(queueName: QueueName, jobId: string): Promise<JobDetail | null> {
  const redis = await getRedis();
  if (!redis) return null;

  const hash = await redis.hgetall(jobKey(queueName, jobId));
  if (!hash || Object.keys(hash).length === 0) return null;

  const state = await resolveJobState(redis, queueName, jobId);
  return hashToJobDetail(jobId, state, hash);
}

// ─── 잡 제어 ─────────────────────────────────────────────────────────────────

export async function retryJob(queueName: QueueName, jobId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');

  const hashKey = jobKey(queueName, jobId);
  const failedKey = queueKey(queueName, 'failed');
  const waitKey = queueKey(queueName, 'wait');

  // zrem + hget을 한 파이프라인으로 처리: zrem 결과(0/1)로 중복 retry 방지
  const firstPipe = await redis.pipeline().zrem(failedKey, jobId).hget(hashKey, 'attemptsMade').exec();
  const removed = (firstPipe?.[0]?.[1] as number) ?? 0;
  if (removed === 0) throw new Error(`Job ${jobId} 은 failed 상태가 아닙니다.`);

  const rawAttempts = firstPipe?.[1]?.[1] as string | null;
  const currentAttempts = parseInt(rawAttempts ?? '0', 10);

  await redis
    .pipeline()
    .hdel(hashKey, 'failedReason', 'finishedOn', 'processedOn', 'stacktrace')
    .hset(hashKey, 'attemptsMade', String(Math.max(0, currentAttempts - 1)))
    .rpush(waitKey, jobId)
    .exec();
}

/** pipeline으로 모든 set/list 제거를 단일 왕복에 처리 */
export async function removeJob(queueName: QueueName, jobId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');

  await redis
    .pipeline()
    .zrem(queueKey(queueName, 'failed'), jobId)
    .zrem(queueKey(queueName, 'completed'), jobId)
    .zrem(queueKey(queueName, 'delayed'), jobId)
    .lrem(queueKey(queueName, 'wait'), 0, jobId)
    .lrem(queueKey(queueName, 'active'), 0, jobId)
    .lrem(queueKey(queueName, 'paused'), 0, jobId)
    .del(jobKey(queueName, jobId))
    .exec();
}

export async function bulkRetryJobs(queueName: QueueName, jobIds: string[]): Promise<BulkResult> {
  const result: BulkResult = { succeeded: 0, failed: 0, errors: [] };
  await Promise.all(
    jobIds.map(async (id) => {
      try {
        await retryJob(queueName, id);
        result.succeeded++;
      } catch (err) {
        result.failed++;
        result.errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
  );
  return result;
}

export async function bulkRemoveJobs(queueName: QueueName, jobIds: string[]): Promise<BulkResult> {
  const result: BulkResult = { succeeded: 0, failed: 0, errors: [] };
  await Promise.all(
    jobIds.map(async (id) => {
      try {
        await removeJob(queueName, id);
        result.succeeded++;
      } catch (err) {
        result.failed++;
        result.errors.push(`${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
  );
  return result;
}

// ─── 큐 제어 ─────────────────────────────────────────────────────────────────

export async function pauseQueue(queueName: QueueName): Promise<void> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');
  await redis.hset(queueKey(queueName, 'meta'), 'paused', '1');
}

export async function resumeQueue(queueName: QueueName): Promise<void> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');
  await redis.hdel(queueKey(queueName, 'meta'), 'paused');
}

export async function drainQueue(queueName: QueueName): Promise<void> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');
  await redis.del(queueKey(queueName, 'waiting'));
}

/** pipeline으로 N개 DEL을 단일 왕복에 처리 */
export async function cleanQueue(
  queueName: QueueName,
  state: 'failed' | 'completed',
  graceMs: number,
  limit: number,
): Promise<number> {
  const redis = await getRedis();
  if (!redis) throw new Error('Redis 연결 불가');

  const setKey = queueKey(queueName, state);
  const maxScore = Date.now() - graceMs;

  const jobIds = await redis.zrangebyscore(setKey, '-inf', maxScore, 'LIMIT', 0, limit);
  if (jobIds.length === 0) return 0;

  const pipeline = redis.pipeline();
  for (const id of jobIds) {
    pipeline.zrem(setKey, id);
    pipeline.del(jobKey(queueName, id));
  }
  await pipeline.exec();

  return jobIds.length;
}

// ─── 스케줄러 목록 ───────────────────────────────────────────────────────────

/**
 * DIP: triggerableIds를 파라미터로 주입받아 트리거 서비스에 직접 의존하지 않음.
 * 호출자(라우트)가 의존성을 주입한다.
 */
export async function listSchedulers(
  triggerableIds: ReadonlySet<string>,
): Promise<Array<SchedulerData & { canTrigger: boolean }>> {
  const redis = await getRedis();
  if (!redis) return [];

  const schedulersKey = queueKey(SCHEDULER_QUEUE, 'job-schedulers');
  const members = await redis.zrange(schedulersKey, 0, -1, 'WITHSCORES');
  if (members.length === 0) return [];

  // 단일 파이프라인으로 모든 스케줄러 해시를 일괄 조회
  const ids: string[] = [];
  const scores: string[] = [];
  for (let i = 0; i < members.length; i += 2) {
    ids.push(members[i] as string);
    scores.push(members[i + 1] as string);
  }

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.hgetall(queueKey(SCHEDULER_QUEUE, `job-scheduler:${id}`));
  const results = await pipeline.exec();

  return ids.map((id, i) => {
    const hash = (results?.[i]?.[1] ?? {}) as Record<string, string>;
    return {
      id,
      name: hash.name ?? id,
      pattern: hash.pattern ?? null,
      every: hash.every ?? null,
      nextRunAt: parseIntOrNull(scores[i]),
      data: hash.data ?? null,
      canTrigger: triggerableIds.has(id),
    };
  });
}
