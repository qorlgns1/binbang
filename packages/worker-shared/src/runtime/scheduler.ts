import type { Queue } from 'bullmq';

const DEFAULT_NOTIFICATION_RETRY_SCHEDULE = '*/2 * * * *';
const DEFAULT_LANDING_EVENT_PII_RETENTION_SCHEDULE = '17 0 * * *';
const DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS = 30;

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

  await queue.upsertJobScheduler(
    'landing-event-pii-retention-scheduler',
    { pattern: DEFAULT_LANDING_EVENT_PII_RETENTION_SCHEDULE },
    {
      name: 'landing-event-pii-retention',
      data: {
        triggeredAt: new Date().toISOString(),
        retentionDays: DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS,
      },
    },
  );
}

export async function removeRepeatableJobs(queue: Queue): Promise<void> {
  await queue.removeJobScheduler('cycle-scheduler');
  await queue.removeJobScheduler('notification-retry-scheduler');
  await queue.removeJobScheduler('landing-event-pii-retention-scheduler');
}
