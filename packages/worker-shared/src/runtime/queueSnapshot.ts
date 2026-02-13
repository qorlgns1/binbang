import type { Job, Queue } from 'bullmq';

const JOB_STATES = ['waiting', 'active', 'completed', 'failed', 'delayed'] as const;
const JOB_COUNT_STATES = [...JOB_STATES, 'paused'] as const;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_FAILED_REASON_LENGTH = 300;

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export type QueueJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'unknown';

export interface QueueJobDataPreview {
  accommodationId?: string;
  cycleId?: string;
  caseId?: string;
  platform?: string;
  name?: string;
}

export interface QueueJobSummary {
  id: string;
  name: string;
  state: QueueJobState;
  attemptsMade: number;
  attemptsMax: number;
  createdAt: string | null;
  processedAt: string | null;
  finishedAt: string | null;
  failedReason: string | null;
  dataPreview: QueueJobDataPreview;
}

export interface QueueSnapshotResponse {
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

export async function buildQueueSnapshot(
  cycleQueue: Queue,
  checkQueue: Queue,
  limitInput?: number,
): Promise<QueueSnapshotResponse> {
  const limit = normalizeLimit(limitInput);

  const [cycleStats, checkStats, cycleJobs, checkJobs] = await Promise.all([
    getQueueStats(cycleQueue),
    getQueueStats(checkQueue),
    getQueueJobs(cycleQueue, limit),
    getQueueJobs(checkQueue, limit),
  ]);

  return {
    timestamp: new Date().toISOString(),
    queues: {
      cycle: cycleStats,
      check: checkStats,
    },
    recentJobs: {
      cycle: cycleJobs,
      check: checkJobs,
    },
  };
}

function normalizeLimit(limitInput?: number): number {
  if (typeof limitInput !== 'number' || Number.isNaN(limitInput)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limitInput), 1), MAX_LIMIT);
}

async function getQueueStats(queue: Queue): Promise<QueueStats> {
  const counts = await queue.getJobCounts(...JOB_COUNT_STATES);

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
    paused: counts.paused ?? 0,
  };
}

async function getQueueJobs(queue: Queue, limit: number): Promise<QueueJobSummary[]> {
  const allJobs: Job[] = [];
  for (const state of JOB_STATES) {
    const jobs = await queue.getJobs([state], 0, limit - 1, false);
    allJobs.push(...jobs);
  }
  const dedupedJobs = dedupeJobsById(allJobs);
  const sortTs = (job: Job): number =>
    job.finishedOn ?? job.processedOn ?? job.timestamp ?? 0;
  dedupedJobs.sort((a, b) => sortTs(b) - sortTs(a));
  const limited = dedupedJobs.slice(0, limit);

  return Promise.all(
    limited.map(async (job): Promise<QueueJobSummary> => {
      const state = await getJobState(job);

      return {
        id: String(job.id),
        name: job.name,
        state,
        attemptsMade: job.attemptsMade,
        attemptsMax: typeof job.opts.attempts === 'number' && job.opts.attempts > 0 ? job.opts.attempts : 1,
        createdAt: toIso(job.timestamp),
        processedAt: toIso(job.processedOn),
        finishedAt: toIso(job.finishedOn),
        failedReason: truncate(job.failedReason, MAX_FAILED_REASON_LENGTH),
        dataPreview: pickDataPreview(job.data),
      };
    }),
  );
}

function dedupeJobsById(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const deduped: Job[] = [];

  for (const job of jobs) {
    const id = String(job.id);
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(job);
  }

  return deduped;
}

async function getJobState(job: Job): Promise<QueueJobState> {
  try {
    const rawState = await job.getState();
    return mapJobState(rawState);
  } catch {
    return 'unknown';
  }
}

function mapJobState(state: string): QueueJobState {
  switch (state) {
    case 'waiting':
    case 'waiting-children':
    case 'prioritized':
      return 'waiting';
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'delayed':
      return 'delayed';
    case 'paused':
      return 'paused';
    default:
      return 'unknown';
  }
}

function pickDataPreview(data: unknown): QueueJobDataPreview {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const payload = data as Record<string, unknown>;
  return {
    accommodationId: pickString(payload, 'accommodationId'),
    cycleId: pickString(payload, 'cycleId'),
    caseId: pickString(payload, 'caseId'),
    platform: pickString(payload, 'platform'),
    name: pickString(payload, 'name'),
  };
}

function pickString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toIso(timeMs: number | undefined): string | null {
  if (typeof timeMs !== 'number' || !Number.isFinite(timeMs) || timeMs <= 0) {
    return null;
  }

  return new Date(timeMs).toISOString();
}

function truncate(value: string | undefined, maxLength: number): string | null {
  if (!value) return null;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}
