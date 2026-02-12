import type { Queue } from 'bullmq';

const DEFAULT_NOTIFICATION_RETRY_SCHEDULE = '*/2 * * * *';

export async function setupRepeatableJobs(queue: Queue, schedule: string): Promise<void> {
  await queue.upsertJobScheduler(
    'cycle-scheduler',
    { pattern: schedule },
    { name: 'cycle-trigger', data: { triggeredAt: new Date().toISOString() } },
  );

  // Notification retry queue (FAILED + stale PENDING)
  await queue.upsertJobScheduler(
    'notification-retry-scheduler',
    { pattern: DEFAULT_NOTIFICATION_RETRY_SCHEDULE },
    { name: 'notification-retry', data: { triggeredAt: new Date().toISOString() } },
  );
}

export async function removeRepeatableJobs(queue: Queue): Promise<void> {
  await queue.removeJobScheduler('cycle-scheduler');
  await queue.removeJobScheduler('notification-retry-scheduler');
}
