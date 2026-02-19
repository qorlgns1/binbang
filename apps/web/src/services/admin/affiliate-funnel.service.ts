import { type AffiliateAdvertiserCategory, prisma } from '@workspace/db';
import { addUtcDays, endOfUtcDay, startOfUtcDay } from '@workspace/shared/utils/date';

import { ensureRedisConnected, getRedisClient } from '@/lib/redis';
import { AwinConfigError, listAwinTransactions } from '@/services/admin/awin.service';
import type { FunnelRangePreset } from '@/services/admin/funnel.service';

const DEFAULT_RANGE: FunnelRangePreset = '30d';
const DEFAULT_CACHE_TTL_SECONDS = Number.parseInt(process.env.AFFILIATE_DASHBOARD_CACHE_TTL_SECONDS ?? '300', 10);
const CACHE_PREFIX = 'admin:funnel:affiliate';

export interface AdminAffiliateCategoryFunnel {
  category: AffiliateAdvertiserCategory;
  impression: number;
  ctaAttempt: number;
  outboundClick: number;
  clickThroughRate: number;
}

export interface AdminAffiliateProviderFunnel {
  provider: string;
  impression: number;
  ctaAttempt: number;
  outboundClick: number;
  clickThroughRate: number;
}

export interface AdminAffiliateRevenueSummary {
  status: 'ok' | 'unavailable' | 'error';
  conversionCount: number;
  commissionAmount: number;
  currency: string | null;
  message?: string;
}

export interface AdminAffiliateFunnelData {
  range: {
    from: string;
    to: string;
    timezone: 'UTC';
  };
  filter: {
    from: string;
    to: string;
  };
  displayTimezone: 'browser_local';
  categoryFilter: 'all' | AffiliateAdvertiserCategory;
  cache: {
    ttlSeconds: number;
    invalidation: 'ttl_only';
    immediateInvalidationOnEvent: false;
  };
  totals: {
    impression: number;
    ctaAttempt: number;
    outboundClick: number;
    clickThroughRate: number;
  };
  byCategory: AdminAffiliateCategoryFunnel[];
  byProvider: AdminAffiliateProviderFunnel[];
  revenue: AdminAffiliateRevenueSummary;
}

export interface GetAdminAffiliateFunnelInput {
  range?: FunnelRangePreset;
  from?: string;
  to?: string;
  category?: AffiliateAdvertiserCategory;
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

async function resolveAllRangeStart(now: Date): Promise<Date> {
  const firstEvent = await prisma.affiliateEvent.findFirst({
    orderBy: { occurredAt: 'asc' },
    select: { occurredAt: true },
  });

  if (!firstEvent) return startOfUtcDay(now);
  return startOfUtcDay(firstEvent.occurredAt);
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

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function cacheKeyFromInput(input: { from: Date; to: Date; category?: AffiliateAdvertiserCategory }): string {
  return `${CACHE_PREFIX}:${input.from.toISOString()}:${input.to.toISOString()}:${input.category ?? 'all'}`;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function readNumberFromTransaction(tx: Record<string, unknown>): number {
  const candidates = [
    tx.commissionAmount,
    tx.commission,
    tx.amount,
    tx.publisherCommission,
    tx.publisherAmount,
    tx.saleAmount,
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value > 0) return value;
  }

  return 0;
}

function extractCurrency(transactions: Record<string, unknown>[]): string | null {
  for (const tx of transactions) {
    const candidates = [tx.currency, tx.currencyCode, tx.commissionCurrency, tx.saleCurrency];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().toUpperCase();
      }
    }
  }

  return null;
}

async function fetchAwinRevenueSummary(from: Date, to: Date): Promise<AdminAffiliateRevenueSummary> {
  try {
    const result = await listAwinTransactions({
      startDate: from.toISOString().slice(0, 10),
      endDate: to.toISOString().slice(0, 10),
      dateType: 'transaction',
      status: 'approved',
      timezone: 'UTC',
      showBasketProducts: false,
    });

    if (!result.ok) {
      return {
        status: 'error',
        conversionCount: 0,
        commissionAmount: 0,
        currency: null,
        message: result.error ?? result.message ?? `status=${result.status ?? 500}`,
      };
    }

    const body = result.body;
    let transactions: Record<string, unknown>[] = [];

    if (Array.isArray(body)) {
      transactions = body.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
    } else if (body && typeof body === 'object') {
      const boxed = body as { transactions?: unknown; data?: unknown };
      const candidate = Array.isArray(boxed.transactions)
        ? boxed.transactions
        : Array.isArray(boxed.data)
          ? boxed.data
          : [];
      transactions = candidate.filter(
        (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
      );
    }

    const commissionAmount = transactions.reduce((sum, tx) => sum + readNumberFromTransaction(tx), 0);

    return {
      status: 'ok',
      conversionCount: transactions.length,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      currency: extractCurrency(transactions),
    };
  } catch (error) {
    if (error instanceof AwinConfigError) {
      return {
        status: 'unavailable',
        conversionCount: 0,
        commissionAmount: 0,
        currency: null,
        message: error.message,
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      conversionCount: 0,
      commissionAmount: 0,
      currency: null,
      message,
    };
  }
}

async function readCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const connected = await ensureRedisConnected(redis);
  if (!connected) return null;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[admin affiliate funnel] cache read failed:', error);
    return null;
  }
}

