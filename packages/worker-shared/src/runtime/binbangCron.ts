import { getBinbangCronConfig } from './settings/env.js';

function joinUrl(baseUrl: string, pathname: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  if ('timeout' in AbortSignal && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

async function callBinbangInternal(
  path: string,
): Promise<{ ok: boolean; result?: unknown; error?: { message: string } }> {
  const config = getBinbangCronConfig();
  const endpoint = joinUrl(config.webInternalUrl, path);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (config.internalApiToken) {
    headers.set('x-binbang-internal-token', config.internalApiToken);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    signal: timeoutSignal(config.timeoutMs),
  });

  const rawBody = (await response.json().catch(() => null)) as {
    ok?: boolean;
    result?: unknown;
    error?: { message?: string };
  } | null;

  if (!response.ok || !rawBody?.ok) {
    const reason = rawBody?.error?.message || `status=${response.status}`;
    throw new Error(`binbang internal call failed [${path}]: ${reason}`);
  }

  return { ok: true, result: rawBody.result };
}

export async function triggerBinbangPollDue(): Promise<{ polled: number }> {
  const { result } = await callBinbangInternal('/api/internal/accommodations/poll-due');
  const processed = (result as { processedCount?: unknown } | undefined)?.processedCount;
  return { polled: typeof processed === 'number' ? processed : 0 };
}

export async function triggerBinbangDispatch(): Promise<{ dispatched: number }> {
  const { result } = await callBinbangInternal('/api/internal/accommodations/notifications/dispatch');
  const sent = (result as { sent?: unknown } | undefined)?.sent;
  return { dispatched: typeof sent === 'number' ? sent : 0 };
}

export async function triggerBinbangSnapshotCleanup(): Promise<{ deleted: number }> {
  const { result } = await callBinbangInternal('/api/internal/snapshots/cleanup');
  const deletedPollRuns = (result as { deletedPollRuns?: unknown } | undefined)?.deletedPollRuns;
  return { deleted: typeof deletedPollRuns === 'number' ? deletedPollRuns : 0 };
}
