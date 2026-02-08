import type { Queue } from 'bullmq';

export async function setupRepeatableJobs(queue: Queue, schedule: string): Promise<void> {
  await queue.upsertJobScheduler(
    'cycle-scheduler',
    { pattern: schedule },
    { name: 'cycle-trigger', data: { triggeredAt: new Date().toISOString() } },
  );
}

export async function removeRepeatableJobs(queue: Queue): Promise<void> {
  await queue.removeJobScheduler('cycle-scheduler');
}
