import type { NormalizedRoomOffer } from '@/lib/agoda/normalize';

export interface VacancyEventCandidate {
  type: 'vacancy';
  eventKey: string;
  beforeHash: string | null;
  afterHash: string;
  offerKey: string;
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

export interface PreviousSnapshotForDetector {
  offerKey: string;
  remainingRooms: number | null;
  totalInclusive: number | null;
  payloadHash: string;
}

function pickVacancyRepresentativeOffer(offers: NormalizedRoomOffer[]): NormalizedRoomOffer {
  return [...offers].sort((a, b) => {
    const aPrice = a.totalInclusive ?? Number.POSITIVE_INFINITY;
    const bPrice = b.totalInclusive ?? Number.POSITIVE_INFINITY;
    if (aPrice !== bPrice) return aPrice - bPrice;
    return a.offerKey.localeCompare(b.offerKey);
  })[0] as NormalizedRoomOffer;
}

/**
 * 빈방 감지: 이전 poll에서 결과가 없었고(호텔 sold out), 현재 poll에서 결과가 생겼을 때 발생.
 *
 * Agoda lt_v1 API는 remainingRooms를 반환하지 않는다.
 * 대신 호텔이 결과에 포함되면 예약 가능, 결과에서 사라지면 sold out으로 판단한다.
 */
export function detectVacancyEvents(params: {
  accommodationId: string;
  previousSnapshots: PreviousSnapshotForDetector[];
  currentOffers: NormalizedRoomOffer[];
  hasBaseline: boolean;
}): VacancyEventCandidate[] {
  if (!params.hasBaseline) return [];
  if (params.previousSnapshots.length > 0) return [];
  if (params.currentOffers.length === 0) return [];

  // 이전 poll에 결과 없음(sold out) → 현재 poll에 결과 있음 → vacancy.
  // 재오픈 시 오퍼 수만큼 중복 알림이 나가지 않도록 대표 오퍼 1개만 이벤트로 발행한다.
  const offer = pickVacancyRepresentativeOffer(params.currentOffers);

  return [
    {
      type: 'vacancy',
      eventKey: `vacancy:${params.accommodationId}:${offer.offerKey}:${offer.payloadHash}`,
      beforeHash: null,
      afterHash: offer.payloadHash,
      offerKey: offer.offerKey,
      meta: {
        propertyId: offer.propertyId.toString(),
        roomId: offer.roomId.toString(),
        ratePlanId: offer.ratePlanId.toString(),
        currency: offer.currency,
        totalInclusive: offer.totalInclusive,
        freeCancellation: offer.freeCancellation,
        freeCancellationDate: offer.freeCancellationDate?.toISOString() ?? null,
      },
    },
  ];
}

function shouldEmitPriceDrop(
  previousPrice: number | null,
  currentPrice: number | null,
  minDropRatio: number,
): { emit: boolean; dropRatio: number } {
  if (previousPrice == null || currentPrice == null) return { emit: false, dropRatio: 0 };
  if (previousPrice <= 0 || currentPrice <= 0) return { emit: false, dropRatio: 0 };

  const dropRatio = (previousPrice - currentPrice) / previousPrice;
  if (dropRatio > 0 && dropRatio >= minDropRatio) return { emit: true, dropRatio };
  return { emit: false, dropRatio };
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
