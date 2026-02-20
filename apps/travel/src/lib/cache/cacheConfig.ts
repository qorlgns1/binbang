export const DEFAULT_TTL = Number.parseInt(process.env.CACHE_DEFAULT_TTL_SECONDS ?? '86400', 10); // 24 hours
export const DEFAULT_STALE_TTL = Number.parseInt(process.env.CACHE_STALE_TTL_SECONDS ?? '3600', 10); // 1 hour
export const DEFAULT_LOCK_TTL_SECONDS = Number.parseInt(process.env.CACHE_LOCK_TTL_SECONDS ?? '15', 10);
export const DEFAULT_LOCK_WAIT_TIMEOUT_MS = Number.parseInt(process.env.CACHE_LOCK_WAIT_TIMEOUT_MS ?? '1500', 10);
export const DEFAULT_LOCK_WAIT_INTERVAL_MS = Number.parseInt(process.env.CACHE_LOCK_WAIT_INTERVAL_MS ?? '100', 10);
export const DEFAULT_INVALIDATE_SCAN_COUNT = Number.parseInt(process.env.CACHE_INVALIDATE_SCAN_COUNT ?? '200', 10);
export const INVALIDATE_DELETE_BATCH_SIZE = 500;

export const CACHE_INVALIDATION_PREFIX_BY_TARGET = {
  places: 'places',
  weather: 'weather',
  exchange: 'exchange_rate',
} as const;

export type CacheInvalidationTarget = keyof typeof CACHE_INVALIDATION_PREFIX_BY_TARGET;
