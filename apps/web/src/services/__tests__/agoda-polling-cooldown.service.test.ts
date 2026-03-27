import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const {
  mockAccommodationFindUnique,
  mockAccommodationUpdate,
  mockPollRunCreate,
  mockPollRunFindFirst,
  mockPollRunUpdate,
  mockSnapshotFindMany,
  mockSnapshotCreateMany,
  mockAlertEventFindFirst,
  mockAlertEventCreate,
  mockNotificationCreateMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockAccommodationFindUnique: vi.fn(),
  mockAccommodationUpdate: vi.fn(),
  mockPollRunCreate: vi.fn(),
  mockPollRunFindFirst: vi.fn(),
  mockPollRunUpdate: vi.fn(),
  mockSnapshotFindMany: vi.fn(),
  mockSnapshotCreateMany: vi.fn(),
  mockAlertEventFindFirst: vi.fn(),
  mockAlertEventCreate: vi.fn(),
  mockNotificationCreateMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@workspace/db', () => ({
  prisma: {
    accommodation: {
      findUnique: mockAccommodationFindUnique,
      update: mockAccommodationUpdate,
    },
    agodaPollRun: {
      create: mockPollRunCreate,
      findFirst: mockPollRunFindFirst,
      update: mockPollRunUpdate,
    },
    agodaRoomSnapshot: {
      findMany: mockSnapshotFindMany,
      createMany: mockSnapshotCreateMany,
    },
    agodaAlertEvent: {
      findFirst: mockAlertEventFindFirst,
      create: mockAlertEventCreate,
    },
    agodaNotification: {
      createMany: mockNotificationCreateMany,
    },
    $transaction: mockTransaction,
  },
}));

const { mockSearchAgodaAvailability } = vi.hoisted(() => ({
  mockSearchAgodaAvailability: vi.fn(),
}));

vi.mock('@/lib/agoda/searchClient', () => ({
  searchAgodaAvailability: mockSearchAgodaAvailability,
}));

const { mockNormalizeAgodaSearchResponse } = vi.hoisted(() => ({
  mockNormalizeAgodaSearchResponse: vi.fn(),
}));

vi.mock('@/lib/agoda/normalize', () => ({
  normalizeAgodaSearchResponse: mockNormalizeAgodaSearchResponse,
}));

// ============================================================================
// Helpers
// ============================================================================

function makeAgodaOffer(
  overrides: Partial<{
    offerKey: string;
    propertyId: bigint;
    roomId: bigint;
    ratePlanId: bigint;
    remainingRooms: number | null;
    totalInclusive: number | null;
    currency: string;
    payloadHash: string;
    landingUrl: string | null;
    freeCancellation: boolean | null;
    freeCancellationDate: Date | null;
    raw: unknown;
  }> = {},
) {
  return {
    offerKey: '1001:2001:3001',
    propertyId: 1001n,
    roomId: 2001n,
    ratePlanId: 3001n,
    remainingRooms: null,
    totalInclusive: 100_000,
    currency: 'KRW',
    payloadHash: 'hash_current',
    landingUrl: null,
    freeCancellation: null,
    freeCancellationDate: null,
    raw: {},
    ...overrides,
  };
}

function setupBaseAccommodation() {
  mockAccommodationFindUnique.mockResolvedValue({
    id: 'acc_001',
    isActive: true,
    platform: 'AGODA',
    platformId: '1001',
    checkIn: new Date('2026-11-10'),
    checkOut: new Date('2026-11-14'),
    rooms: 1,
    adults: 2,
    children: 0,
    currency: 'KRW',
    locale: 'ko',
  });

  mockPollRunCreate.mockResolvedValue({ id: 1n, polledAt: new Date() });
  mockSnapshotCreateMany.mockResolvedValue({ count: 1 });
  mockTransaction.mockResolvedValue([{}, {}]);
  mockNotificationCreateMany.mockResolvedValue({ count: 1 });
}

// ============================================================================
// Tests
//
// vacancy 감지 로직: 이전 poll에 결과 없음(sold out) → 현재 poll에 결과 있음
// ============================================================================

import { pollAccommodationOnce } from '../agoda-polling.service';

