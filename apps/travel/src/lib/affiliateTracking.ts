import { isAffiliateTrackingEnabled } from '@/lib/featureFlags';

type AffiliateAdvertiserCategory = 'accommodation' | 'flight' | 'esim' | 'car_rental' | 'travel_package' | 'other';
type AffiliateEventType = 'impression' | 'cta_attempt' | 'outbound_click';

const impressionEventMemoryCache = new Set<string>();
const TRACKING_TIMEOUT_MS = 2000;

interface TrackAffiliateEventInput {
  conversationId?: string;
  sessionId?: string;
  provider: string;
  eventType: AffiliateEventType;
  reasonCode?: 'no_advertiser_for_category' | 'affiliate_links_disabled';
  productId: string;
  productName: string;
  category: AffiliateAdvertiserCategory;
  isCtaEnabled: boolean;
}

function getBrowserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function getLocalDayKey(timeZone?: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function buildImpressionMemoryKey(input: TrackAffiliateEventInput): string {
  const contextId = input.conversationId?.trim() || input.sessionId?.trim() || 'null';
  const dateKey = getLocalDayKey(getBrowserTimezone());
  return [contextId, input.productId, dateKey].join(':');
}

export async function trackAffiliateEvent(input: TrackAffiliateEventInput): Promise<void> {
  if (!isAffiliateTrackingEnabled()) {
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRACKING_TIMEOUT_MS);

  try {
    const response = await fetch('/api/affiliate/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      keepalive: true,
      signal: controller.signal,
      body: JSON.stringify({
        conversationId: input.conversationId,
        sessionId: input.sessionId,
        provider: input.provider,
        eventType: input.eventType,
        reasonCode: input.reasonCode,
        productId: input.productId,
        productName: input.productName,
        category: input.category,
        isCtaEnabled: input.isCtaEnabled,
        userTimezone: getBrowserTimezone(),
      }),
    });

    if (!response.ok) {
      console.warn('Affiliate tracking event returned non-OK response', {
        status: response.status,
        eventType: input.eventType,
        provider: input.provider,
        productId: input.productId,
      });
    }
  } catch (error) {
    console.warn('Failed to send affiliate tracking event:', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function trackImpressionOnce(input: Omit<TrackAffiliateEventInput, 'eventType'>): void {
  if (!isAffiliateTrackingEnabled()) {
    return;
  }

  const memoryKey = buildImpressionMemoryKey({ ...input, eventType: 'impression' });
  if (impressionEventMemoryCache.has(memoryKey)) {
    return;
  }

  impressionEventMemoryCache.add(memoryKey);
  void trackAffiliateEvent({ ...input, eventType: 'impression' });
}
