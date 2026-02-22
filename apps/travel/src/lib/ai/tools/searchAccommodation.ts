import { tool } from 'ai';
import { z } from 'zod';

import { searchAgodaAccommodations } from '@/lib/api/agoda';
import { searchGooglePlaces } from '@/lib/api/places';
import { isAffiliateCtaEnabled } from '@/lib/featureFlags';
import type { AccommodationEntity, SearchAccommodationResult } from '@/lib/types';
import { resolveAffiliateLinksEnabled } from '@/services/conversation-preference.service';

import { resolveAffiliateProvider } from './affiliateUtils';
import type { TravelToolsOptions } from './affiliateUtils';

export function createSearchAccommodationTool({ conversationId, userId }: TravelToolsOptions) {
  return tool({
    description:
      'Search for hotels and accommodations with affiliate booking links. Use this tool INSTEAD of searchPlaces when the user asks about hotels, accommodations, places to stay, or lodging. Returns affiliated results with booking links and non-affiliated alternatives.',
    inputSchema: z.object({
      query: z.string().describe('Hotel search query (e.g., "best hotels in Tokyo", "ryokan in Kyoto")'),
      location: z.string().optional().describe('Optional location bias (e.g., "Tokyo, Japan")'),
    }),
    execute: async ({ query, location }): Promise<SearchAccommodationResult> => {
      const ctaFeatureEnabled = isAffiliateCtaEnabled();
      const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
      const preferenceEnabled = affiliateLinkPolicy.enabled;
      const canUseAffiliateLink = ctaFeatureEnabled && preferenceEnabled;

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
      const provider = resolveAffiliateProvider({
        ctaFeatureEnabled,
        preferenceEnabled,
        directProvider: firstAgoda && canUseAffiliateLink ? 'agoda_direct' : undefined,
        disabledProvider: 'agoda_disabled:accommodation',
        pendingProvider: 'agoda_pending:accommodation',
      });

      const affiliateLink =
        firstAgoda && canUseAffiliateLink && firstAgoda.available ? firstAgoda.affiliateLink : undefined;
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
              isAffiliate: false,
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
  });
}
