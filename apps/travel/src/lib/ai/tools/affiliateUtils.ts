import { createHash } from 'node:crypto';

export interface TravelToolsOptions {
  conversationId?: string;
  userId?: string;
}

interface ResolveAffiliateProviderOptions {
  ctaFeatureEnabled: boolean;
  preferenceEnabled: boolean;
  directProvider?: string;
  disabledProvider: string;
  pendingProvider: string;
}

export function buildStableProductId(prefix: string, parts: string[]): string {
  const seed = parts.join('|').trim();
  const digest = createHash('sha1').update(seed).digest('hex').slice(0, 12);
  return `${prefix}-${digest}`;
}

export function buildClickref(conversationId: string | undefined, productId: string): string {
  const normalizedConversationId = conversationId?.trim();
  if (!normalizedConversationId) return productId;
  return `${normalizedConversationId}:${productId}`;
}

export function buildEsimDescription(location?: string, tripDays?: number, dataNeedGB?: number): string {
  const tokens: string[] = [];
  if (location?.trim()) tokens.push(`${location.trim()} 여행`);
  if (tripDays != null) tokens.push(`${tripDays}일`);
  if (dataNeedGB != null) tokens.push(`${dataNeedGB}GB 권장`);
  if (tokens.length === 0) return '해외여행 데이터 eSIM';
  return `${tokens.join(' · ')} 데이터 eSIM`;
}

export function resolveAffiliateProvider({
  ctaFeatureEnabled,
  preferenceEnabled,
  directProvider,
  disabledProvider,
  pendingProvider,
}: ResolveAffiliateProviderOptions): string {
  if (!ctaFeatureEnabled || !preferenceEnabled) return disabledProvider;
  return directProvider ?? pendingProvider;
}
