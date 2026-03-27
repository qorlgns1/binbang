import { describe, expect, it } from 'vitest';

import { normalizeAgodaSearchResponse } from './normalize';

// ============================================================================
// Fixtures - Agoda API 응답 형태 모킹
// ============================================================================

function makeApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    results: [
      {
        propertyId: '1001',
        rooms: [
          {
            roomId: '2001',
            rates: [
              {
                ratePlanId: '3001',
                remainingRooms: 3,
                freeCancellation: true,
                freeCancellationDate: '2025-06-01T00:00:00Z',
                totalPayment: { inclusive: 150_000, currency: 'KRW' },
                ...overrides,
              },
            ],
          },
        ],
      },
    ],
  };
}

// ============================================================================
// normalizeAgodaSearchResponse
// ============================================================================

describe('normalizeAgodaSearchResponse', () => {
  it('빈 배열 → 오퍼 없음', () => {
    const result = normalizeAgodaSearchResponse([]);
    expect(result.offers).toHaveLength(0);
  });

  it('null → 오퍼 없음', () => {
    const result = normalizeAgodaSearchResponse(null);
    expect(result.offers).toHaveLength(0);
  });

  it('string → 오퍼 없음', () => {
    const result = normalizeAgodaSearchResponse('invalid');
    expect(result.offers).toHaveLength(0);
  });

  it('정상 응답에서 오퍼를 정규화한다', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse());
    expect(result.offers).toHaveLength(1);
    const [offer] = result.offers;
    expect(offer.propertyId).toBe(1001n);
    expect(offer.roomId).toBe(2001n);
    expect(offer.ratePlanId).toBe(3001n);
    expect(offer.remainingRooms).toBe(3);
    expect(offer.freeCancellation).toBe(true);
    expect(offer.totalInclusive).toBe(150_000);
    expect(offer.currency).toBe('KRW');
  });

  it('offerKey = propertyId:roomId:ratePlanId 형식', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse());
    expect(result.offers[0].offerKey).toBe('1001:2001:3001');
  });

  it('remainingRooms=0이면 0으로 정규화', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ remainingRooms: 0 }));
    expect(result.offers[0].remainingRooms).toBe(0);
  });

  it('remainingRooms 음수이면 0으로 정규화', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ remainingRooms: -1 }));
    expect(result.offers[0].remainingRooms).toBe(0);
  });

  it('remainingRooms 없으면 null', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ remainingRooms: undefined }));
    expect(result.offers[0].remainingRooms).toBeNull();
  });

  it('remainingRooms 문자열 숫자도 파싱', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ remainingRooms: '5' }));
    expect(result.offers[0].remainingRooms).toBe(5);
  });

  it('remaining_rooms 필드명 alias도 처리', () => {
    const result = normalizeAgodaSearchResponse({
      results: [
        {
          propertyId: '2000',
          rooms: [
            {
              roomId: '3000',
              rates: [
                { ratePlanId: '4000', remaining_rooms: 7, totalPayment: { inclusive: 100_000, currency: 'USD' } },
              ],
            },
          ],
        },
      ],
    });
    expect(result.offers[0].remainingRooms).toBe(7);
  });

  it('allotment 필드도 remainingRooms로 매핑', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ allotment: 4, remainingRooms: undefined }));
    expect(result.offers[0].remainingRooms).toBe(4);
  });

  it('payloadHash가 생성된다', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse());
    expect(typeof result.offers[0].payloadHash).toBe('string');
    expect(result.offers[0].payloadHash).toHaveLength(64); // sha256 hex
  });

  it('같은 데이터면 payloadHash 동일', () => {
    const r1 = normalizeAgodaSearchResponse(makeApiResponse());
    const r2 = normalizeAgodaSearchResponse(makeApiResponse());
    expect(r1.offers[0].payloadHash).toBe(r2.offers[0].payloadHash);
  });

  it('가격이 바뀌면 payloadHash도 달라진다', () => {
    const r1 = normalizeAgodaSearchResponse(makeApiResponse({ totalPayment: { inclusive: 100_000, currency: 'KRW' } }));
    const r2 = normalizeAgodaSearchResponse(makeApiResponse({ totalPayment: { inclusive: 90_000, currency: 'KRW' } }));
    expect(r1.offers[0].payloadHash).not.toBe(r2.offers[0].payloadHash);
  });

  it('중복 offerKey는 마지막 오퍼로 중복 제거', () => {
    const payload = {
      results: [
        {
          propertyId: '1001',
          rooms: [
            {
              roomId: '2001',
              rates: [
                { ratePlanId: '3001', remainingRooms: 1, totalPayment: { inclusive: 100_000, currency: 'KRW' } },
                { ratePlanId: '3001', remainingRooms: 2, totalPayment: { inclusive: 80_000, currency: 'KRW' } }, // 동일 키
              ],
            },
          ],
        },
      ],
    };
    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers).toHaveLength(1);
  });

  it('currency는 대문자로 정규화', () => {
    const result = normalizeAgodaSearchResponse(makeApiResponse({ totalPayment: { inclusive: 100, currency: 'krw' } }));
    expect(result.offers[0].currency).toBe('KRW');
  });

  it('hotelId 필드명도 propertyId로 처리', () => {
    const payload = {
      hotels: [
        {
          hotelId: '5000',
          rooms: [{ roomId: '6000', rates: [{ ratePlanId: '7000', remainingRooms: 2 }] }],
        },
      ],
    };
    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers[0].propertyId).toBe(5000n);
  });

  it('payload가 배열이면 각 엘리먼트를 hotel로 처리', () => {
    const payload = [
      {
        propertyId: '8001',
        rooms: [{ roomId: '9001', rates: [{ ratePlanId: '10001', remainingRooms: 1 }] }],
      },
    ];
    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers[0].propertyId).toBe(8001n);
  });

  it('metaSearch.landingUrl가 있으면 offer.landingUrl에 저장', () => {
    const payload = {
      results: [
        {
          propertyId: '1001',
          metaSearch: { landingUrl: 'https://www.agoda.com/ko-kr/test-hotel/hotel/seoul-kr.html' },
          rooms: [{ roomId: '2001', rates: [{ ratePlanId: '3001', remainingRooms: 1 }] }],
        },
      ],
    };

    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers[0].landingUrl).toBe('https://www.agoda.com/ko-kr/test-hotel/hotel/seoul-kr.html');
  });

  it('landingUrl는 rate > room > hotel 순으로 선택', () => {
    const payload = {
      results: [
        {
          propertyId: '1001',
          metaSearch: { landingUrl: 'https://www.agoda.com/hotel-level' },
          rooms: [
            {
              roomId: '2001',
              landingUrl: 'https://www.agoda.com/room-level',
              rates: [
                {
                  ratePlanId: '3001',
                  metaSearch: { deepLink: 'https://www.agoda.com/rate-level' },
                },
              ],
            },
          ],
        },
      ],
    };

    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers[0].landingUrl).toBe('https://www.agoda.com/rate-level');
  });

  it('flat results 응답도 오퍼 1개로 정규화한다', () => {
    const payload = {
      results: [
        {
          hotelId: 63565,
          hotelName: '시타딘 레 알 파리',
          roomtypeName: '스튜디오룸',
          currency: 'USD',
          dailyRate: 240.56,
          landingURL: 'https://www.agoda.com/ko-kr/test-flat',
        },
      ],
    };

    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].propertyId).toBe(63565n);
    expect(result.offers[0].totalInclusive).toBe(240.56);
    expect(result.offers[0].currency).toBe('USD');
    expect(result.offers[0].landingUrl).toBe('https://www.agoda.com/ko-kr/test-flat');
  });

  it('flat results의 landingURL 대문자 필드도 읽는다', () => {
    const payload = {
      results: [
        {
          hotelId: 63565,
          roomtypeName: '스튜디오룸',
          dailyRate: 240.56,
          currency: 'USD',
          landingURL: 'https://www.agoda.com/ko-kr/upper-case-url',
        },
      ],
    };

    const result = normalizeAgodaSearchResponse(payload);
    expect(result.offers[0].landingUrl).toBe('https://www.agoda.com/ko-kr/upper-case-url');
  });

  it('flat results의 가짜 roomId/ratePlanId는 가격이 바뀌어도 유지된다', () => {
    const payloadA = {
      results: [{ hotelId: 63565, roomtypeName: '스튜디오룸', dailyRate: 240.56, currency: 'USD' }],
    };
    const payloadB = {
      results: [{ hotelId: 63565, roomtypeName: '스튜디오룸', dailyRate: 250.12, currency: 'USD' }],
    };

    const offerA = normalizeAgodaSearchResponse(payloadA).offers[0];
    const offerB = normalizeAgodaSearchResponse(payloadB).offers[0];

    expect(offerA.roomId).toBe(offerB.roomId);
    expect(offerA.ratePlanId).toBe(offerB.ratePlanId);
    expect(offerA.offerKey).toBe(offerB.offerKey);
    expect(offerA.payloadHash).not.toBe(offerB.payloadHash);
  });
});
