import type { Queue } from 'bullmq';

const DEFAULT_NOTIFICATION_RETRY_SCHEDULE = '*/2 * * * *';
const DEFAULT_LANDING_EVENT_PII_RETENTION_SCHEDULE = '17 0 * * *';
const DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS = 30;
const DEFAULT_PUBLIC_AVAILABILITY_SNAPSHOT_SCHEDULE = '7 1 * * *';
const DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS = 7;
const DEFAULT_CASE_EXPIRATION_SCHEDULE = '37 0 * * *';

interface SetupRepeatableJobsOptions {
  publicAvailabilitySnapshotSchedule?: string;
  publicAvailabilityWindowDays?: number;
}

function resolvePublicAvailabilitySchedule(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_PUBLIC_AVAILABILITY_SNAPSHOT_SCHEDULE;
  return trimmed;
}

function resolvePublicAvailabilityWindowDays(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS;
  }
  return Math.floor(value);
}

export async function setupRepeatableJobs(
  queue: Queue,
  schedule: string,
  options: SetupRepeatableJobsOptions = {},
): Promise<void> {
  const publicAvailabilitySnapshotSchedule = resolvePublicAvailabilitySchedule(
    options.publicAvailabilitySnapshotSchedule,
  );
  const publicAvailabilityWindowDays = resolvePublicAvailabilityWindowDays(options.publicAvailabilityWindowDays);

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

  await queue.upsertJobScheduler(
    'public-availability-snapshot-scheduler',
    { pattern: publicAvailabilitySnapshotSchedule },
    {
      name: 'public-availability-snapshot',
      data: {
        triggeredAt: new Date().toISOString(),
        windowDays: publicAvailabilityWindowDays,
      },
    },
  );

  await queue.upsertJobScheduler(
    'case-expiration-scheduler',
    { pattern: DEFAULT_CASE_EXPIRATION_SCHEDULE },
    {
      name: 'case-expiration',
      data: { triggeredAt: new Date().toISOString() },
    },
  );
}

export async function removeRepeatableJobs(queue: Queue): Promise<void> {
  await queue.removeJobScheduler('cycle-scheduler');
  await queue.removeJobScheduler('notification-retry-scheduler');
  await queue.removeJobScheduler('landing-event-pii-retention-scheduler');
  await queue.removeJobScheduler('public-availability-snapshot-scheduler');
  await queue.removeJobScheduler('case-expiration-scheduler');
}
