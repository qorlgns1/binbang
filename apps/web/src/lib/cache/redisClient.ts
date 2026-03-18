import { getRedisClient } from '@/lib/redis';

export type RedisClient = NonNullable<ReturnType<typeof getRedisClient>>;

export async function ensureRedisConnected(redis: RedisClient): Promise<boolean> {
  if (redis.status === 'ready') {
    return true;
  }

  if (redis.status === 'connect' || redis.status === 'connecting' || redis.status === 'reconnecting') {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        off();
        resolve(false);
      }, 3000);
      const off = () => {
        clearTimeout(timer);
        redis.off('ready', onReady);
        redis.off('error', onFail);
        redis.off('close', onFail);
        redis.off('end', onFail);
      };
      const onReady = () => {
        off();
        resolve(true);
      };
      const onFail = () => {
        off();
        resolve(false);
      };
      redis.once('ready', onReady);
      redis.once('error', onFail);
      redis.once('close', onFail);
      redis.once('end', onFail);
    });
  }

  try {
    await redis.connect();
    return true;
  } catch (error) {
    console.error('[Cache] Failed to connect Redis:', error);
    return false;
  }
}

export async function resolveConnectedRedis(): Promise<RedisClient | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const connected = await ensureRedisConnected(redis);
  if (!connected) return null;

  return redis;
}

export async function scanKeysByPattern(
  redis: RedisClient,
  pattern: string,
  scanCount: number,
  maxKeys = 10_000,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', String(scanCount));
    cursor = nextCursor;
    const remaining = maxKeys - keys.length;
    if (remaining <= 0) break;
    if (batch.length > 0) keys.push(...batch.slice(0, remaining));
    if (keys.length >= maxKeys) break;
  } while (cursor !== '0');

  return keys;
}
