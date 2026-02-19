import { trackAffiliateEvent, trackImpressionOnce } from '@/lib/affiliateTracking';

export const AFFILIATE_DISCLOSURE_TEXT = '예약/구매 시 제휴 수수료를 받을 수 있습니다';

export interface AffiliateTrackingContext {
  conversationId?: string;
  sessionId?: string;
  provider: string;
}

interface AffiliateCardTrackingInput {
  trackingContext?: AffiliateTrackingContext;
  provider: string;
  productId: string;
  productName: string;
  category: 'accommodation' | 'esim';
}

interface AffiliateCardImpressionInput extends AffiliateCardTrackingInput {
  isCtaEnabled: boolean;
}

interface AffiliateCardCtaAttemptInput extends AffiliateCardTrackingInput {
  reasonCode?: 'no_advertiser_for_category' | 'affiliate_links_disabled';
}

export function trackAffiliateCardImpression({
  trackingContext,
  provider,
  productId,
  productName,
  category,
  isCtaEnabled,
}: AffiliateCardImpressionInput) {
  if (!trackingContext) {
    return;
  }

  trackImpressionOnce({
    conversationId: trackingContext.conversationId,
    sessionId: trackingContext.sessionId,
    provider,
    productId,
    productName,
    category,
    isCtaEnabled,
  });
}

export function trackAffiliateCardCtaAttempt({
  trackingContext,
  provider,
  productId,
  productName,
  category,
  reasonCode,
}: AffiliateCardCtaAttemptInput) {
  if (!trackingContext) {
    return;
  }

  void trackAffiliateEvent({
    conversationId: trackingContext.conversationId,
    sessionId: trackingContext.sessionId,
    provider,
    eventType: 'cta_attempt',
    reasonCode,
    productId,
    productName,
    category,
    isCtaEnabled: false,
  });
}

export function trackAffiliateCardOutboundClick({
  trackingContext,
  provider,
  productId,
  productName,
  category,
}: AffiliateCardTrackingInput) {
  if (!trackingContext) {
    return;
  }

  void trackAffiliateEvent({
    conversationId: trackingContext.conversationId,
    sessionId: trackingContext.sessionId,
    provider,
    eventType: 'outbound_click',
    productId,
    productName,
    category,
    isCtaEnabled: true,
  });
}
