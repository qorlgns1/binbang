/**
 * DIP: 컴포넌트가 fetch URL 문자열에 직접 의존하지 않도록 API 호출을 캡슐화.
 * 컴포넌트는 이 모듈에만 의존하며, API 경로가 바뀌어도 이 파일만 수정하면 된다.
 */
import type { BulkResult, JobDetail, JobListResult, QueueStats, SchedulerInfo } from '@/types/bullmq';

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, globalThis.location?.origin ?? 'http://localhost');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return url.pathname + url.search;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── 큐 통계 ─────────────────────────────────────────────────────────────────

export async function fetchAllQueues(): Promise<QueueStats[]> {
  const res = await fetch('/api/admin/bullmq/queues');
  const data = await parseResponse<{ queues: QueueStats[] }>(res);
  return data.queues;
}

// ─── 잡 목록 ─────────────────────────────────────────────────────────────────

export async function fetchJobs(
  queueName: string,
  state: string,
  page: number,
  limit: number,
  tick: number,
): Promise<JobListResult> {
  const url = buildUrl(`/api/admin/bullmq/queues/${queueName}/jobs`, {
    state,
    page: String(page),
    limit: String(limit),
    _t: String(tick),
  });
  const res = await fetch(url);
  return parseResponse<JobListResult>(res);
}

// ─── 잡 상세 ─────────────────────────────────────────────────────────────────

export async function fetchJobDetail(queueName: string, jobId: string): Promise<JobDetail> {
  const res = await fetch(`/api/admin/bullmq/queues/${queueName}/jobs/${jobId}`);
  return parseResponse<JobDetail>(res);
}

// ─── 잡 단건 제어 ────────────────────────────────────────────────────────────

export async function retryJobApi(queueName: string, jobId: string): Promise<void> {
  const res = await fetch(`/api/admin/bullmq/queues/${queueName}/jobs/${jobId}/retry`, { method: 'POST' });
  await parseResponse<{ ok: boolean }>(res);
}

export async function removeJobApi(queueName: string, jobId: string): Promise<void> {
  const res = await fetch(`/api/admin/bullmq/queues/${queueName}/jobs/${jobId}`, { method: 'DELETE' });
  await parseResponse<{ ok: boolean }>(res);
}

// ─── 잡 벌크 제어 ────────────────────────────────────────────────────────────

export async function bulkJobAction(queueName: string, action: 'retry' | 'remove', ids: string[]): Promise<BulkResult> {
  const res = await fetch(`/api/admin/bullmq/queues/${queueName}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ids }),
  });
  return parseResponse<BulkResult>(res);
}

// ─── 큐 제어 ─────────────────────────────────────────────────────────────────

export async function sendQueueControl(queueName: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`/api/admin/bullmq/queues/${queueName}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await parseResponse<{ ok: boolean }>(res);
}

// ─── 스케줄러 ─────────────────────────────────────────────────────────────────

export async function fetchSchedulers(tick: number): Promise<SchedulerInfo[]> {
  const res = await fetch(`/api/admin/bullmq/schedulers?_t=${tick}`);
  const data = await parseResponse<{ schedulers: SchedulerInfo[] }>(res);
  return data.schedulers;
}

export async function triggerSchedulerApi(id: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`/api/admin/bullmq/schedulers/${encodeURIComponent(id)}/trigger`, {
    method: 'POST',
  });
  return parseResponse<{ ok: boolean; message: string }>(res);
}
