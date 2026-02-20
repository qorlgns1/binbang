import crypto from 'node:crypto';

import { DEFAULT_LOCK_TTL_SECONDS, DEFAULT_LOCK_WAIT_INTERVAL_MS, DEFAULT_LOCK_WAIT_TIMEOUT_MS } from './cacheConfig';
import { normalizeTtlSeconds, readCacheEnvelope, writeCacheEnvelope } from './cacheEnvelope';
import { releaseLock } from './cacheLock';
import { resolveConnectedRedis } from './redisClient';
import type { CachedFetchOptions, CacheReadResult } from './cacheTypes';

const activeRevalidations = new Set<string>();

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

export async function refreshWithLock<T>(
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

  const redis = await resolveConnectedRedis();
  if (!redis) {
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

export function triggerBackgroundRevalidation<T>(
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
