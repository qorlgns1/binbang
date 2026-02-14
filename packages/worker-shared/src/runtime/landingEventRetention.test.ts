import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anonymizeExpiredLandingEventPii, DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS } from './landingEventRetention';

const { mockLandingEventUpdateMany } = vi.hoisted(
  (): {
    mockLandingEventUpdateMany: ReturnType<typeof vi.fn>;
  } => ({
    mockLandingEventUpdateMany: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    landingEvent: {
      updateMany: mockLandingEventUpdateMany,
    },
  },
}));

describe('landingEventRetention', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockLandingEventUpdateMany.mockResolvedValue({ count: 4 });
  });

  it('anonymizes ip/userAgent older than default retention window', async (): Promise<void> => {
    const now = new Date('2026-02-15T12:00:00.000Z');

    const result = await anonymizeExpiredLandingEventPii({ now });

    expect(mockLandingEventUpdateMany).toHaveBeenCalledWith({
      where: {
        occurredAt: { lt: new Date('2026-01-16T12:00:00.000Z') },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
      data: {
        ipAddress: null,
        userAgent: null,
      },
    });
    expect(result).toEqual({
      retentionDays: DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS,
      cutoffAt: '2026-01-16T12:00:00.000Z',
      anonymizedCount: 4,
    });
  });

  it('uses explicit retentionDays when provided', async (): Promise<void> => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    mockLandingEventUpdateMany.mockResolvedValue({ count: 1 });

    const result = await anonymizeExpiredLandingEventPii({ now, retentionDays: 14 });

    expect(mockLandingEventUpdateMany).toHaveBeenCalledWith({
      where: {
        occurredAt: { lt: new Date('2026-02-01T00:00:00.000Z') },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
      data: {
        ipAddress: null,
        userAgent: null,
      },
    });
    expect(result).toEqual({
      retentionDays: 14,
      cutoffAt: '2026-02-01T00:00:00.000Z',
      anonymizedCount: 1,
    });
  });
});
