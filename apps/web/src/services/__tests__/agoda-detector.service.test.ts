import { describe, expect, it } from 'vitest';

import { detectOfferAppearanceEvents, detectPriceDropEvents, detectVacancyEvents } from '../agoda-detector.service';
import type { PreviousSnapshotForDetector } from '../agoda-detector.service';
import type { NormalizedRoomOffer } from '@/lib/agoda/normalize';

// ============================================================================
// Fixtures
// ============================================================================

function makeOffer(overrides: Partial<NormalizedRoomOffer> = {}): NormalizedRoomOffer {
  return {
    offerKey: '1001:2001:3001',
    propertyId: 1001n,
    roomId: 2001n,
    ratePlanId: 3001n,
    remainingRooms: null,
    freeCancellation: null,
    freeCancellationDate: null,
    totalInclusive: null,
    currency: 'KRW',
    landingUrl: null,
    payloadHash: 'hash_after',
    raw: {},
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<PreviousSnapshotForDetector> = {}): PreviousSnapshotForDetector {
  return {
    offerKey: '1001:2001:3001',
    remainingRooms: null,
    totalInclusive: null,
    payloadHash: 'hash_before',
    ...overrides,
  };
}

const ACCOMMODATION_ID = 'acc_test_001';

// ============================================================================
// detectVacancyEvents
// ============================================================================

describe('detectVacancyEvents', () => {
  it('베이스라인 없으면 이벤트를 생성하지 않는다', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ remainingRooms: 3 })],
      hasBaseline: false,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 null → 현재 양수이면 vacancy 이벤트 생성', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: null })],
      currentOffers: [makeOffer({ remainingRooms: 2 })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('vacancy');
    expect(events[0].beforeRemainingRooms).toBeNull();
    expect(events[0].afterRemainingRooms).toBe(2);
  });

  it('이전 0 → 현재 양수이면 vacancy 이벤트 생성', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: 0 })],
      currentOffers: [makeOffer({ remainingRooms: 1 })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].beforeRemainingRooms).toBe(0);
    expect(events[0].afterRemainingRooms).toBe(1);
  });

  it('이전 양수 → 현재 양수이면 이벤트 없음 (이미 방이 있었음)', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: 2 })],
      currentOffers: [makeOffer({ remainingRooms: 3 })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('현재 null이면 vacancy 이벤트 없음', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: null })],
      currentOffers: [makeOffer({ remainingRooms: null })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('현재 0이면 vacancy 이벤트 없음', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: null })],
      currentOffers: [makeOffer({ remainingRooms: 0 })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷에 없는 새 오퍼도 hasBaseline=true면 vacancy 이벤트 생성 (before=null로 처리)', () => {
    // 이전에 없던 오퍼키 → previous undefined → beforeRemainingRooms=null → hasBaseline=true이면 vacancy 발생
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ remainingRooms: 5 })],
      hasBaseline: true,
    });
    // previousByKey에 없으면 before=null, hasBaseline=true, after=5 → vacancy 발생해야 함
    expect(events).toHaveLength(1);
    expect(events[0].beforeRemainingRooms).toBeNull();
    expect(events[0].afterRemainingRooms).toBe(5);
  });

  it('eventKey는 accommodationId + offerKey + payloadHash 포함', () => {
    const offer = makeOffer({ remainingRooms: 1, payloadHash: 'abc123' });
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ remainingRooms: 0 })],
      currentOffers: [offer],
      hasBaseline: true,
    });
    expect(events[0].eventKey).toContain(ACCOMMODATION_ID);
    expect(events[0].eventKey).toContain(offer.offerKey);
    expect(events[0].eventKey).toContain('abc123');
  });

  it('여러 오퍼 중 조건 맞는 것만 이벤트 생성', () => {
    const snapshots = [
      makeSnapshot({ offerKey: 'p:r1:rate1', remainingRooms: 0 }),
      makeSnapshot({ offerKey: 'p:r2:rate2', remainingRooms: 2 }), // 이미 방 있음
      makeSnapshot({ offerKey: 'p:r3:rate3', remainingRooms: null }),
    ];
    const offers = [
      makeOffer({ offerKey: 'p:r1:rate1', propertyId: 1n, roomId: 1n, ratePlanId: 1n, remainingRooms: 3 }),
      makeOffer({ offerKey: 'p:r2:rate2', propertyId: 1n, roomId: 2n, ratePlanId: 2n, remainingRooms: 2 }),
      makeOffer({ offerKey: 'p:r3:rate3', propertyId: 1n, roomId: 3n, ratePlanId: 3n, remainingRooms: 0 }),
    ];
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: snapshots,
      currentOffers: offers,
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].offerKey).toBe('p:r1:rate1');
  });
});

// ============================================================================
// detectPriceDropEvents
// ============================================================================

