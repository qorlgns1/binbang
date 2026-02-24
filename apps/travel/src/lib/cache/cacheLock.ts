import type { RedisClient } from './redisClient';

export async function releaseLock(redis: RedisClient, lockKey: string, lockValue: string): Promise<void> {
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