describe('agoda-polling: cooldown 쿨다운', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('vacancy 이벤트: 쿨다운 활성 시 알림 큐잉 건너뜀', async () => {
    setupBaseAccommodation();

    // 이전 poll run 존재(hasBaseline=true), 스냅샷 없음(호텔 sold out)
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    mockSnapshotFindMany.mockResolvedValue([]);

    // 현재 poll: 호텔 등장 → vacancy 후보
    const currentOffer = makeAgodaOffer();
    const apiPayload = { properties: [] };
    mockSearchAgodaAvailability.mockResolvedValue({ payload: apiPayload, httpStatus: 200 });
    // main poll + verify 모두 호텔 등장 → confirmed
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    // 쿨다운: findFirst가 기존 이벤트 반환 → 쿨다운 활성
    mockAlertEventFindFirst.mockResolvedValue({ id: 99n });

    const result = await pollAccommodationOnce('acc_001');

    // 쿨다운으로 인해 이벤트 생성 스킵
    expect(result.vacancyEventsSkippedByCooldown).toBe(1);
    expect(result.vacancyEventsInserted).toBe(0);
    expect(result.notificationsQueued).toBe(0);
    expect(mockAlertEventCreate).not.toHaveBeenCalled();
  });

  it('vacancy 이벤트: 쿨다운 비활성 시 이벤트 생성 및 알림 큐잉', async () => {
    setupBaseAccommodation();

    // 이전 poll run 존재(hasBaseline=true), 스냅샷 없음(호텔 sold out)
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    mockSnapshotFindMany.mockResolvedValue([]);

    const currentOffer = makeAgodaOffer();
    const apiPayload = { properties: [] };
    // main poll + verify 모두 호텔 등장 → confirmed
    mockSearchAgodaAvailability.mockResolvedValue({ payload: apiPayload, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    // 쿨다운: findFirst가 null 반환 → 쿨다운 비활성
    mockAlertEventFindFirst.mockResolvedValue(null);
    mockAlertEventCreate.mockResolvedValue({ id: 100n });

    const result = await pollAccommodationOnce('acc_001');

    expect(result.vacancyEventsSkippedByCooldown).toBe(0);
    expect(result.vacancyEventsInserted).toBe(1);
    expect(result.notificationsQueued).toBe(1);
    expect(mockAlertEventCreate).toHaveBeenCalledOnce();
  });

  it('price_drop 이벤트: 쿨다운 활성 시 건너뜀', async () => {
    setupBaseAccommodation();

    // 이전 스냅샷 있음(호텔 계속 예약 가능 상태, vacancy 없음)
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    const previousSnapshot = {
      propertyId: '1001',
      roomId: '2001',
      ratePlanId: '3001',
      remainingRooms: null,
      totalInclusive: 200_000, // 이전 가격
      payloadHash: 'hash_before',
    };
    mockSnapshotFindMany.mockResolvedValue([previousSnapshot]);

    const currentOffer = makeAgodaOffer({
      totalInclusive: 160_000, // 20% 하락 → price_drop 후보
    });
    const apiPayload = { properties: [] };
    mockSearchAgodaAvailability.mockResolvedValue({ payload: apiPayload, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    // price_drop 쿨다운 활성
    mockAlertEventFindFirst.mockResolvedValue({ id: 99n });

    const result = await pollAccommodationOnce('acc_001');

    expect(result.priceDropEventsSkippedByCooldown).toBe(1);
    expect(result.priceDropEventsInserted).toBe(0);
    expect(result.notificationsQueued).toBe(0);
  });

  it('vacancy verify API 실패 시 poll run을 partial로 마킹하고 vacancyVerifySkipped=true 반환', async () => {
    setupBaseAccommodation();

    // 이전 poll run 존재(hasBaseline=true), 스냅샷 없음(호텔 sold out)
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    mockSnapshotFindMany.mockResolvedValue([]);

    const currentOffer = makeAgodaOffer();
    // 첫 번째 호출(main poll): 정상 응답
    // 두 번째 호출(verify): 에러
    mockSearchAgodaAvailability
      .mockResolvedValueOnce({ payload: { properties: [] }, httpStatus: 200 })
      .mockRejectedValueOnce(new Error('Agoda API timeout'));
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    const result = await pollAccommodationOnce('acc_001');

    // verify 실패 → vacancy 이벤트 미생성, verify skipped 플래그 true
    expect(result.vacancyEventsDetected).toBe(1);
    expect(result.vacancyEventsInserted).toBe(0);
    expect(result.vacancyVerifySkipped).toBe(true);
    expect(result.notificationsQueued).toBe(0);

    // poll run이 'partial' 상태로 업데이트되었는지 확인
    expect(mockPollRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1n },
        data: expect.objectContaining({
          status: 'partial',
          error: 'vacancy verify API failed, will retry next cycle',
        }),
      }),
    );
  });

  it('vacancy verify API 실패지만 vacancy 후보가 없으면 success로 마킹', async () => {
    setupBaseAccommodation();

    // 이전 스냅샷 있음 → vacancy 후보 없음
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    mockSnapshotFindMany.mockResolvedValue([
      {
        propertyId: '1001',
        roomId: '2001',
        ratePlanId: '3001',
        remainingRooms: null,
        totalInclusive: 100_000,
        payloadHash: 'hash_before',
      },
    ]);

    const currentOffer = makeAgodaOffer();
    mockSearchAgodaAvailability.mockResolvedValue({ payload: { properties: [] }, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    const result = await pollAccommodationOnce('acc_001');

    // vacancy 후보 없음 → vacancyVerifySkipped=false
    expect(result.vacancyEventsDetected).toBe(0);
    expect(result.vacancyVerifySkipped).toBe(false);
  });

  it('오퍼가 있으면 snapshot을 저장하고 AVAILABLE 상태로 업데이트', async () => {
    setupBaseAccommodation();

    mockPollRunFindFirst.mockResolvedValue(null);
    mockSnapshotFindMany.mockResolvedValue([]);

    const currentOffer = makeAgodaOffer({
      landingUrl: 'https://www.agoda.com/ko-kr/test-flat',
    });
    mockSearchAgodaAvailability.mockResolvedValue({ payload: { results: [{ hotelId: 1001 }] }, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    const result = await pollAccommodationOnce('acc_001');

    expect(result.snapshotsInserted).toBe(1);
    expect(mockSnapshotCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            accommodationId: 'acc_001',
            propertyId: '1001',
            roomId: '2001',
            ratePlanId: '3001',
          }),
        ],
      }),
    );
    expect(mockAccommodationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc_001' },
        data: expect.objectContaining({ lastStatus: 'AVAILABLE' }),
      }),
    );
  });

  it('오퍼가 없으면 snapshot을 저장하지 않고 UNAVAILABLE 상태로 업데이트', async () => {
    setupBaseAccommodation();

    mockPollRunFindFirst.mockResolvedValue(null);
    mockSnapshotFindMany.mockResolvedValue([]);

    mockSearchAgodaAvailability.mockResolvedValue({ payload: { results: [] }, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [] });

    const result = await pollAccommodationOnce('acc_001');

    expect(result.snapshotsInserted).toBe(0);
    expect(mockSnapshotCreateMany).not.toHaveBeenCalled();
    expect(mockAccommodationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc_001' },
        data: expect.objectContaining({ lastStatus: 'UNAVAILABLE' }),
      }),
    );
  });

  it('isInCooldown 쿼리는 accommodationId + type + offerKey + status=detected 조건으로 조회', async () => {
    setupBaseAccommodation();

    // 이전 poll run 존재(hasBaseline=true), 스냅샷 없음(호텔 sold out)
    mockPollRunFindFirst.mockResolvedValue({ id: 0n });
    mockSnapshotFindMany.mockResolvedValue([]);

    const currentOffer = makeAgodaOffer();
    const apiPayload = { properties: [] };
    mockSearchAgodaAvailability.mockResolvedValue({ payload: apiPayload, httpStatus: 200 });
    mockNormalizeAgodaSearchResponse.mockReturnValue({ offers: [currentOffer] });

    mockAlertEventFindFirst.mockResolvedValue(null);
    mockAlertEventCreate.mockResolvedValue({ id: 100n });

    await pollAccommodationOnce('acc_001');

    // isInCooldown 쿼리 확인 (vacancy 쿨다운 체크)
    const callArgs = mockAlertEventFindFirst.mock.calls[0][0];
    expect(callArgs.where.accommodationId).toBe('acc_001');
    expect(callArgs.where.type).toBe('vacancy');
    expect(callArgs.where.offerKey).toBe('1001:2001:3001');
    expect(callArgs.where.status).toBe('detected');
    expect(callArgs.where.detectedAt.gte).toBeInstanceOf(Date);
  });
});
