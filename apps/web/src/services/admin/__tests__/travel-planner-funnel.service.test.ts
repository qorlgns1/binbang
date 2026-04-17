import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminTravelPlannerFunnel } from '../travel-planner-funnel.service';

const { mockLandingEventGroupBy } = vi.hoisted(
  (): {
    mockLandingEventGroupBy: ReturnType<typeof vi.fn>;
  } => ({
    mockLandingEventGroupBy: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    landingEvent: {
      groupBy: mockLandingEventGroupBy,
    },
  },
}));

describe('admin/travel-planner-funnel.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockLandingEventGroupBy.mockResolvedValue([]);
  });

  it('aggregates travel planner counts and conversion ratios for the last 7 days', async (): Promise<void> => {
    mockLandingEventGroupBy.mockResolvedValue([
      { eventName: 'landing_viewed', _count: { _all: 20 } },
      { eventName: 'planner_started', _count: { _all: 10 } },
      { eventName: 'planner_submitted', _count: { _all: 8 } },
      { eventName: 'planner_result_viewed', _count: { _all: 6 } },
      { eventName: 'planner_failed', _count: { _all: 1 } },
      { eventName: 'planner_empty_result', _count: { _all: 2 } },
      { eventName: 'accommodation_clicked', _count: { _all: 3 } },
      { eventName: 'alert_bridge_started', _count: { _all: 1 } },
    ]);

    const result = await getAdminTravelPlannerFunnel({
      now: new Date('2026-04-02T12:00:00.000Z'),
    });

    expect(result.counts).toEqual({
      landingViewed: 20,
      plannerStarted: 10,
      plannerSubmitted: 8,
      plannerResultViewed: 6,
      plannerFailed: 1,
      plannerEmptyResult: 2,
      accommodationClicked: 3,
      alertBridgeStarted: 1,
    });
    expect(result.conversion).toEqual({
      landingToStarted: 0.5,
      startedToSubmitted: 0.8,
      startedToResultViewed: 0.6,
      resultViewedToAccommodationClicked: 0.5,
      accommodationClickedToAlertBridgeStarted: 0.333,
    });
  });

  it('queries only travel-planner source within the fixed 7d UTC range', async (): Promise<void> => {
    await getAdminTravelPlannerFunnel({
      now: new Date('2026-04-02T12:00:00.000Z'),
    });

    expect(mockLandingEventGroupBy).toHaveBeenCalledWith({
      by: ['eventName'],
      where: {
        source: 'travel-planner',
        eventName: {
          in: [
            'landing_viewed',
            'planner_started',
            'planner_submitted',
            'planner_result_viewed',
            'planner_failed',
            'planner_empty_result',
            'accommodation_clicked',
            'alert_bridge_started',
          ],
        },
        occurredAt: {
          gte: new Date('2026-03-27T00:00:00.000Z'),
          lte: new Date('2026-04-02T23:59:59.999Z'),
        },
      },
      _count: {
        _all: true,
      },
    });
  });

  it('returns zero-safe conversion ratios when the denominator is zero', async (): Promise<void> => {
    mockLandingEventGroupBy.mockResolvedValue([
      { eventName: 'planner_failed', _count: { _all: 4 } },
      { eventName: 'planner_empty_result', _count: { _all: 2 } },
    ]);

    const result = await getAdminTravelPlannerFunnel({
      now: new Date('2026-04-02T12:00:00.000Z'),
    });

    expect(result.counts).toEqual({
      landingViewed: 0,
      plannerStarted: 0,
      plannerSubmitted: 0,
      plannerResultViewed: 0,
      plannerFailed: 4,
      plannerEmptyResult: 2,
      accommodationClicked: 0,
      alertBridgeStarted: 0,
    });
    expect(result.conversion).toEqual({
      landingToStarted: 0,
      startedToSubmitted: 0,
      startedToResultViewed: 0,
      resultViewedToAccommodationClicked: 0,
      accommodationClickedToAlertBridgeStarted: 0,
    });
  });
});
