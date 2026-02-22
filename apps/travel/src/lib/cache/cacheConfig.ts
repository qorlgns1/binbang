function parseEnvInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_TTL = parseEnvInt(process.env.CACHE_DEFAULT_TTL_SECONDS, 86400); // 24 hours
export const DEFAULT_STALE_TTL = parseEnvInt(process.env.CACHE_STALE_TTL_SECONDS, 3600); // 1 hour
export const DEFAULT_LOCK_TTL_SECONDS = parseEnvInt(process.env.CACHE_LOCK_TTL_SECONDS, 15);
export const DEFAULT_LOCK_WAIT_TIMEOUT_MS = parseEnvInt(process.env.CACHE_LOCK_WAIT_TIMEOUT_MS, 1500);
export const DEFAULT_LOCK_WAIT_INTERVAL_MS = parseEnvInt(process.env.CACHE_LOCK_WAIT_INTERVAL_MS, 100);
export const DEFAULT_INVALIDATE_SCAN_COUNT = parseEnvInt(process.env.CACHE_INVALIDATE_SCAN_COUNT, 200);
export const INVALIDATE_DELETE_BATCH_SIZE = 500;

export const CACHE_INVALIDATION_PREFIX_BY_TARGET = {
  places: 'places',
  weather: 'weather',
  exchange: 'exchange_rate',
} as const;

export type CacheInvalidationTarget = keyof typeof CACHE_INVALIDATION_PREFIX_BY_TARGET;
