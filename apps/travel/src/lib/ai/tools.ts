import { createHash } from 'node:crypto';
import { tool } from 'ai';
import { z } from 'zod';

import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { searchGooglePlaces } from '@/lib/api/places';
import { generateAffiliateLink } from '@/lib/api/awinLinkBuilder';
import type { AccommodationEntity, EsimEntity, SearchAccommodationResult, SearchEsimResult } from '@/lib/types';
import { getFirstAdvertiserByCategory } from '@/services/affiliate-advertiser.service';
import { resolveAffiliateLinksEnabled } from '@/services/conversation-preference.service';

interface TravelToolsOptions {
  conversationId?: string;
  userId?: string;
}

function buildStableProductId(prefix: string, parts: string[]): string {
  const seed = parts.join('|').trim();
  const digest = createHash('sha1').update(seed).digest('hex').slice(0, 12);
  return `${prefix}-${digest}`;
}

function buildClickref(conversationId: string | undefined, productId: string): string {
  const normalizedConversationId = conversationId?.trim();
  if (!normalizedConversationId) return productId;
  return `${normalizedConversationId}:${productId}`;
}

function buildEsimDescription(location?: string, tripDays?: number, dataNeedGB?: number): string {
  const tokens: string[] = [];
  if (location?.trim()) tokens.push(`${location.trim()} 여행`);
  if (tripDays != null) tokens.push(`${tripDays}일`);
  if (dataNeedGB != null) tokens.push(`${dataNeedGB}GB 권장`);
  if (tokens.length === 0) return '해외여행 데이터 eSIM';
  return `${tokens.join(' · ')} 데이터 eSIM`;
}