async function writeCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const connected = await ensureRedisConnected(redis);
  if (!connected) return;

  try {
    await redis.setex(key, Math.max(1, ttlSeconds), JSON.stringify(value));
  } catch (error) {
    console.warn('[admin affiliate funnel] cache write failed:', error);
  }
}

export async function getAdminAffiliateFunnel(
  input: GetAdminAffiliateFunnelInput = {},
): Promise<AdminAffiliateFunnelData> {
  const now = input.now ?? new Date();
  const range = input.range ?? DEFAULT_RANGE;
  const { from, to } = await resolveRange(range, now, input.from, input.to);
  const ttl = Number.isFinite(DEFAULT_CACHE_TTL_SECONDS) ? Math.max(1, DEFAULT_CACHE_TTL_SECONDS) : 300;

  const cacheKey = cacheKeyFromInput({ from, to, category: input.category });
  const cached = await readCached<AdminAffiliateFunnelData>(cacheKey);
  if (cached) {
    return cached;
  }

  const where = {
    occurredAt: {
      gte: from,
      lte: to,
    },
    ...(input.category ? { category: input.category } : {}),
  };

  const rows = await prisma.affiliateEvent.groupBy({
    by: ['category', 'eventType'],
    where,
    _count: {
      _all: true,
    },
  });
  const providerRows = await prisma.affiliateEvent.groupBy({
    by: ['provider', 'eventType'],
    where,
    _count: {
      _all: true,
    },
  });

  const categoryMap = new Map<AffiliateAdvertiserCategory, AdminAffiliateCategoryFunnel>();
  const providerMap = new Map<string, AdminAffiliateProviderFunnel>();

  for (const row of rows) {
    const current =
      categoryMap.get(row.category) ??
      ({
        category: row.category,
        impression: 0,
        ctaAttempt: 0,
        outboundClick: 0,
        clickThroughRate: 0,
      } as AdminAffiliateCategoryFunnel);

    if (row.eventType === 'impression') current.impression = row._count._all;
    if (row.eventType === 'cta_attempt') current.ctaAttempt = row._count._all;
    if (row.eventType === 'outbound_click') current.outboundClick = row._count._all;

    categoryMap.set(row.category, current);
  }

  const byCategory = [...categoryMap.values()]
    .map((item) => ({
      ...item,
      clickThroughRate: safeRatio(item.outboundClick, item.impression),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  for (const row of providerRows) {
    const current =
      providerMap.get(row.provider) ??
      ({
        provider: row.provider,
        impression: 0,
        ctaAttempt: 0,
        outboundClick: 0,
        clickThroughRate: 0,
      } as AdminAffiliateProviderFunnel);

    if (row.eventType === 'impression') current.impression = row._count._all;
    if (row.eventType === 'cta_attempt') current.ctaAttempt = row._count._all;
    if (row.eventType === 'outbound_click') current.outboundClick = row._count._all;

    providerMap.set(row.provider, current);
  }

  const byProvider = [...providerMap.values()]
    .map((item) => ({
      ...item,
      clickThroughRate: safeRatio(item.outboundClick, item.impression),
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider));

  const totals = byCategory.reduce(
    (acc, item) => {
      acc.impression += item.impression;
      acc.ctaAttempt += item.ctaAttempt;
      acc.outboundClick += item.outboundClick;
      return acc;
    },
    { impression: 0, ctaAttempt: 0, outboundClick: 0, clickThroughRate: 0 },
  );

  totals.clickThroughRate = safeRatio(totals.outboundClick, totals.impression);

  const revenue = await fetchAwinRevenueSummary(from, to);

  const payload: AdminAffiliateFunnelData = {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: 'UTC',
    },
    filter: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    displayTimezone: 'browser_local',
    categoryFilter: input.category ?? 'all',
    cache: {
      ttlSeconds: ttl,
      invalidation: 'ttl_only',
      immediateInvalidationOnEvent: false,
    },
    totals,
    byCategory,
    byProvider,
    revenue,
  };

  await writeCached(cacheKey, payload, ttl);
  return payload;
}
