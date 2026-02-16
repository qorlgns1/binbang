import { prisma } from '@workspace/db';
import { startOfUtcDay, endOfUtcDay, addUtcDays } from '@workspace/shared/utils/date';

import { LANDING_CLICK_EVENT_NAMES, type LandingClickEventName } from '@/lib/analytics/clickEventNames';
import type { FunnelRangePreset } from '@/services/admin/funnel.service';

const DEFAULT_RANGE: FunnelRangePreset = '30d';

export interface AdminFunnelClickTotals {
  navSignup: number;
  navRequest: number;
  navPricing: number;
  mobileMenuOpen: number;
  mobileMenuCta: number;
  total: number;
}

export interface AdminFunnelClickSeriesItem extends AdminFunnelClickTotals {
  date: string;
}

export interface AdminFunnelClicksData {
  range: {
    from: string;
    to: string;
    timezone: 'UTC';
  };
  filter: {
    from: string;
    to: string;
  };
  displayTimezone: 'Asia/Seoul';
  totals: AdminFunnelClickTotals;
  submitted: number;
  navRequestToSubmitted: number;
  series: AdminFunnelClickSeriesItem[];
}

export interface GetAdminFunnelClicksInput {
  range?: FunnelRangePreset;
  from?: string;
  to?: string;
  now?: Date;
}

function parseIsoDate(value: string, label: 'from' | 'to'): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid \`${label}\` datetime`);
  }

  return parsed;
}

function assertValidRangePreset(range: FunnelRangePreset): FunnelRangePreset {
  switch (range) {
    case 'today':
    case '7d':
    case '30d':
    case 'all':
      return range;
    default:
      throw new Error(`Invalid range preset: ${String(range)}`);
  }
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function makeDateKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = startOfUtcDay(from);
  const end = startOfUtcDay(to);

  while (cursor.getTime() <= end.getTime()) {
    keys.push(toUtcDateKey(cursor));
    cursor = addUtcDays(cursor, 1);
  }

  return keys;
}

function emptyClickTotals(): AdminFunnelClickTotals {
  return {
    navSignup: 0,
    navRequest: 0,
    navPricing: 0,
    mobileMenuOpen: 0,
    mobileMenuCta: 0,
    total: 0,
  };
}

function applyEventCount(target: AdminFunnelClickTotals, eventName: LandingClickEventName): void {
  target.total += 1;

  switch (eventName) {
    case 'nav_signup':
      target.navSignup += 1;
      break;
    case 'nav_request':
      target.navRequest += 1;
      break;
    case 'nav_pricing':
      target.navPricing += 1;
      break;
    case 'mobile_menu_open':
      target.mobileMenuOpen += 1;
      break;
    case 'mobile_menu_cta':
      target.mobileMenuCta += 1;
      break;
  }
}

async function resolveAllRangeStart(now: Date): Promise<Date> {
  const [firstLandingClick, firstSubmission] = await Promise.all([
    prisma.landingEvent.findFirst({
      where: { eventName: { in: [...LANDING_CLICK_EVENT_NAMES] } },
      orderBy: { occurredAt: 'asc' },
      select: { occurredAt: true },
    }),
    prisma.formSubmission.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  const candidates = [firstLandingClick?.occurredAt, firstSubmission?.createdAt]
    .filter((value): value is Date => value instanceof Date)
    .map((value): number => value.getTime());

  if (candidates.length === 0) {
    return startOfUtcDay(now);
  }

  return startOfUtcDay(new Date(Math.min(...candidates)));
}

async function resolveRange(
  range: FunnelRangePreset,
  now: Date,
  fromIso?: string,
  toIso?: string,
): Promise<{ from: Date; to: Date }> {
  const validatedRange = assertValidRangePreset(range);

  if (validatedRange !== 'all' && fromIso && toIso) {
    const from = startOfUtcDay(parseIsoDate(fromIso, 'from'));
    const to = endOfUtcDay(parseIsoDate(toIso, 'to'));

    if (from.getTime() > to.getTime()) {
      throw new Error('`from` must be less than or equal to `to`');
    }

    return { from, to };
  }

  const to = endOfUtcDay(now);

  switch (validatedRange) {
    case 'today':
      return { from: startOfUtcDay(now), to };
    case '7d':
      return { from: startOfUtcDay(addUtcDays(now, -6)), to };
    case '30d':
      return { from: startOfUtcDay(addUtcDays(now, -29)), to };
    case 'all': {
      const from = await resolveAllRangeStart(now);
      return { from, to };
    }
    default:
      throw new Error(`Invalid range preset: ${String(validatedRange)}`);
  }
}

export async function getAdminFunnelClicks(input: GetAdminFunnelClicksInput = {}): Promise<AdminFunnelClicksData> {
  const range = input.range ?? DEFAULT_RANGE;
  const now = input.now ?? new Date();
  const { from, to } = await resolveRange(range, now, input.from, input.to);
  const rangeFilter = { gte: from, lte: to };

  const [submitted, clickRows] = await Promise.all([
    prisma.formSubmission.count({
      where: { createdAt: rangeFilter },
    }),
    prisma.landingEvent.findMany({
      where: {
        eventName: { in: [...LANDING_CLICK_EVENT_NAMES] },
        occurredAt: rangeFilter,
      },
      orderBy: { occurredAt: 'asc' },
      select: {
        eventName: true,
        occurredAt: true,
      },
    }),
  ]);

  const dateKeys = makeDateKeys(from, to);
  const totals = emptyClickTotals();
  const seriesMap = new Map<string, AdminFunnelClickTotals>(
    dateKeys.map((date): [string, AdminFunnelClickTotals] => [date, emptyClickTotals()]),
  );

  for (const row of clickRows) {
    const eventName = row.eventName as LandingClickEventName;
    applyEventCount(totals, eventName);

    const key = toUtcDateKey(row.occurredAt);
    const target = seriesMap.get(key);
    if (target) {
      applyEventCount(target, eventName);
    }
  }

  const series: AdminFunnelClickSeriesItem[] = dateKeys.map((date): AdminFunnelClickSeriesItem => {
    const values = seriesMap.get(date);
    return {
      date,
      ...(values ?? emptyClickTotals()),
    };
  });

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: 'UTC',
    },
    filter: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    displayTimezone: 'Asia/Seoul',
    totals,
    submitted,
    navRequestToSubmitted: safeRatio(submitted, totals.navRequest),
    series,
  };
}
