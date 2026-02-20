import crypto from 'node:crypto';

import {
  CACHE_INVALIDATION_PREFIX_BY_TARGET,
  DEFAULT_INVALIDATE_SCAN_COUNT,
  DEFAULT_STALE_TTL,
  DEFAULT_TTL,
  INVALIDATE_DELETE_BATCH_SIZE,
} from '@/lib/cache/cacheConfig';
import { applyTtlJitter, normalizeTtlSeconds, readCacheEnvelope, writeCacheEnvelope } from '@/lib/cache/cacheEnvelope';
import { refreshWithLock, triggerBackgroundRevalidation } from '@/lib/cache/cacheStrategies';
import { resolveConnectedRedis, scanKeysByPattern } from '@/lib/cache/redisClient';
import type { CachedFetchOptions, CacheEntryState, CacheOptions } from '@/lib/cache/cacheTypes';
import type { CacheInvalidationTarget } from '@/lib/cache/cacheConfig';

export type { CacheOptions, CachedFetchOptions, CacheEntryState };
export type { CacheInvalidationTarget };
export { CACHE_INVALIDATION_PREFIX_BY_TARGET };

/**
 * Generate a stable cache key from parameters
 */
export function generateCacheKey(prefix: string, params: unknown): string {
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
  const redis = await resolveConnectedRedis();
  if (!redis) return;

  try {
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
  const redis = await resolveConnectedRedis();
  if (!redis) return 0;

  try {
    const scanCount = Number.isFinite(DEFAULT_INVALIDATE_SCAN_COUNT)
      ? Math.max(10, DEFAULT_INVALIDATE_SCAN_COUNT)
      : 200;
    const keys = await scanKeysByPattern(redis, pattern, scanCount);
    if (keys.length === 0) return 0;

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
