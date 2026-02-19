type AffiliateAdvertiserCategory = 'accommodation' | 'flight' | 'esim' | 'car_rental' | 'travel_package' | 'other';
type AffiliateEventType = 'impression' | 'cta_attempt' | 'outbound_click';

const impressionEventMemoryCache = new Set<string>();

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

function buildImpressionMemoryKey(input: TrackAffiliateEventInput): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  return [input.conversationId ?? 'guest', input.productId, dateKey].join(':');
}

export async function trackAffiliateEvent(input: TrackAffiliateEventInput): Promise<void> {
  try {
    await fetch('/api/affiliate/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      keepalive: true,
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
  } catch (error) {
    console.warn('Failed to send affiliate tracking event:', error);
  }
}

export function trackImpressionOnce(input: Omit<TrackAffiliateEventInput, 'eventType'>): void {
  const memoryKey = buildImpressionMemoryKey({ ...input, eventType: 'impression' });
  if (impressionEventMemoryCache.has(memoryKey)) {
    return;
  }

  impressionEventMemoryCache.add(memoryKey);
  void trackAffiliateEvent({ ...input, eventType: 'impression' });
}
