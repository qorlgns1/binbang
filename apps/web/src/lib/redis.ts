import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });

      redisClient.on('error', (err: Error) => {
        console.error('[web redis] connection error:', err.message);
      });
    } catch (error) {
      console.error('[web redis] init failed:', error);
      return null;
    }
  }

  return redisClient;
}

export async function ensureRedisConnected(redis: Redis): Promise<boolean> {
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
    console.error('[web redis] connect failed:', error);
    return false;
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
