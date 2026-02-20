import type { CacheEnvelope, CacheReadResult, InternalReadOptions } from './cacheTypes';
import { resolveConnectedRedis } from './redisClient';

export function getNowMs(): number {
  return Date.now();
}

export function normalizeTtlSeconds(ttlSeconds: number): number {
  return Math.max(1, Math.round(ttlSeconds));
}

export function applyTtlJitter(ttlSeconds: number, jitterRatio: number): number {
  if (jitterRatio <= 0) return normalizeTtlSeconds(ttlSeconds);
  const clampedRatio = Math.min(Math.max(jitterRatio, 0), 1);
  const jitter = (Math.random() * 2 - 1) * clampedRatio;
  return normalizeTtlSeconds(ttlSeconds * (1 + jitter));
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

export async function readCacheEnvelope<T>(key: string, options: InternalReadOptions): Promise<CacheReadResult<T>> {
  const { label, log = true } = options;
  const redis = await resolveConnectedRedis();
  if (!redis) {
    if (log) console.log(`[Cache:${label}] BYPASS(redis-unavailable): ${key}`);
    return { status: 'miss' };
  }

  try {
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

export async function writeCacheEnvelope<T>(
  key: string,
  value: T,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
  label: string,
): Promise<void> {
  const redis = await resolveConnectedRedis();
  if (!redis) return;

  try {
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
