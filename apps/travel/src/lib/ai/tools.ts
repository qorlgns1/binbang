import { tool } from 'ai';
import { z } from 'zod';

import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { searchGooglePlaces } from '@/lib/api/places';
import { generateAffiliateLink } from '@/lib/api/awinLinkBuilder';
import type { AccommodationEntity, SearchAccommodationResult } from '@/lib/types';
import { getFirstAdvertiserByCategory } from '@/services/affiliate-advertiser.service';

export const travelTools = {
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

      // DB에서 accommodation 카테고리 광고주 조회
      const advertiser = await getFirstAdvertiserByCategory('accommodation');

      // Awin 추적 링크 생성 (광고주 있을 때만, 실패해도 null로 진행)
      let affiliateLink: string | undefined;
      if (advertiser && places[0]) {
        const linkResult = await generateAffiliateLink({
          advertiserId: advertiser.advertiserId,
          clickref: places[0].placeId,
        });
        affiliateLink = linkResult?.url;
      }

      const ctaEnabled = !!affiliateLink;
      const provider = advertiser ? `awin:${advertiser.advertiserId}` : 'awin_pending:accommodation';

      // 제휴 카드: 첫 번째 결과
      const firstPlace = places[0];
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
};
