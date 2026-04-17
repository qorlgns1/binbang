import { getTravelCachePrewarmConfig } from './settings/env';

export interface TravelCachePrewarmMetrics {
  targets: number;
  warmed: number;
  skipped: number;
  failed: number;
}

export interface TriggerTravelCachePrewarmResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  places: TravelCachePrewarmMetrics;
  weather: TravelCachePrewarmMetrics;
  exchangeRate: TravelCachePrewarmMetrics;
}

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

export async function triggerTravelCachePrewarm(): Promise<TriggerTravelCachePrewarmResult> {
  const config = getTravelCachePrewarmConfig();
  const endpoint = joinUrl(config.internalUrl, '/api/internal/cache/prewarm');

  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (config.cronToken) {
    headers.set('x-internal-cron-token', config.cronToken);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    signal: timeoutSignal(config.timeoutMs),
  });

  const rawBody = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: TriggerTravelCachePrewarmResult;
    error?: string;
  } | null;

  if (!response.ok || !rawBody?.ok || !rawBody.data) {
    const reason = rawBody?.error || `status=${response.status}`;
    throw new Error(`travel cache prewarm failed: ${reason}`);
  }

  return rawBody.data;
}
