import crypto from 'node:crypto';
import { getRedisClient } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const DEFAULT_TTL = Number.parseInt(process.env.CACHE_DEFAULT_TTL_SECONDS ?? '86400', 10); // 24 hours
const DEFAULT_STALE_TTL = Number.parseInt(process.env.CACHE_STALE_TTL_SECONDS ?? '3600', 10); // 1 hour
const DEFAULT_LOCK_TTL_SECONDS = Number.parseInt(process.env.CACHE_LOCK_TTL_SECONDS ?? '15', 10);
const DEFAULT_LOCK_WAIT_TIMEOUT_MS = Number.parseInt(process.env.CACHE_LOCK_WAIT_TIMEOUT_MS ?? '1500', 10);
const DEFAULT_LOCK_WAIT_INTERVAL_MS = Number.parseInt(process.env.CACHE_LOCK_WAIT_INTERVAL_MS ?? '100', 10);
const DEFAULT_INVALIDATE_SCAN_COUNT = Number.parseInt(process.env.CACHE_INVALIDATE_SCAN_COUNT ?? '200', 10);
const INVALIDATE_DELETE_BATCH_SIZE = 500;

export const CACHE_INVALIDATION_PREFIX_BY_TARGET = {
  places: 'places',
  weather: 'weather',
  exchange: 'exchange_rate',
} as const;

export type CacheInvalidationTarget = keyof typeof CACHE_INVALIDATION_PREFIX_BY_TARGET;

interface CacheEnvelope<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
  updatedAt: number;
}

type CacheReadResult<T> = { status: 'miss' } | { status: 'fresh'; value: T } | { status: 'stale'; value: T };
export type CacheEntryState = CacheReadResult<unknown>['status'];

interface InternalReadOptions {
  label: string;
  log?: boolean;
}

export interface CachedFetchOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  freshTtlSeconds?: number;
  staleTtlSeconds?: number;
  jitterRatio?: number;
  lockTtlSeconds?: number;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
  logLabel?: string;
}

const activeRevalidations = new Set<string>();

function getNowMs(): number {
  return Date.now();
}

function normalizeTtlSeconds(ttlSeconds: number): number {
  return Math.max(1, Math.round(ttlSeconds));
}

function applyTtlJitter(ttlSeconds: number, jitterRatio: number): number {
  if (jitterRatio <= 0) return normalizeTtlSeconds(ttlSeconds);
  const clampedRatio = Math.min(Math.max(jitterRatio, 0), 1);
  const jitter = (Math.random() * 2 - 1) * clampedRatio;
  return normalizeTtlSeconds(ttlSeconds * (1 + jitter));
}

async function ensureRedisConnected(redis: NonNullable<ReturnType<typeof getRedisClient>>): Promise<boolean> {
  if (
    redis.status === 'ready' ||
    redis.status === 'connect' ||
    redis.status === 'connecting' ||
    redis.status === 'reconnecting'
  ) {
    return true;
  }

  try {
    await redis.connect();
    return true;
  } catch (error) {
    console.error('[Cache] Failed to connect Redis:', error);
    return false;
  }
}

function parseEnvelope<T>(raw: string): CacheEnvelope<T> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.expiresAt !== 'number') return null;
    if (typeof parsed.staleUntil !== 'number') return null;
    if (typeof parsed.updatedAt !== 'number') return null;
    if (!('value' in parsed)) return null;
    return parsed as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

async function readCacheEnvelope<T>(key: string, options: InternalReadOptions): Promise<CacheReadResult<T>> {
  const { label, log = true } = options;
  const redis = getRedisClient();
  if (!redis) {
    if (log) console.log(`[Cache:${label}] BYPASS(no-redis): ${key}`);
    return { status: 'miss' };
  }

  try {
    const connected = await ensureRedisConnected(redis);
    if (!connected) return { status: 'miss' };

    const cached = await redis.get(key);
    if (!cached) {
      if (log) console.log(`[Cache:${label}] MISS: ${key}`);
      return { status: 'miss' };
    }

    const envelope = parseEnvelope<T>(cached);
    if (!envelope) {
      await redis.del(key);
      if (log) console.warn(`[Cache:${label}] INVALID_PAYLOAD: ${key}`);
      return { status: 'miss' };
    }

    const now = getNowMs();
    if (now < envelope.expiresAt) {
      if (log) console.log(`[Cache:${label}] HIT: ${key}`);
      return { status: 'fresh', value: envelope.value };
    }

    if (now < envelope.staleUntil) {
      if (log) console.log(`[Cache:${label}] STALE: ${key}`);
      return { status: 'stale', value: envelope.value };
    }

    await redis.del(key);
    if (log) console.log(`[Cache:${label}] EXPIRED: ${key}`);
    return { status: 'miss' };
  } catch (error) {
    console.error(`[Cache:${label}] READ_ERROR ${key}:`, error);
    return { status: 'miss' };
  }
}

