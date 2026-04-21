import type { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { getDataSource } from '@workspace/db';

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
  const ds = await getDataSource();

  let sql = `SELECT "category", "eventType", COUNT(*) AS "count"
    FROM "AffiliateEvent"
    WHERE "occurredAt" >= :1 AND "occurredAt" <= :2`;
  const params: unknown[] = [input.from, input.to];

  if (input.category) {
    sql += ` AND "category" = :3`;
    params.push(input.category);
  }

  sql += ` GROUP BY "category", "eventType"`;

  const rawRows = await ds.query<{ category: AffiliateAdvertiserCategory; eventType: string; count: string }[]>(
    sql,
    params,
  );

  const byCategory = buildGroupedFunnel(
    rawRows.map((row) => ({
      key: row.category,
      eventType: row.eventType as AffiliateEventType,
      count: Number(row.count),
    })),
    (category) => ({ category, ...createEmptyMetrics() }),
  ).sort((a, b) => a.category.localeCompare(b.category));

  const total = calculateTotals(byCategory);

  return { from: input.from.toISOString(), to: input.to.toISOString(), total, byCategory };
}
