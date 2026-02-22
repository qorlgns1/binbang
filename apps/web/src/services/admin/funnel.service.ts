import { prisma } from '@workspace/db';
import { startOfUtcDay, endOfUtcDay, addUtcDays } from '@workspace/shared/utils/date';
import { BadRequestError } from '@workspace/shared/errors';

export type FunnelRangePreset = 'today' | '7d' | '30d' | 'all';

export interface AdminFunnelKpis {
  submitted: number;
  processed: number;
  paymentConfirmed: number;
  conditionMet: number;
}

export interface AdminFunnelConversion {
  submittedToProcessed: number;
  processedToPaymentConfirmed: number;
  paymentConfirmedToConditionMet: number;
  submittedToConditionMet: number;
}

export interface AdminFunnelSeriesItem extends AdminFunnelKpis {
  date: string;
}

export interface AdminFunnelRange {
  from: string;
  to: string;
  timezone: 'UTC';
}

export interface AdminFunnelFilter {
  from: string;
  to: string;
}

export interface AdminFunnelData {
  range: AdminFunnelRange;
  filter: AdminFunnelFilter;
  displayTimezone: 'Asia/Seoul';
  kpis: AdminFunnelKpis;
  conversion: AdminFunnelConversion;
  series: AdminFunnelSeriesItem[];
}

export interface GetAdminFunnelInput {
  range?: FunnelRangePreset;
  from?: string;
  to?: string;
  now?: Date;
}

const DEFAULT_RANGE: FunnelRangePreset = '30d';

function parseIsoDate(value: string, label: 'from' | 'to'): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestError(`Invalid \`${label}\` datetime`);
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
      throw new BadRequestError(`Invalid range preset: ${String(range)}`);
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

async function resolveAllRangeStart(now: Date): Promise<Date> {
  const [submitted, processed, paymentConfirmed, conditionMet] = await Promise.all([
    prisma.formSubmission.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.formSubmission.findFirst({
      where: { status: 'PROCESSED' },
      orderBy: { updatedAt: 'asc' },
      select: { updatedAt: true },
    }),
    prisma.case.findFirst({
      where: { paymentConfirmedAt: { not: null } },
      orderBy: { paymentConfirmedAt: 'asc' },
      select: { paymentConfirmedAt: true },
    }),
    prisma.billingEvent.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  const candidates = [
    submitted?.createdAt,
    processed?.updatedAt,
    paymentConfirmed?.paymentConfirmedAt,
    conditionMet?.createdAt,
  ]
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
      throw new BadRequestError('`from` must be less than or equal to `to`');
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
      throw new BadRequestError(`Invalid range preset: ${String(validatedRange)}`);
  }
}

export async function getAdminFunnel(input: GetAdminFunnelInput = {}): Promise<AdminFunnelData> {
  const range = input.range ?? DEFAULT_RANGE;
  const now = input.now ?? new Date();
  const { from, to } = await resolveRange(range, now, input.from, input.to);

  const rangeFilter = { gte: from, lte: to };

  const [
    submitted,
    processed,
    paymentConfirmed,
    conditionMetRows,
    submittedSeriesRows,
    processedSeriesRows,
    paymentConfirmedSeriesRows,
    conditionMetSeriesRows,
  ] = await Promise.all([
    prisma.formSubmission.count({
      where: { createdAt: rangeFilter },
    }),
    prisma.formSubmission.count({
      where: { status: 'PROCESSED', updatedAt: rangeFilter },
    }),
    prisma.case.count({
      where: { paymentConfirmedAt: rangeFilter },
    }),
    prisma.billingEvent.findMany({
      where: { createdAt: rangeFilter },
      distinct: ['caseId'],
      select: { caseId: true },
    }),
    prisma.formSubmission.findMany({
      where: { createdAt: rangeFilter },
      select: { responseId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.formSubmission.findMany({
      where: { status: 'PROCESSED', updatedAt: rangeFilter },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    }),
    prisma.case.findMany({
      where: { paymentConfirmedAt: rangeFilter },
      select: { id: true, paymentConfirmedAt: true },
      orderBy: { paymentConfirmedAt: 'asc' },
    }),
    prisma.billingEvent.findMany({
      where: { createdAt: rangeFilter },
      distinct: ['caseId'],
      select: { caseId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const conditionMet = conditionMetRows.length;

  const dateKeys = makeDateKeys(from, to);
  const seriesMap = new Map<string, AdminFunnelKpis>(
    dateKeys.map((date): [string, AdminFunnelKpis] => [
      date,
      {
        submitted: 0,
        processed: 0,
        paymentConfirmed: 0,
        conditionMet: 0,
      },
    ]),
  );

  for (const row of submittedSeriesRows) {
    const key = toUtcDateKey(row.createdAt);
    const target = seriesMap.get(key);
    if (target) {
      target.submitted += 1;
    }
  }

  for (const row of processedSeriesRows) {
    const key = toUtcDateKey(row.updatedAt);
    const target = seriesMap.get(key);
    if (target) {
      target.processed += 1;
    }
  }

  for (const row of paymentConfirmedSeriesRows) {
    if (!row.paymentConfirmedAt) continue;
    const key = toUtcDateKey(row.paymentConfirmedAt);
    const target = seriesMap.get(key);
    if (target) {
      target.paymentConfirmed += 1;
    }
  }

  for (const row of conditionMetSeriesRows) {
    const key = toUtcDateKey(row.createdAt);
    const target = seriesMap.get(key);
    if (target) {
      target.conditionMet += 1;
    }
  }

  const kpis: AdminFunnelKpis = {
    submitted,
    processed,
    paymentConfirmed,
    conditionMet,
  };

  const conversion: AdminFunnelConversion = {
    submittedToProcessed: safeRatio(kpis.processed, kpis.submitted),
    processedToPaymentConfirmed: safeRatio(kpis.paymentConfirmed, kpis.processed),
    paymentConfirmedToConditionMet: safeRatio(kpis.conditionMet, kpis.paymentConfirmed),
    submittedToConditionMet: safeRatio(kpis.conditionMet, kpis.submitted),
  };

  const series: AdminFunnelSeriesItem[] = dateKeys.map((date): AdminFunnelSeriesItem => {
    const values = seriesMap.get(date);
    if (!values) {
      return {
        date,
        submitted: 0,
        processed: 0,
        paymentConfirmed: 0,
        conditionMet: 0,
      };
    }

    return {
      date,
      ...values,
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
    kpis,
    conversion,
    series,
  };
}
