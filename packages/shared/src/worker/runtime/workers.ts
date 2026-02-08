import { type Job, Worker } from 'bullmq';
import type Redis from 'ioredis';

import { QUEUE_NAMES } from './queues';

export interface CreateWorkerOptions {
  concurrency?: number;
}

export function createCycleWorker(
  connection: Redis,
  processor: (job: Job) => Promise<void>,
  options?: CreateWorkerOptions,
): Worker {
  return new Worker(QUEUE_NAMES.CYCLE, processor, {
    connection,
    concurrency: options?.concurrency ?? 1,
  });
}

export function createCheckWorker(
  connection: Redis,
  processor: (job: Job) => Promise<void>,
  options?: CreateWorkerOptions,
): Worker {
  return new Worker(QUEUE_NAMES.CHECK, processor, {
    connection,
    concurrency: options?.concurrency ?? 1,
  });
}
