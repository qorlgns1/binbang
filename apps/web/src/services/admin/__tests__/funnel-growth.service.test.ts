import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminFunnelGrowth } from '../funnel-growth.service';
import type { FunnelRangePreset } from '../funnel.service';

const { mockLandingEventFindMany, mockLandingEventFindFirst } = vi.hoisted(
  (): {
    mockLandingEventFindMany: ReturnType<typeof vi.fn>;
    mockLandingEventFindFirst: ReturnType<typeof vi.fn>;
  } => ({
    mockLandingEventFindMany: vi.fn(),
    mockLandingEventFindFirst: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    landingEvent: {
      findMany: mockLandingEventFindMany,
      findFirst: mockLandingEventFindFirst,
    },
  },
}));

describe('admin/funnel-growth.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockLandingEventFindFirst.mockResolvedValue(null);
    mockLandingEventFindMany.mockResolvedValue([]);
  });

  it('aggregates growth KPIs and conversion ratios', async (): Promise<void> => {
    mockLandingEventFindMany.mockResolvedValue([
      {
        id: 'evt_1',
        eventName: 'organic_landing',
        occurredAt: new Date('2026-02-13T01:00:00.000Z'),
        sessionId: 'sess_a',
      },
      {
        id: 'evt_2',
        eventName: 'availability_cta',
        occurredAt: new Date('2026-02-13T02:00:00.000Z'),
        sessionId: 'sess_a',
      },
      {
        id: 'evt_3',
        eventName: 'signup_completed',
        occurredAt: new Date('2026-02-13T03:00:00.000Z'),
        sessionId: 'user_1',
      },
      {
        id: 'evt_4',
        eventName: 'first_alert_created',
        occurredAt: new Date('2026-02-13T04:00:00.000Z'),
        sessionId: 'user_1',
      },
      {
        id: 'evt_5',
        eventName: 'first_alert_created',
        occurredAt: new Date('2026-02-13T05:00:00.000Z'),
        sessionId: 'user_1',
      },
      {
        id: 'evt_6',
        eventName: 'organic_landing',
        occurredAt: new Date('2026-02-14T01:00:00.000Z'),
        sessionId: 'sess_b',
      },
      {
        id: 'evt_7',
        eventName: 'availability_cta',
        occurredAt: new Date('2026-02-14T02:00:00.000Z'),
        sessionId: 'sess_b',
      },
      {
        id: 'evt_8',
        eventName: 'first_alert_created',
        occurredAt: new Date('2026-02-14T03:00:00.000Z'),
        sessionId: 'user_2',
      },
    ]);

    const result = await getAdminFunnelGrowth({
      range: 'today',
      from: '2026-02-13T00:00:00.000Z',
      to: '2026-02-14T23:59:59.999Z',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(result.kpis).toEqual({
      organicVisit: 2,
      availabilityCtaClick: 2,
      signupCompleted: 1,
      firstAlertCreated: 2,
      totalAlertsCreated: 3,
      alertsPerUser: 1.5,
    });
    expect(result.conversion).toEqual({
      visitToSignup: 0.5,
      signupToAlert: 2,
      visitToAlert: 1,
      ctaToSignup: 0.5,
    });
    expect(result.series).toEqual([
      {
        date: '2026-02-13',
        organicVisit: 1,
        availabilityCtaClick: 1,
        signupCompleted: 1,
        firstAlertCreated: 1,
        totalAlertsCreated: 2,
        alertsPerUser: 2,
      },
      {
        date: '2026-02-14',
        organicVisit: 1,
        availabilityCtaClick: 1,
        signupCompleted: 0,
        firstAlertCreated: 1,
        totalAlertsCreated: 1,
        alertsPerUser: 1,
      },
    ]);
  });

  it('normalizes explicit UTC filter to full UTC day boundaries for non-all ranges', async (): Promise<void> => {
    await getAdminFunnelGrowth({
      range: '7d',
      from: '2026-02-01T12:34:56.000Z',
      to: '2026-02-07T03:21:00.000Z',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(mockLandingEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          occurredAt: {
            gte: new Date('2026-02-01T00:00:00.000Z'),
            lte: new Date('2026-02-07T23:59:59.999Z'),
          },
        }),
      }),
    );
  });

  it('throws on invalid custom from date', async (): Promise<void> => {
    await expect(
      getAdminFunnelGrowth({
        range: '7d',
        from: 'invalid-from',
        to: '2026-02-07T03:21:00.000Z',
        now: new Date('2026-02-14T12:00:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid `from` datetime');
  });

  it('throws on unknown range preset', async (): Promise<void> => {
    await expect(
      getAdminFunnelGrowth({
        range: 'invalid' as FunnelRangePreset,
        now: new Date('2026-02-14T12:00:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid range preset: invalid');
  });

  it('uses earliest growth event timestamp for all-range start', async (): Promise<void> => {
    mockLandingEventFindFirst.mockResolvedValue({ occurredAt: new Date('2026-01-18T09:00:00.000Z') });

    await getAdminFunnelGrowth({
      range: 'all',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(mockLandingEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          occurredAt: {
            gte: new Date('2026-01-18T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        }),
      }),
    );
  });

  it('builds zero-filled UTC series when no growth activity exists', async (): Promise<void> => {
    const result = await getAdminFunnelGrowth({
      range: 'today',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(result.series).toEqual([
      {
        date: '2026-02-14',
        organicVisit: 0,
        availabilityCtaClick: 0,
        signupCompleted: 0,
        firstAlertCreated: 0,
        totalAlertsCreated: 0,
        alertsPerUser: 0,
      },
    ]);
  });
});
