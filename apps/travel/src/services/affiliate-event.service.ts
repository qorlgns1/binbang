import type { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { prisma } from '@workspace/db';

export type { AffiliateCategoryFunnelItem, AggregateAffiliateFunnelResult } from './affiliate-funnel.service';
export { aggregateAffiliateFunnel } from './affiliate-funnel.service';

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
