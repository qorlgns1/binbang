import { describe, expect, it, vi } from 'vitest';

import { removeRepeatableJobs, setupRepeatableJobs } from './scheduler';

describe('runtime/scheduler', (): void => {
  it('registers cycle/notification/retention/public snapshot/case-expiration/travel cleanup schedulers', async (): Promise<void> => {
    const upsertJobScheduler = vi.fn().mockResolvedValue(undefined);
    const queue = {
      upsertJobScheduler,
    };

    await setupRepeatableJobs(queue as never, '*/30 * * * *');

    expect(upsertJobScheduler).toHaveBeenCalledTimes(6);
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      1,
      'cycle-scheduler',
      { pattern: '*/30 * * * *' },
      { name: 'cycle-trigger', data: { triggeredAt: expect.any(String) } },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      2,
      'notification-retry-scheduler',
      { pattern: '*/2 * * * *' },
      { name: 'notification-retry', data: { triggeredAt: expect.any(String) } },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      3,
      'landing-event-pii-retention-scheduler',
      { pattern: '17 0 * * *' },
      {
        name: 'landing-event-pii-retention',
        data: {
          triggeredAt: expect.any(String),
          retentionDays: 30,
        },
      },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      4,
      'public-availability-snapshot-scheduler',
      { pattern: '7 1 * * *' },
      {
        name: 'public-availability-snapshot',
        data: {
          triggeredAt: expect.any(String),
          windowDays: 7,
        },
      },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      5,
      'case-expiration-scheduler',
      { pattern: '37 0 * * *' },
      {
        name: 'case-expiration',
        data: { triggeredAt: expect.any(String) },
      },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      6,
      'travel-guest-cleanup-scheduler',
      { pattern: '15 0 * * *' },
      {
        name: 'travel-guest-cleanup',
        data: {
          triggeredAt: expect.any(String),
          retentionDays: 7,
        },
      },
    );
  });

  it('uses admin-configured public snapshot schedule and window days when provided', async (): Promise<void> => {
    const upsertJobScheduler = vi.fn().mockResolvedValue(undefined);
    const queue = {
      upsertJobScheduler,
    };

    await setupRepeatableJobs(queue as never, '*/15 * * * *', {
      publicAvailabilitySnapshotSchedule: '11 2 * * *',
      publicAvailabilityWindowDays: 14,
    });

    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      4,
      'public-availability-snapshot-scheduler',
      { pattern: '11 2 * * *' },
      {
        name: 'public-availability-snapshot',
        data: {
          triggeredAt: expect.any(String),
          windowDays: 14,
        },
      },
    );

    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      5,
      'case-expiration-scheduler',
      { pattern: '37 0 * * *' },
      {
        name: 'case-expiration',
        data: { triggeredAt: expect.any(String) },
      },
    );
    expect(upsertJobScheduler).toHaveBeenNthCalledWith(
      6,
      'travel-guest-cleanup-scheduler',
      { pattern: '15 0 * * *' },
      {
        name: 'travel-guest-cleanup',
        data: {
          triggeredAt: expect.any(String),
          retentionDays: 7,
        },
      },
    );
  });

  it('removes all repeatable schedulers', async (): Promise<void> => {
    const removeJobScheduler = vi.fn().mockResolvedValue(undefined);
    const queue = {
      removeJobScheduler,
    };

    await removeRepeatableJobs(queue as never);

    expect(removeJobScheduler).toHaveBeenCalledTimes(6);
    expect(removeJobScheduler).toHaveBeenNthCalledWith(1, 'cycle-scheduler');
    expect(removeJobScheduler).toHaveBeenNthCalledWith(2, 'notification-retry-scheduler');
    expect(removeJobScheduler).toHaveBeenNthCalledWith(3, 'landing-event-pii-retention-scheduler');
    expect(removeJobScheduler).toHaveBeenNthCalledWith(4, 'public-availability-snapshot-scheduler');
    expect(removeJobScheduler).toHaveBeenNthCalledWith(5, 'case-expiration-scheduler');
    expect(removeJobScheduler).toHaveBeenNthCalledWith(6, 'travel-guest-cleanup-scheduler');
  });
});
