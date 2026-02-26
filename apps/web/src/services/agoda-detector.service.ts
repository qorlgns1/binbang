import type { NormalizedRoomOffer } from '@/lib/agoda/normalize';

export interface VacancyEventCandidate {
  type: 'vacancy';
  eventKey: string;
  beforeHash: string | null;
  afterHash: string;
  offerKey: string;
  beforeRemainingRooms: number | null;
  afterRemainingRooms: number | null;
  meta: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    currency: string | null;
    totalInclusive: number | null;
    freeCancellation: boolean | null;
    freeCancellationDate: string | null;
  };
}

export interface PriceDropEventCandidate {
  type: 'price_drop';
  eventKey: string;
  beforeHash: string | null;
  afterHash: string;
  offerKey: string;
  beforePrice: number | null;
  afterPrice: number | null;
  dropRatio: number;
  meta: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    currency: string | null;
    remainingRooms: number | null;
  };
}

export interface VacancyProxyEventCandidate {
  type: 'vacancy_proxy';
  eventKey: string;
  beforeHash: null;
  afterHash: string;
  offerKey: string;
  meta: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    currency: string | null;
    totalInclusive: number | null;
  };
}

export interface PreviousSnapshotForDetector {
  offerKey: string;
  remainingRooms: number | null;
  totalInclusive: number | null;
  payloadHash: string;
}

function shouldEmitVacancy(before: number | null, after: number | null, hasBaseline: boolean): boolean {
  if (after == null || after <= 0) return false;
  if (!hasBaseline) return false;
  return before == null || before <= 0;
}

export function detectVacancyEvents(params: {
  accommodationId: string;
  previousSnapshots: PreviousSnapshotForDetector[];
  currentOffers: NormalizedRoomOffer[];
  hasBaseline: boolean;
}): VacancyEventCandidate[] {
  const previousByKey = new Map<string, PreviousSnapshotForDetector>();
  for (const snapshot of params.previousSnapshots) {
    previousByKey.set(snapshot.offerKey, snapshot);
  }

  const events: VacancyEventCandidate[] = [];

  for (const offer of params.currentOffers) {
    const previous = previousByKey.get(offer.offerKey);
    const beforeRemainingRooms = previous?.remainingRooms ?? null;
    const afterRemainingRooms = offer.remainingRooms;

    if (!shouldEmitVacancy(beforeRemainingRooms, afterRemainingRooms, params.hasBaseline)) {
      continue;
    }

    events.push({
      type: 'vacancy',
      eventKey: `vacancy:${params.accommodationId}:${offer.offerKey}:${offer.payloadHash}`,
      beforeHash: previous?.payloadHash ?? null,
      afterHash: offer.payloadHash,
      offerKey: offer.offerKey,
      beforeRemainingRooms,
      afterRemainingRooms,
      meta: {
        propertyId: offer.propertyId.toString(),
        roomId: offer.roomId.toString(),
        ratePlanId: offer.ratePlanId.toString(),
        currency: offer.currency,
        totalInclusive: offer.totalInclusive,
        freeCancellation: offer.freeCancellation,
        freeCancellationDate: offer.freeCancellationDate?.toISOString() ?? null,
      },
    });
  }

  return events;
}

function shouldEmitPriceDrop(
  previousPrice: number | null,
  currentPrice: number | null,
  minDropRatio: number,
): { emit: boolean; dropRatio: number } {
  if (previousPrice == null || currentPrice == null) return { emit: false, dropRatio: 0 };
  if (previousPrice <= 0 || currentPrice <= 0) return { emit: false, dropRatio: 0 };

  const dropRatio = (previousPrice - currentPrice) / previousPrice;
  if (dropRatio >= minDropRatio) return { emit: true, dropRatio };
  return { emit: false, dropRatio };
}

export function detectOfferAppearanceEvents(params: {
  accommodationId: string;
  previousSnapshots: PreviousSnapshotForDetector[];
  currentOffers: NormalizedRoomOffer[];
  hasBaseline: boolean;
}): VacancyProxyEventCandidate[] {
  if (!params.hasBaseline) return [];

  const previousKeys = new Set(params.previousSnapshots.map((s) => s.offerKey));
  const events: VacancyProxyEventCandidate[] = [];

  for (const offer of params.currentOffers) {
    if (previousKeys.has(offer.offerKey)) continue;
    // remainingRooms != null means vacancy detection already handles it
    if (offer.remainingRooms != null) continue;

    events.push({
      type: 'vacancy_proxy',
      eventKey: `vacancy_proxy:${params.accommodationId}:${offer.offerKey}:${offer.payloadHash}`,
      beforeHash: null,
      afterHash: offer.payloadHash,
      offerKey: offer.offerKey,
      meta: {
        propertyId: offer.propertyId.toString(),
        roomId: offer.roomId.toString(),
        ratePlanId: offer.ratePlanId.toString(),
        currency: offer.currency,
        totalInclusive: offer.totalInclusive,
      },
    });
  }

  return events;
}

export function detectPriceDropEvents(params: {
  accommodationId: string;
  previousSnapshots: PreviousSnapshotForDetector[];
  currentOffers: NormalizedRoomOffer[];
  minDropRatio: number;
}): PriceDropEventCandidate[] {
  const previousByKey = new Map<string, PreviousSnapshotForDetector>();
  for (const snapshot of params.previousSnapshots) {
    previousByKey.set(snapshot.offerKey, snapshot);
  }

  const events: PriceDropEventCandidate[] = [];

  for (const offer of params.currentOffers) {
    const previous = previousByKey.get(offer.offerKey);
    const beforePrice = previous?.totalInclusive ?? null;
    const afterPrice = offer.totalInclusive;

    const decision = shouldEmitPriceDrop(beforePrice, afterPrice, params.minDropRatio);
    if (!decision.emit) continue;

    events.push({
      type: 'price_drop',
      eventKey: `price_drop:${params.accommodationId}:${offer.offerKey}:${offer.payloadHash}`,
      beforeHash: previous?.payloadHash ?? null,
      afterHash: offer.payloadHash,
      offerKey: offer.offerKey,
      beforePrice,
      afterPrice,
      dropRatio: decision.dropRatio,
      meta: {
        propertyId: offer.propertyId.toString(),
        roomId: offer.roomId.toString(),
        ratePlanId: offer.ratePlanId.toString(),
        currency: offer.currency,
        remainingRooms: offer.remainingRooms,
      },
    });
  }

  return events;
}