describe('detectPriceDropEvents', () => {
  it('이전/현재 가격 없으면 이벤트 없음', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: null })],
      currentOffers: [makeOffer({ totalInclusive: null })],
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(0);
  });

  it('10% 이상 가격 하락이면 이벤트 생성', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 100_000 })],
      currentOffers: [makeOffer({ totalInclusive: 89_000 })], // 11% 하락
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('price_drop');
    expect(events[0].beforePrice).toBe(100_000);
    expect(events[0].afterPrice).toBe(89_000);
    expect(events[0].dropRatio).toBeCloseTo(0.11, 2);
  });

  it('정확히 임계값이면 이벤트 생성', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 100_000 })],
      currentOffers: [makeOffer({ totalInclusive: 90_000 })], // 정확히 10%
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(1);
  });

  it('임계값 미만이면 이벤트 없음', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 100_000 })],
      currentOffers: [makeOffer({ totalInclusive: 95_000 })], // 5% 하락
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(0);
  });

  it('가격 상승이면 이벤트 없음', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 100_000 })],
      currentOffers: [makeOffer({ totalInclusive: 120_000 })],
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷이 없는 오퍼는 이벤트 없음', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ totalInclusive: 50_000 })],
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 가격 0이면 이벤트 없음 (division by zero 방지)', () => {
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 0 })],
      currentOffers: [makeOffer({ totalInclusive: 0 })],
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(0);
  });

  it('eventKey는 accommodationId + offerKey + payloadHash 포함', () => {
    const offer = makeOffer({ totalInclusive: 80_000, payloadHash: 'drop_hash' });
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ totalInclusive: 100_000 })],
      currentOffers: [offer],
      minDropRatio: 0.1,
    });
    expect(events[0].eventKey).toContain(ACCOMMODATION_ID);
    expect(events[0].eventKey).toContain(offer.offerKey);
    expect(events[0].eventKey).toContain('drop_hash');
  });

  it('여러 오퍼 혼합 — 하락 조건 맞는 것만 이벤트', () => {
    const snapshots = [
      makeSnapshot({ offerKey: 'p:r1:rate1', totalInclusive: 100_000 }),
      makeSnapshot({ offerKey: 'p:r2:rate2', totalInclusive: 100_000 }),
    ];
    const offers = [
      makeOffer({ offerKey: 'p:r1:rate1', propertyId: 1n, roomId: 1n, ratePlanId: 1n, totalInclusive: 88_000 }), // 12% 하락
      makeOffer({ offerKey: 'p:r2:rate2', propertyId: 1n, roomId: 2n, ratePlanId: 2n, totalInclusive: 97_000 }), // 3% 하락 (임계값 미만)
    ];
    const events = detectPriceDropEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: snapshots,
      currentOffers: offers,
      minDropRatio: 0.1,
    });
    expect(events).toHaveLength(1);
    expect(events[0].offerKey).toBe('p:r1:rate1');
  });
});

// ============================================================================
// detectOfferAppearanceEvents
// ============================================================================

describe('detectOfferAppearanceEvents', () => {
  it('베이스라인 없으면 이벤트 없음', () => {
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ remainingRooms: null })],
      hasBaseline: false,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷에 있는 오퍼는 이벤트 없음', () => {
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot({ offerKey: '1001:2001:3001' })],
      currentOffers: [makeOffer({ offerKey: '1001:2001:3001', remainingRooms: null })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('remainingRooms != null인 신규 오퍼는 vacancy가 처리하므로 이벤트 없음', () => {
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ remainingRooms: 3 })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('신규 오퍼이고 remainingRooms=null이면 vacancy_proxy 이벤트 생성', () => {
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ remainingRooms: null, payloadHash: 'new_hash' })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('vacancy_proxy');
    expect(events[0].beforeHash).toBeNull();
    expect(events[0].afterHash).toBe('new_hash');
  });

  it('eventKey는 vacancy_proxy 접두사 + accommodationId + offerKey + payloadHash 포함', () => {
    const offer = makeOffer({ offerKey: '1001:2001:3001', remainingRooms: null, payloadHash: 'proxy_hash' });
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [offer],
      hasBaseline: true,
    });
    expect(events[0].eventKey).toBe(`vacancy_proxy:${ACCOMMODATION_ID}:1001:2001:3001:proxy_hash`);
  });

  it('여러 오퍼 혼합 — 기존 오퍼 제외, remainingRooms=null 신규만 이벤트', () => {
    const snapshots = [makeSnapshot({ offerKey: 'p:r1:rate1' })];
    const offers = [
      makeOffer({ offerKey: 'p:r1:rate1', remainingRooms: null }), // 기존 오퍼 → 이벤트 없음
      makeOffer({ offerKey: 'p:r2:rate2', propertyId: 1n, roomId: 2n, ratePlanId: 2n, remainingRooms: 2 }), // 신규이지만 remainingRooms != null
      makeOffer({ offerKey: 'p:r3:rate3', propertyId: 1n, roomId: 3n, ratePlanId: 3n, remainingRooms: null }), // 신규 + null → vacancy_proxy
    ];
    const events = detectOfferAppearanceEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: snapshots,
      currentOffers: offers,
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].offerKey).toBe('p:r3:rate3');
  });
});
