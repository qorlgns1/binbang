import type { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { prisma } from '@workspace/db';

const UTC_TIMEZONE = 'UTC';

type EventReasonCode = 'no_advertiser_for_category' | 'affiliate_links_disabled';

export interface CreateAffiliateEventInput {
  conversationId?: string;
  userId?: string | null;
  userTimezone?: string | null;
  provider: string;
  eventType: AffiliateEventType;
  reasonCode?: EventReasonCode;
  productId: string;
  productName: string;
  category: AffiliateAdvertiserCategory;
  isCtaEnabled: boolean;
  occurredAt?: Date;
}

export interface CreateAffiliateEventResult {
  id: string | null;
  created: boolean;
  deduped: boolean;
  resolvedTimezone: string | null;
  localOrUtcDay: string;
}

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

function isValidIanaTimezone(value: string | null | undefined): value is string {
  const timezone = value?.trim();
  if (!timezone) return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function getLocalDay(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

async function resolveUserTimezone(
  userId: string | null | undefined,
  fallbackTimezone?: string | null,
): Promise<string | null> {
  const fallback = isValidIanaTimezone(fallbackTimezone) ? fallbackTimezone : null;
  if (!userId) return fallback;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (isValidIanaTimezone(user?.timezone)) {
    return user.timezone;
  }

  return fallback;
}

function buildImpressionIdempotencyKey(
  conversationId: string | undefined,
  productId: string,
  localOrUtcDay: string,
): string {
  return `impression:${conversationId ?? 'guest'}:${productId}:${localOrUtcDay}`;
}

export async function createAffiliateEvent(input: CreateAffiliateEventInput): Promise<CreateAffiliateEventResult> {
  const occurredAt = input.occurredAt ?? new Date();
  const resolvedTimezone = await resolveUserTimezone(input.userId, input.userTimezone);
  const timezoneForDay = resolvedTimezone ?? UTC_TIMEZONE;
  const localOrUtcDay = getLocalDay(occurredAt, timezoneForDay);

  const idempotencyKey =
    input.eventType === 'impression'
      ? buildImpressionIdempotencyKey(input.conversationId, input.productId, localOrUtcDay)
      : null;

  try {
    const created = await prisma.affiliateEvent.create({
      data: {
        conversationId: input.conversationId,
        userId: input.userId ?? null,
        userTimezone: resolvedTimezone,
        provider: input.provider,
        eventType: input.eventType,
        reasonCode: input.reasonCode ?? null,
        idempotencyKey,
        productId: input.productId,
        productName: input.productName,
        category: input.category,
        isCtaEnabled: input.isCtaEnabled,
        occurredAt,
      },
      select: { id: true },
    });

    return {
      id: created.id,
      created: true,
      deduped: false,
      resolvedTimezone,
      localOrUtcDay,
    };
  } catch (error) {
    const isUniqueConstraintError =
      typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
    if (idempotencyKey && isUniqueConstraintError) {
      return {
        id: null,
        created: false,
        deduped: true,
        resolvedTimezone,
        localOrUtcDay,
      };
    }

    throw error;
  }
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

export async function aggregateAffiliateFunnel(
  input: AggregateAffiliateFunnelInput,
): Promise<AggregateAffiliateFunnelResult> {
  const where = {
    occurredAt: {
      gte: input.from,
      lte: input.to,
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

  const categoryMap = new Map<AffiliateAdvertiserCategory, AffiliateCategoryFunnelItem>();

  for (const row of rows) {
    const base =
      categoryMap.get(row.category) ??
      ({
        category: row.category,
        impression: 0,
        ctaAttempt: 0,
        outboundClick: 0,
        clickThroughRate: 0,
      } as AffiliateCategoryFunnelItem);

    if (row.eventType === 'impression') base.impression = row._count._all;
    if (row.eventType === 'cta_attempt') base.ctaAttempt = row._count._all;
    if (row.eventType === 'outbound_click') base.outboundClick = row._count._all;

    categoryMap.set(row.category, base);
  }

  const byCategory = [...categoryMap.values()]
    .map((item) => ({
      ...item,
      clickThroughRate: safeRatio(item.outboundClick, item.impression),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const total = byCategory.reduce(
    (acc, item) => {
      acc.impression += item.impression;
      acc.ctaAttempt += item.ctaAttempt;
      acc.outboundClick += item.outboundClick;
      return acc;
    },
    { impression: 0, ctaAttempt: 0, outboundClick: 0, clickThroughRate: 0 },
  );

  total.clickThroughRate = safeRatio(total.outboundClick, total.impression);

  return {
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    total,
    byCategory,
  };
}
