import { createHash } from 'node:crypto';
import { tool } from 'ai';
import { z } from 'zod';

import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { searchGooglePlaces } from '@/lib/api/places';
import { searchAgodaAccommodations } from '@/lib/api/agoda';
import { generateAffiliateLink } from '@/lib/api/awinLinkBuilder';
import { isAffiliateCtaEnabled } from '@/lib/featureFlags';
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
        const ctaFeatureEnabled = isAffiliateCtaEnabled();
        const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
        const isAffiliateEnabled = ctaFeatureEnabled && affiliateLinkPolicy.enabled;
        const [agodaResult, placesResult] = await Promise.all([
          searchAgodaAccommodations({ query, location, limit: 5 }),
          searchGooglePlaces({ query, location, type: 'hotel' }),
        ]);
        const places = placesResult.places;

        if (agodaResult.source === 'error') {
          console.warn('[searchAccommodation] agoda api failed, fallback to places-only card:', agodaResult.message);
        }

        const firstAgoda = agodaResult.accommodations[0];
        const firstPlace = places[0];
        const isDisabledByPreference = ctaFeatureEnabled && !affiliateLinkPolicy.enabled;
        const isCtaOffByFlag = !ctaFeatureEnabled;

        const provider = isCtaOffByFlag
          ? 'agoda_disabled:accommodation'
          : firstAgoda
            ? isAffiliateEnabled
              ? 'agoda_direct'
              : isDisabledByPreference
                ? 'agoda_disabled:accommodation'
                : 'agoda_pending:accommodation'
            : isDisabledByPreference
              ? 'agoda_disabled:accommodation'
              : 'agoda_pending:accommodation';

        const affiliateLink =
          firstAgoda && isAffiliateEnabled && firstAgoda.available ? firstAgoda.affiliateLink : undefined;
        const ctaEnabled = Boolean(affiliateLink);

        const affiliate: AccommodationEntity | null = firstAgoda
          ? {
              placeId: `agoda:${firstAgoda.hotelId}`,
              name: firstAgoda.name,
              address: firstAgoda.address,
              latitude: firstAgoda.latitude,
              longitude: firstAgoda.longitude,
              rating: firstAgoda.rating,
              userRatingsTotal: firstAgoda.reviewCount,
              types: ['lodging', 'hotel'],
              photoUrl: firstAgoda.photoUrl,
              affiliateLink,
              isAffiliate: true,
              advertiserName: 'Agoda',
              priceAmount: firstAgoda.priceAmount,
              priceCurrency: firstAgoda.priceCurrency,
              isAvailable: firstAgoda.available,
            }
          : firstPlace
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
                advertiserName: 'Agoda',
              }
            : null;

        // 비제휴 대안: Places 결과를 rating DESC → reviewCount DESC → 원본 순서로 정렬, 최대 2개
        const remaining = (firstAgoda ? places : places.slice(1)).map((place, index) => ({ place, index }));
        const withRating = remaining.filter(({ place }) => place.rating != null);
        const withoutRating = remaining.filter(({ place }) => place.rating == null);
        withRating.sort((a, b) => {
          const rDiff = (b.place.rating ?? 0) - (a.place.rating ?? 0);
          if (rDiff !== 0) return rDiff;
          const reviewDiff = (b.place.userRatingsTotal ?? 0) - (a.place.userRatingsTotal ?? 0);
          if (reviewDiff !== 0) return reviewDiff;
          return a.index - b.index;
        });
        const sortedRemaining = [...withRating, ...withoutRating];

        const alternatives: AccommodationEntity[] = sortedRemaining.slice(0, 2).map(({ place: p }) => ({
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
        const ctaFeatureEnabled = isAffiliateCtaEnabled();
        const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
        const isAffiliateEnabled = ctaFeatureEnabled && affiliateLinkPolicy.enabled;
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
        const isDisabledByPreference = ctaFeatureEnabled && !affiliateLinkPolicy.enabled;
        const isCtaOffByFlag = !ctaFeatureEnabled;
        const provider = isCtaOffByFlag
          ? 'awin_disabled:esim'
          : advertiser
            ? `awin:${advertiser.advertiserId}`
            : isDisabledByPreference
              ? 'awin_disabled:esim'
              : 'awin_pending:esim';
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