async function writeCacheEnvelope<T>(
  key: string,
  value: T,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
  label: string,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const connected = await ensureRedisConnected(redis);
    if (!connected) return;

    const now = getNowMs();
    const envelope: CacheEnvelope<T> = {
      value,
      updatedAt: now,
      expiresAt: now + freshTtlSeconds * 1000,
      staleUntil: now + (freshTtlSeconds + staleTtlSeconds) * 1000,
    };

    const redisTtl = normalizeTtlSeconds(freshTtlSeconds + staleTtlSeconds);
    await redis.setex(key, redisTtl, JSON.stringify(envelope));
    console.log(`[Cache:${label}] SET: ${key} (fresh=${freshTtlSeconds}s, stale=${staleTtlSeconds}s)`);
  } catch (error) {
    console.error(`[Cache:${label}] WRITE_ERROR ${key}:`, error);
  }
}

async function releaseLock(
  redis: NonNullable<ReturnType<typeof getRedisClient>>,
  lockKey: string,
  lockValue: string,
): Promise<void> {
  try {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      lockKey,
      lockValue,
    );
  } catch (error) {
    console.error(`[Cache] Failed to release lock ${lockKey}:`, error);
  }
}

async function scanKeysByPattern(
  redis: NonNullable<ReturnType<typeof getRedisClient>>,
  pattern: string,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  const scanCount = Number.isFinite(DEFAULT_INVALIDATE_SCAN_COUNT) ? Math.max(10, DEFAULT_INVALIDATE_SCAN_COUNT) : 200;

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', String(scanCount));
    cursor = nextCursor;
    if (batch.length > 0) {
      keys.push(...batch);
    }
  } while (cursor !== '0');

  return keys;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCacheFill<T>(
  key: string,
  timeoutMs: number,
  intervalMs: number,
  label: string,
): Promise<CacheReadResult<T>> {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (Date.now() < deadline) {
    await sleep(Math.max(10, intervalMs));
    const found = await readCacheEnvelope<T>(key, { label, log: false });
    if (found.status !== 'miss') return found;
  }
  return { status: 'miss' };
}

async function runFetcherWithCacheWrite<T>(
  key: string,
  fetcher: () => Promise<T>,
  label: string,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
  staleFallback?: T,
): Promise<T> {
  try {
    const freshValue = await fetcher();
    await writeCacheEnvelope(key, freshValue, freshTtlSeconds, staleTtlSeconds, label);
    return freshValue;
  } catch (error) {
    if (staleFallback !== undefined) {
      console.warn(`[Cache:${label}] STALE_IF_ERROR: ${key}`);
      return staleFallback;
    }
    throw error;
  }
}

async function refreshWithLock<T>(
  options: CachedFetchOptions<T>,
  params: {
    label: string;
    freshTtlSeconds: number;
    staleTtlSeconds: number;
    staleFallback?: T;
  },
): Promise<T> {
  const { key, fetcher } = options;
  const { label, freshTtlSeconds, staleTtlSeconds, staleFallback } = params;

  const redis = getRedisClient();
  if (!redis) {
    return runFetcherWithCacheWrite(key, fetcher, label, freshTtlSeconds, staleTtlSeconds, staleFallback);
  }

  const connected = await ensureRedisConnected(redis);
  if (!connected) {
    return runFetcherWithCacheWrite(key, fetcher, label, freshTtlSeconds, staleTtlSeconds, staleFallback);
  }

  const lockKey = `${key}:lock`;
  const lockValue = crypto.randomUUID();
  const lockTtlSeconds = normalizeTtlSeconds(options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS);
  let lockAcquired = false;

  try {
    const lockResult = await redis.set(lockKey, lockValue, 'EX', lockTtlSeconds, 'NX');
    if (lockResult === 'OK') {
      lockAcquired = true;
      return await runFetcherWithCacheWrite(key, fetcher, label, freshTtlSeconds, staleTtlSeconds, staleFallback);
    }

    console.log(`[Cache:${label}] LOCK_WAIT: ${key}`);
    const waited = await waitForCacheFill<T>(
      key,
      options.waitTimeoutMs ?? DEFAULT_LOCK_WAIT_TIMEOUT_MS,
      options.waitIntervalMs ?? DEFAULT_LOCK_WAIT_INTERVAL_MS,
      label,
    );
    if (waited.status === 'fresh') {
      console.log(`[Cache:${label}] WAIT_HIT: ${key}`);
      return waited.value;
    }
    if (waited.status === 'stale') {
      console.log(`[Cache:${label}] WAIT_STALE: ${key}`);
      return waited.value;
    }

    console.warn(`[Cache:${label}] LOCK_TIMEOUT_FETCH: ${key}`);
    return runFetcherWithCacheWrite(key, fetcher, label, freshTtlSeconds, staleTtlSeconds, staleFallback);
  } finally {
    if (lockAcquired) {
      await releaseLock(redis, lockKey, lockValue);
    }
  }
}

