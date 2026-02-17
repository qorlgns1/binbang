import crypto from 'node:crypto';
import { getRedisClient } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const DEFAULT_TTL = Number.parseInt(process.env.CACHE_DEFAULT_TTL_SECONDS ?? '86400', 10); // 24 hours

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
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null; // Cache disabled
  }

  try {
    await redis.connect();
    const cached = await redis.get(key);
    if (!cached) {
      console.log(`[Cache] MISS: ${key}`);
      return null;
    }

    console.log(`[Cache] HIT: ${key}`);
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Cache disabled
  }

  const ttl = options.ttl ?? DEFAULT_TTL;

  try {
    await redis.connect();
    await redis.setex(key, ttl, JSON.stringify(data));
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error);
  }
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
    await redis.connect();
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
    await redis.connect();
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`[Cache] INVALIDATE PATTERN: ${pattern} (${keys.length} keys)`);
    return keys.length;
  } catch (error) {
    console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
    return 0;
  }
}
