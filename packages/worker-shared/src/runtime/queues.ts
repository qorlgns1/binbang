import { Queue } from 'bullmq';
import type Redis from 'ioredis';

export const QUEUE_NAMES = {
  CYCLE: 'accommodation-check-cycle',
  CHECK: 'accommodation-check',
} as const;

export function createCycleQueue(connection: Redis): Queue {
  return new Queue(QUEUE_NAMES.CYCLE, { connection });
}

export function createCheckQueue(connection: Redis): Queue {
  return new Queue(QUEUE_NAMES.CHECK, { connection });
}