function triggerBackgroundRevalidation<T>(
  options: CachedFetchOptions<T>,
  params: { label: string; freshTtlSeconds: number; staleTtlSeconds: number },
): void {
  const { key } = options;
  if (activeRevalidations.has(key)) return;

  activeRevalidations.add(key);
  void (async () => {
    try {
      await refreshWithLock(options, params);
      console.log(`[Cache:${params.label}] REVALIDATE_OK: ${key}`);
    } catch (error) {
      console.warn(`[Cache:${params.label}] REVALIDATE_FAIL: ${key}`, error);
    } finally {
      activeRevalidations.delete(key);
    }
  })();
}

/**
 * Generate a stable cache key from parameters
 */
export function generateCacheKey(prefix: string, params: unknown): string {
  // Sort keys for consistent hashing if it's an object
  let normalizedParams: unknown = params;

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = (params as Record<string, unknown>)[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );
    normalizedParams = sortedParams;
  }

  const paramsString = JSON.stringify(normalizedParams);
  const hash = crypto.createHash('sha256').update(paramsString).digest('hex').slice(0, 16);

  return `${prefix}:${hash}`;
}

/**
 * Get cached data. Returns fresh or stale value if present.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const result = await readCacheEnvelope<T>(key, { label: 'generic' });
  if (result.status === 'miss') return null;
  return result.value;
}

/**
 * Read cache envelope state without triggering upstream fetch.
 * Useful for prewarm/skip decisions.
 */
export async function getCacheEntryState(key: string, label = 'generic'): Promise<CacheEntryState> {
  const result = await readCacheEnvelope<unknown>(key, { label, log: false });
  return result.status;
}

/**
 * Set cached data with TTL (no stale window).
 */
export async function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
  const ttl = normalizeTtlSeconds(options.ttl ?? DEFAULT_TTL);
  await writeCacheEnvelope(key, data, ttl, 0, 'generic');
}

/**
 * Cache-aside + SWR + stale-if-error helper.
 */
export async function getCachedOrFetch<T>(options: CachedFetchOptions<T>): Promise<T> {
  const label = options.logLabel ?? 'generic';
  const baseFreshTtl = normalizeTtlSeconds(options.freshTtlSeconds ?? DEFAULT_TTL);
  const freshTtlSeconds = applyTtlJitter(baseFreshTtl, options.jitterRatio ?? 0);
  const staleTtlSeconds = Math.max(0, Math.round(options.staleTtlSeconds ?? DEFAULT_STALE_TTL));

  const cached = await readCacheEnvelope<T>(options.key, { label });
  if (cached.status === 'fresh') return cached.value;
  if (cached.status === 'stale') {
    triggerBackgroundRevalidation(options, { label, freshTtlSeconds, staleTtlSeconds });
    return cached.value;
  }

  return refreshWithLock(options, { label, freshTtlSeconds, staleTtlSeconds });
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    const connected = await ensureRedisConnected(redis);
    if (!connected) return;
    await redis.del(key);
    console.log(`[Cache] DELETE: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) {
    return 0;
  }

  try {
    const connected = await ensureRedisConnected(redis);
    if (!connected) return 0;
    const keys = await scanKeysByPattern(redis, pattern);
    if (keys.length === 0) {
      return 0;
    }

    let deletedCount = 0;
    for (let i = 0; i < keys.length; i += INVALIDATE_DELETE_BATCH_SIZE) {
      const batch = keys.slice(i, i + INVALIDATE_DELETE_BATCH_SIZE);
      await redis.del(...batch);
      deletedCount += batch.length;
    }

    console.log(`[Cache] INVALIDATE PATTERN: ${pattern} (${keys.length} keys)`);
    return deletedCount;
  } catch (error) {
    console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
    return 0;
  }
}

export function getCacheInvalidationPattern(target: CacheInvalidationTarget): string {
  return `${CACHE_INVALIDATION_PREFIX_BY_TARGET[target]}:*`;
}

export async function invalidateCacheTarget(target: CacheInvalidationTarget): Promise<number> {
  const pattern = getCacheInvalidationPattern(target);
  return invalidateCachePattern(pattern);
}
