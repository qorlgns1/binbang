import { describe, expect, it } from 'vitest';

import { detectPriceDropEvents, detectVacancyEvents } from '../agoda-detector.service';
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
//
// 새 감지 로직: Agoda lt_v1 API는 remainingRooms를 반환하지 않으므로
// "이전 poll에 결과 없음(sold out) → 현재 poll에 결과 있음" 으로 vacancy를 감지한다.
// ============================================================================

describe('detectVacancyEvents', () => {
  it('베이스라인 없으면 이벤트를 생성하지 않는다 (첫 폴링)', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer()],
      hasBaseline: false,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷 있고 현재도 있으면 이벤트 없음 (호텔이 계속 예약 가능)', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot()],
      currentOffers: [makeOffer()],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷 있고 현재 결과 없으면 이벤트 없음 (호텔 sold out, 알림 불필요)', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [makeSnapshot()],
      currentOffers: [],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷 없고 현재 결과 없으면 이벤트 없음 (계속 sold out)', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [],
      hasBaseline: true,
    });
    expect(events).toHaveLength(0);
  });

  it('이전 스냅샷 없고(sold out) 현재 결과 있으면 vacancy 이벤트 생성', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [makeOffer({ payloadHash: 'appeared_hash' })],
      hasBaseline: true,
    });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('vacancy');
    expect(events[0].beforeHash).toBeNull();
    expect(events[0].afterHash).toBe('appeared_hash');
  });

  it('현재 오퍼가 여러 개면 각각 vacancy 이벤트 생성', () => {
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [
        makeOffer({ offerKey: 'p:r1:rate1', propertyId: 1n, roomId: 1n, ratePlanId: 1n }),
        makeOffer({ offerKey: 'p:r2:rate2', propertyId: 1n, roomId: 2n, ratePlanId: 2n }),
      ],
      hasBaseline: true,
    });
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.offerKey)).toEqual(['p:r1:rate1', 'p:r2:rate2']);
  });

  it('eventKey는 vacancy 접두사 + accommodationId + offerKey + payloadHash 포함', () => {
    const offer = makeOffer({ offerKey: '1001:2001:3001', payloadHash: 'abc123' });
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [offer],
      hasBaseline: true,
    });
    expect(events[0].eventKey).toBe(`vacancy:${ACCOMMODATION_ID}:1001:2001:3001:abc123`);
  });

  it('meta에 propertyId, roomId, ratePlanId, currency, totalInclusive 포함', () => {
    const offer = makeOffer({
      propertyId: 1001n,
      roomId: 2001n,
      ratePlanId: 3001n,
      currency: 'KRW',
      totalInclusive: 150_000,
    });
    const events = detectVacancyEvents({
      accommodationId: ACCOMMODATION_ID,
      previousSnapshots: [],
      currentOffers: [offer],
      hasBaseline: true,
    });
    const { meta } = events[0];
    expect(meta.propertyId).toBe('1001');
    expect(meta.roomId).toBe('2001');
    expect(meta.ratePlanId).toBe('3001');
    expect(meta.currency).toBe('KRW');
    expect(meta.totalInclusive).toBe(150_000);
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