export function createTravelTools(options: TravelToolsOptions = {}) {
  const { conversationId, userId } = options;

  return {
    searchPlaces: tool({
      description:
        'Search for places, attractions, restaurants, hotels, or any point of interest. Returns real data with coordinates, photos, ratings, and reviews.',
      inputSchema: z.object({
        query: z.string().describe('Search query (e.g., "best restaurants in Bangkok", "temples in Kyoto")'),
        location: z.string().optional().describe('Optional location bias (e.g., "Bangkok, Thailand")'),
        type: z
          .enum(['restaurant', 'hotel', 'tourist_attraction', 'museum', 'park', 'cafe', 'general'])
          .optional()
          .describe('Type of place to search for'),
      }),
      execute: async ({ query, location, type }) => {
        return searchGooglePlaces({ query, location, type });
      },
    }),

    getWeatherHistory: tool({
      description:
        'Get historical monthly weather data for a city. Useful for recommending best travel seasons and what to pack.',
      inputSchema: z.object({
        city: z.string().describe('City name (e.g., "Bangkok", "Tokyo", "Paris")'),
        month: z.number().min(1).max(12).optional().describe('Specific month (1-12) to get weather for'),
      }),
      execute: async ({ city, month }) => {
        return fetchWeatherHistory({ city, month });
      },
    }),

    getExchangeRate: tool({
      description: 'Get current exchange rates between currencies. Useful for budget planning and cost comparisons.',
      inputSchema: z.object({
        baseCurrency: z.string().describe('Base currency code (e.g., "USD", "KRW", "EUR")'),
        targetCurrencies: z.array(z.string()).describe('Target currency codes (e.g., ["THB", "JPY", "EUR"])'),
      }),
      execute: async ({ baseCurrency, targetCurrencies }) => {
        return fetchExchangeRate({ baseCurrency, targetCurrencies });
      },
    }),

    searchAccommodation: tool({
      description:
        'Search for hotels and accommodations with affiliate booking links. Use this tool INSTEAD of searchPlaces when the user asks about hotels, accommodations, places to stay, or lodging. Returns affiliated results with booking links and non-affiliated alternatives.',
      inputSchema: z.object({
        query: z.string().describe('Hotel search query (e.g., "best hotels in Tokyo", "ryokan in Kyoto")'),
        location: z.string().optional().describe('Optional location bias (e.g., "Tokyo, Japan")'),
      }),
      execute: async ({ query, location }): Promise<SearchAccommodationResult> => {
        // Stage A: Google Places 호텔 타입으로 검색 (Agoda API 수령 전 shim)
        const { places } = await searchGooglePlaces({ query, location, type: 'hotel' });
        const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
        const isAffiliateEnabled = affiliateLinkPolicy.enabled;

        // DB에서 accommodation 카테고리 광고주 조회
        const advertiser = isAffiliateEnabled ? await getFirstAdvertiserByCategory('accommodation') : null;

        // Awin 추적 링크 생성 (광고주 있을 때만, 실패해도 null로 진행)
        const firstPlace = places[0];
        let affiliateLink: string | undefined;
        if (advertiser && firstPlace) {
          const linkResult = await generateAffiliateLink({
            advertiserId: advertiser.advertiserId,
            clickref: buildClickref(conversationId, firstPlace.placeId),
          });
          affiliateLink = linkResult?.url;
        }

        const ctaEnabled = !!affiliateLink;
        const provider = advertiser
          ? `awin:${advertiser.advertiserId}`
          : isAffiliateEnabled
            ? 'awin_pending:accommodation'
            : 'awin_disabled:accommodation';

        // 제휴 카드: 첫 번째 결과
        const affiliate: AccommodationEntity | null = firstPlace
          ? {
              placeId: firstPlace.placeId,
              name: firstPlace.name,
              address: firstPlace.address,
              latitude: firstPlace.latitude,
              longitude: firstPlace.longitude,
              rating: firstPlace.rating,
              userRatingsTotal: firstPlace.userRatingsTotal,
              types: firstPlace.types,
              photoUrl: firstPlace.photoUrl,
              affiliateLink,
              isAffiliate: true,
              advertiserName: advertiser?.name,
            }
          : null;

        // 비제휴 대안: 나머지 결과를 rating DESC → reviewCount DESC → 원본 순서로 정렬, 최대 2개
        const remaining = places.slice(1);
        const withRating = remaining.filter((p) => p.rating != null);
        const withoutRating = remaining.filter((p) => p.rating == null);
        withRating.sort((a, b) => {
          const rDiff = (b.rating ?? 0) - (a.rating ?? 0);
          if (rDiff !== 0) return rDiff;
          return (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0);
        });
        const sortedRemaining = [...withRating, ...withoutRating];

        const alternatives: AccommodationEntity[] = sortedRemaining.slice(0, 2).map((p) => ({
          placeId: p.placeId,
          name: p.name,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          rating: p.rating,
          userRatingsTotal: p.userRatingsTotal,
          types: p.types,
          photoUrl: p.photoUrl,
          isAffiliate: false,
        }));

        return { affiliate, alternatives, ctaEnabled, provider };
      },
    }),

    searchEsim: tool({
      description:
        'Search for travel eSIM options with affiliate purchase links. Use this tool for eSIM, roaming data, mobile data pass, or internet plan questions.',
      inputSchema: z.object({
        query: z.string().describe('eSIM search query (e.g., "best esim for japan", "europe data esim")'),
        location: z.string().optional().describe('Travel destination or region (e.g., "Tokyo, Japan", "Europe")'),
        tripDays: z.number().int().min(1).max(90).optional().describe('Planned trip duration in days'),
        dataNeedGB: z.number().min(1).max(100).optional().describe('Estimated data need in GB'),
      }),
      execute: async ({ query, location, tripDays, dataNeedGB }): Promise<SearchEsimResult> => {
        const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
        const isAffiliateEnabled = affiliateLinkPolicy.enabled;
        const advertiser = isAffiliateEnabled ? await getFirstAdvertiserByCategory('esim') : null;
        const productId = buildStableProductId('esim', [
          query,
          location ?? 'global',
          `${tripDays ?? ''}`,
          `${dataNeedGB ?? ''}`,
        ]);

        let affiliateLink: string | undefined;
        if (advertiser) {
          const linkResult = await generateAffiliateLink({
            advertiserId: advertiser.advertiserId,
            clickref: buildClickref(conversationId, productId),
          });
          affiliateLink = linkResult?.url;
        }

        const ctaEnabled = !!affiliateLink;
        const provider = advertiser
          ? `awin:${advertiser.advertiserId}`
          : isAffiliateEnabled
            ? 'awin_pending:esim'
            : 'awin_disabled:esim';
        const primary: EsimEntity = {
          productId,
          name: advertiser ? `${advertiser.name} eSIM` : '여행용 eSIM',
          description: buildEsimDescription(location, tripDays, dataNeedGB),
          coverage: location?.trim() || 'Global',
          affiliateLink,
          isAffiliate: true,
          advertiserName: advertiser?.name,
        };

        return { primary, ctaEnabled, provider };
      },
    }),
  };
}

export const travelTools = createTravelTools();
