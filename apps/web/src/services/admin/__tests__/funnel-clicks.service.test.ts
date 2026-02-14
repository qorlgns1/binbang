import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminFunnelClicks } from '../funnel-clicks.service';
import type { FunnelRangePreset } from '../funnel.service';

const { mockLandingEventFindMany, mockLandingEventFindFirst, mockFormSubmissionCount, mockFormSubmissionFindFirst } =
  vi.hoisted(
    (): {
      mockLandingEventFindMany: ReturnType<typeof vi.fn>;
      mockLandingEventFindFirst: ReturnType<typeof vi.fn>;
      mockFormSubmissionCount: ReturnType<typeof vi.fn>;
      mockFormSubmissionFindFirst: ReturnType<typeof vi.fn>;
    } => ({
      mockLandingEventFindMany: vi.fn(),
      mockLandingEventFindFirst: vi.fn(),
      mockFormSubmissionCount: vi.fn(),
      mockFormSubmissionFindFirst: vi.fn(),
    }),
  );

vi.mock('@workspace/db', () => ({
  prisma: {
    landingEvent: {
      findMany: mockLandingEventFindMany,
      findFirst: mockLandingEventFindFirst,
    },
    formSubmission: {
      count: mockFormSubmissionCount,
      findFirst: mockFormSubmissionFindFirst,
    },
  },
}));

describe('admin/funnel-clicks.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockFormSubmissionCount.mockResolvedValue(0);
    mockFormSubmissionFindFirst.mockResolvedValue(null);
    mockLandingEventFindFirst.mockResolvedValue(null);
    mockLandingEventFindMany.mockResolvedValue([]);
  });

  it('aggregates click totals and click-to-submitted conversion', async (): Promise<void> => {
    mockFormSubmissionCount.mockResolvedValue(3);
    mockLandingEventFindMany.mockResolvedValue([
      { eventName: 'nav_request', occurredAt: new Date('2026-02-13T01:00:00.000Z') },
      { eventName: 'nav_pricing', occurredAt: new Date('2026-02-13T02:00:00.000Z') },
      { eventName: 'nav_signup', occurredAt: new Date('2026-02-14T01:00:00.000Z') },
      { eventName: 'mobile_menu_open', occurredAt: new Date('2026-02-14T02:00:00.000Z') },
      { eventName: 'mobile_menu_cta', occurredAt: new Date('2026-02-14T03:00:00.000Z') },
    ]);

    const result = await getAdminFunnelClicks({
      range: 'today',
      from: '2026-02-13T00:00:00.000Z',
      to: '2026-02-14T23:59:59.999Z',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(result.totals).toEqual({
      navSignup: 1,
      navRequest: 1,
      navPricing: 1,
      mobileMenuOpen: 1,
      mobileMenuCta: 1,
      total: 5,
    });
    expect(result.navRequestToSubmitted).toBe(3);
    expect(result.series).toEqual([
      {
        date: '2026-02-13',
        navSignup: 0,
        navRequest: 1,
        navPricing: 1,
        mobileMenuOpen: 0,
        mobileMenuCta: 0,
        total: 2,
      },
      {
        date: '2026-02-14',
        navSignup: 1,
        navRequest: 0,
        navPricing: 0,
        mobileMenuOpen: 1,
        mobileMenuCta: 1,
        total: 3,
      },
    ]);
  });

  it('normalizes explicit UTC filter to full UTC day boundaries for non-all ranges', async (): Promise<void> => {
    await getAdminFunnelClicks({
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
      getAdminFunnelClicks({
        range: '7d',
        from: 'invalid-from',
        to: '2026-02-07T03:21:00.000Z',
        now: new Date('2026-02-14T12:00:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid `from` datetime');
  });

  it('throws on unknown range preset', async (): Promise<void> => {
    await expect(
      getAdminFunnelClicks({
        range: 'invalid' as FunnelRangePreset,
        now: new Date('2026-02-14T12:00:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid range preset: invalid');
  });

  it('resolves 30d range with inclusive UTC window', async (): Promise<void> => {
    await getAdminFunnelClicks({
      range: '30d',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(mockLandingEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          occurredAt: {
            gte: new Date('2026-01-16T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        }),
      }),
    );
  });

  it('uses earliest click/submission timestamp for all-range start', async (): Promise<void> => {
    mockLandingEventFindFirst.mockResolvedValue({ occurredAt: new Date('2026-01-20T05:00:00.000Z') });
    mockFormSubmissionFindFirst.mockResolvedValue({ createdAt: new Date('2026-01-18T09:00:00.000Z') });

    await getAdminFunnelClicks({
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

  it('builds zero-filled UTC series when no click activity exists', async (): Promise<void> => {
    const result = await getAdminFunnelClicks({
      range: 'today',
      now: new Date('2026-02-14T12:00:00.000Z'),
    });

    expect(result.series).toEqual([
      {
        date: '2026-02-14',
        navSignup: 0,
        navRequest: 0,
        navPricing: 0,
        mobileMenuOpen: 0,
        mobileMenuCta: 0,
        total: 0,
      },
    ]);
  });
});
