import { normalizeAgodaSearchResponse } from './normalize';

export type AgodaAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface AgodaPayloadSummary {
  availability: AgodaAvailability;
  normalizedOfferCount: number;
  landingUrlDetectedCount: number;
  landingUrlSample: string | null;
  normalizedOffers: Array<{
    offerKey: string;
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    remainingRooms: number | null;
    totalInclusive: number | null;
    currency: string | null;
    freeCancellation: boolean | null;
    landingUrl: string | null;
    payloadHash: string;
  }>;
}

export function summarizeAgodaPayload(payload: unknown): AgodaPayloadSummary {
  const normalized = normalizeAgodaSearchResponse(payload);
  const normalizedOffers = normalized.offers.map((offer) => ({
    offerKey: offer.offerKey,
    propertyId: offer.propertyId.toString(),
    roomId: offer.roomId.toString(),
    ratePlanId: offer.ratePlanId.toString(),
    remainingRooms: offer.remainingRooms,
    totalInclusive: offer.totalInclusive,
    currency: offer.currency,
    freeCancellation: offer.freeCancellation,
    landingUrl: offer.landingUrl,
    payloadHash: offer.payloadHash,
  }));

  return {
    availability: normalizedOffers.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
    normalizedOfferCount: normalizedOffers.length,
    landingUrlDetectedCount: normalizedOffers.filter((offer) => offer.landingUrl != null).length,
    landingUrlSample: normalizedOffers.find((offer) => offer.landingUrl != null)?.landingUrl ?? null,
    normalizedOffers,
  };
}
