import { prisma } from '@workspace/db';
import { startOfUtcDay, endOfUtcDay, addUtcDays } from '@workspace/shared/utils/date';

import { LANDING_GROWTH_EVENT_NAMES, type LandingGrowthEventName } from '@/lib/analytics/clickEventNames';
import type { FunnelRangePreset } from '@/services/admin/funnel.service';

const DEFAULT_RANGE: FunnelRangePreset = '30d';

export interface AdminFunnelGrowthKpis {
  organicVisit: number;
  availabilityCtaClick: number;
  signupCompleted: number;
  firstAlertCreated: number;
  totalAlertsCreated: number;
  alertsPerUser: number;
}

export interface AdminFunnelGrowthSeriesItem extends AdminFunnelGrowthKpis {
  date: string;
}

export interface AdminFunnelGrowthConversion {
  visitToSignup: number;
  signupToAlert: number;
  visitToAlert: number;
  ctaToSignup: number;
}

export interface AdminFunnelGrowthData {
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
  kpis: AdminFunnelGrowthKpis;
  conversion: AdminFunnelGrowthConversion;
  series: AdminFunnelGrowthSeriesItem[];
}

export interface GetAdminFunnelGrowthInput {
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

function emptyGrowthKpis(): AdminFunnelGrowthKpis {
  return {
    organicVisit: 0,
    availabilityCtaClick: 0,
    signupCompleted: 0,
    firstAlertCreated: 0,
    totalAlertsCreated: 0,
    alertsPerUser: 0,
  };
}

function applyGrowthEvent(target: AdminFunnelGrowthKpis, eventName: LandingGrowthEventName): void {
  switch (eventName) {
    case 'organic_landing':
      target.organicVisit += 1;
      break;
    case 'availability_cta':
      target.availabilityCtaClick += 1;
      break;
    case 'signup_completed':
      target.signupCompleted += 1;
      break;
    case 'first_alert_created':
      target.firstAlertCreated += 1;
      break;
  }
}

async function resolveAllRangeStart(now: Date): Promise<Date> {
  const firstGrowthEvent = await prisma.landingEvent.findFirst({
    where: { eventName: { in: [...LANDING_GROWTH_EVENT_NAMES] } },
    orderBy: { occurredAt: 'asc' },
    select: { occurredAt: true },
  });

  if (!firstGrowthEvent?.occurredAt) {
    return startOfUtcDay(now);
  }

  return startOfUtcDay(firstGrowthEvent.occurredAt);
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

export async function getAdminFunnelGrowth(input: GetAdminFunnelGrowthInput = {}): Promise<AdminFunnelGrowthData> {
  const range = input.range ?? DEFAULT_RANGE;
  const now = input.now ?? new Date();
  const { from, to } = await resolveRange(range, now, input.from, input.to);
  const rangeFilter = { gte: from, lte: to };

  const rows = await prisma.landingEvent.findMany({
    where: {
      eventName: { in: [...LANDING_GROWTH_EVENT_NAMES] },
      occurredAt: rangeFilter,
    },
    orderBy: { occurredAt: 'asc' },
    select: {
      id: true,
      eventName: true,
      occurredAt: true,
      sessionId: true,
    },
  });

  const totals = emptyGrowthKpis();
  const dateKeys = makeDateKeys(from, to);
  const seriesMap = new Map<string, AdminFunnelGrowthKpis>(
    dateKeys.map((date): [string, AdminFunnelGrowthKpis] => [date, emptyGrowthKpis()]),
  );
  const firstAlertSessionIds = new Set<string>();
  const firstAlertSessionIdsByDate = new Map<string, Set<string>>(
    dateKeys.map((date): [string, Set<string>] => [date, new Set()]),
  );

  for (const row of rows) {
    const eventName = row.eventName as LandingGrowthEventName;
    const dateKey = toUtcDateKey(row.occurredAt);
    const seriesTarget = seriesMap.get(dateKey);

    if (eventName === 'first_alert_created') {
      totals.totalAlertsCreated += 1;
      if (seriesTarget) {
        seriesTarget.totalAlertsCreated += 1;
      }

      const sessionKey = row.sessionId ?? `event:${row.id}`;
      if (!firstAlertSessionIds.has(sessionKey)) {
        firstAlertSessionIds.add(sessionKey);
        totals.firstAlertCreated += 1;
      }

      const sessionIdsForDate = firstAlertSessionIdsByDate.get(dateKey);
      if (sessionIdsForDate && !sessionIdsForDate.has(sessionKey)) {
        sessionIdsForDate.add(sessionKey);
        if (seriesTarget) {
          seriesTarget.firstAlertCreated += 1;
        }
      }
      continue;
    }

    applyGrowthEvent(totals, eventName);
    if (seriesTarget) {
      applyGrowthEvent(seriesTarget, eventName);
    }
  }

  totals.alertsPerUser = safeRatio(totals.totalAlertsCreated, totals.firstAlertCreated);
  for (const dateKey of dateKeys) {
    const seriesTarget = seriesMap.get(dateKey);
    if (seriesTarget) {
      seriesTarget.alertsPerUser = safeRatio(seriesTarget.totalAlertsCreated, seriesTarget.firstAlertCreated);
    }
  }

  const series: AdminFunnelGrowthSeriesItem[] = dateKeys.map((date): AdminFunnelGrowthSeriesItem => {
    const values = seriesMap.get(date);
    return {
      date,
      ...(values ?? emptyGrowthKpis()),
    };
  });

  const conversion: AdminFunnelGrowthConversion = {
    visitToSignup: safeRatio(totals.signupCompleted, totals.organicVisit),
    signupToAlert: safeRatio(totals.firstAlertCreated, totals.signupCompleted),
    visitToAlert: safeRatio(totals.firstAlertCreated, totals.organicVisit),
    ctaToSignup: safeRatio(totals.signupCompleted, totals.availabilityCtaClick),
  };

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
    kpis: totals,
    conversion,
    series,
  };
}
