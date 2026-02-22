import type { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { prisma } from '@workspace/db';

interface AggregateAffiliateFunnelInput {
  from: Date;
  to: Date;
  category?: AffiliateAdvertiserCategory;
}

export interface AffiliateCategoryFunnelItem {
  category: AffiliateAdvertiserCategory;
  impression: number;
  ctaAttempt: number;
  outboundClick: number;
  clickThroughRate: number;
}

export interface AggregateAffiliateFunnelResult {
  from: string;
  to: string;
  total: {
    impression: number;
    ctaAttempt: number;
    outboundClick: number;
    clickThroughRate: number;
  };
  byCategory: AffiliateCategoryFunnelItem[];
}

interface FunnelMetrics {
  impression: number;
  ctaAttempt: number;
  outboundClick: number;
  clickThroughRate: number;
}

interface GroupedMetricRow<TKey extends string> {
  key: TKey;
  eventType: string;
  count: number;
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function createEmptyMetrics(): FunnelMetrics {
  return { impression: 0, ctaAttempt: 0, outboundClick: 0, clickThroughRate: 0 };
}

function applyEventCount(metrics: FunnelMetrics, eventType: string, count: number): void {
  if (eventType === 'impression') metrics.impression = count;
  if (eventType === 'cta_attempt') metrics.ctaAttempt = count;
  if (eventType === 'outbound_click') metrics.outboundClick = count;
}

function addClickThroughRate<T extends FunnelMetrics>(item: T): T {
  return { ...item, clickThroughRate: safeRatio(item.outboundClick, item.impression) };
}

function buildGroupedFunnel<TKey extends string, TResult extends FunnelMetrics>(
  rows: GroupedMetricRow<TKey>[],
  createResult: (key: TKey) => TResult,
): TResult[] {
  const map = new Map<TKey, TResult>();

  for (const row of rows) {
    const current = map.get(row.key) ?? createResult(row.key);
    applyEventCount(current, row.eventType, row.count);
    map.set(row.key, current);
  }

  return [...map.values()].map((item) => addClickThroughRate(item));
}

function calculateTotals(rows: FunnelMetrics[]): AggregateAffiliateFunnelResult['total'] {
  const totals = rows.reduce((acc, item) => {
    acc.impression += item.impression;
    acc.ctaAttempt += item.ctaAttempt;
    acc.outboundClick += item.outboundClick;
    return acc;
  }, createEmptyMetrics());

  return { ...totals, clickThroughRate: safeRatio(totals.outboundClick, totals.impression) };
}

export async function aggregateAffiliateFunnel(
  input: AggregateAffiliateFunnelInput,
): Promise<AggregateAffiliateFunnelResult> {
  const where = {
    occurredAt: { gte: input.from, lte: input.to },
    ...(input.category ? { category: input.category } : {}),
  };

  const rows = await prisma.affiliateEvent.groupBy({
    by: ['category', 'eventType'] as ['category', 'eventType'],
    where,
    _count: { _all: true },
  });

  const byCategory = buildGroupedFunnel(
    rows.map((row) => ({ key: row.category, eventType: row.eventType as AffiliateEventType, count: row._count._all })),
    (category) => ({ category, ...createEmptyMetrics() }),
  ).sort((a, b) => a.category.localeCompare(b.category));

  const total = calculateTotals(byCategory);

  return { from: input.from.toISOString(), to: input.to.toISOString(), total, byCategory };
}
