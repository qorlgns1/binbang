import { prisma } from '@workspace/db';
import { addUtcDays, endOfUtcDay, startOfUtcDay } from '@workspace/shared/utils/date';

import type { AdminTravelPlannerFunnelCounts, AdminTravelPlannerFunnelResponse } from '@/types/admin';

export const TRAVEL_PLANNER_FUNNEL_EVENT_NAMES = [
  'landing_viewed',
  'planner_started',
  'planner_submitted',
  'planner_result_viewed',
  'planner_failed',
  'planner_empty_result',
  'accommodation_clicked',
  'alert_bridge_started',
] as const;

export type TravelPlannerFunnelEventName = (typeof TRAVEL_PLANNER_FUNNEL_EVENT_NAMES)[number];

export interface GetAdminTravelPlannerFunnelInput {
  now?: Date;
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function emptyCounts(): AdminTravelPlannerFunnelCounts {
  return {
    landingViewed: 0,
    plannerStarted: 0,
    plannerSubmitted: 0,
    plannerResultViewed: 0,
    plannerFailed: 0,
    plannerEmptyResult: 0,
    accommodationClicked: 0,
    alertBridgeStarted: 0,
  };
}

function toCounts(rows: Array<{ eventName: string; _count: { _all: number } }>): AdminTravelPlannerFunnelCounts {
  const counts = emptyCounts();

  for (const row of rows) {
    switch (row.eventName as TravelPlannerFunnelEventName) {
      case 'landing_viewed':
        counts.landingViewed = row._count._all;
        break;
      case 'planner_started':
        counts.plannerStarted = row._count._all;
        break;
      case 'planner_submitted':
        counts.plannerSubmitted = row._count._all;
        break;
      case 'planner_result_viewed':
        counts.plannerResultViewed = row._count._all;
        break;
      case 'planner_failed':
        counts.plannerFailed = row._count._all;
        break;
      case 'planner_empty_result':
        counts.plannerEmptyResult = row._count._all;
        break;
      case 'accommodation_clicked':
        counts.accommodationClicked = row._count._all;
        break;
      case 'alert_bridge_started':
        counts.alertBridgeStarted = row._count._all;
        break;
    }
  }

  return counts;
}

export async function getAdminTravelPlannerFunnel(
  input: GetAdminTravelPlannerFunnelInput = {},
): Promise<AdminTravelPlannerFunnelResponse> {
  const now = input.now ?? new Date();
  const from = startOfUtcDay(addUtcDays(now, -6));
  const to = endOfUtcDay(now);

  const rows = await prisma.landingEvent.groupBy({
    by: ['eventName'],
    where: {
      source: 'travel-planner',
      eventName: { in: [...TRAVEL_PLANNER_FUNNEL_EVENT_NAMES] },
      occurredAt: {
        gte: from,
        lte: to,
      },
    },
    _count: {
      _all: true,
    },
  });

  const counts = toCounts(rows);

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: 'UTC',
    },
    counts,
    conversion: {
      landingToStarted: safeRatio(counts.plannerStarted, counts.landingViewed),
      startedToSubmitted: safeRatio(counts.plannerSubmitted, counts.plannerStarted),
      startedToResultViewed: safeRatio(counts.plannerResultViewed, counts.plannerStarted),
      resultViewedToAccommodationClicked: safeRatio(counts.accommodationClicked, counts.plannerResultViewed),
      accommodationClickedToAlertBridgeStarted: safeRatio(counts.alertBridgeStarted, counts.accommodationClicked),
    },
  };
}
