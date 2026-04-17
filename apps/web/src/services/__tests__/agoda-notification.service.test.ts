import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAgodaLandingUrl } from '@/lib/agoda/buildAgodaUrl';

import { dispatchAgodaNotifications } from '../agoda-notification.service';

// ============================================================================
// Mocks
// ============================================================================

const {
  mockNotificationFindMany,
  mockNotificationUpdate,
  mockConsentLogFindFirst,
  mockClaimSelect,
  mockClaimUpdate,
  mockExecuteRaw,
  mockSendAgodaAlertEmail,
  mockCreateAgodaUnsubscribeToken,
  mockBuildAgodaUnsubscribeUrl,
} = vi.hoisted(() => ({
  mockNotificationFindMany: vi.fn(),
  mockNotificationUpdate: vi.fn(),
  mockConsentLogFindFirst: vi.fn(),
  mockClaimSelect: vi.fn(),
  mockClaimUpdate: vi.fn(),
  mockExecuteRaw: vi.fn(),
  mockSendAgodaAlertEmail: vi.fn(),
  mockCreateAgodaUnsubscribeToken: vi.fn().mockReturnValue('test_token'),
  mockBuildAgodaUnsubscribeUrl: vi.fn().mockReturnValue('https://example.com/unsubscribe?token=test_token'),
}));

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    notificationRepo: {
      find: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    consentRepo: {
      queryBuilder: {
        getOne: ReturnType<typeof vi.fn>;
      };
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    notificationRepo: {
      find: vi.fn(),
      update: vi.fn(),
    },
    consentRepo: {
      queryBuilder: {
        getOne: vi.fn(),
      },
    },
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../../test-utils/mock-db.ts');

  const notificationRepo = createMockRepository();
  notificationRepo.find.mockImplementation((...args) => mockNotificationFindMany(...args));
  notificationRepo.update.mockImplementation((where, data) => mockNotificationUpdate({ where, data }));

  const consentRepo = createMockRepository();
  consentRepo.queryBuilder.getOne.mockImplementation((...args) => mockConsentLogFindFirst(...args));

  const dataSource = createMockDataSource({
    repositories: [
      [actual.AgodaNotification, notificationRepo],
      [actual.AgodaConsentLog, consentRepo],
    ],
    queryImplementation: async (sql: string, params?: unknown[]) => {
      if (sql.includes(`FOR UPDATE SKIP LOCKED`)) {
        return mockClaimSelect(sql, params);
      }

      if (sql.includes(`SET "status" = 'processing'`)) {
        return mockClaimUpdate(sql, params);
      }

      if (sql.includes(`SET "status" = 'failed'`) || sql.includes(`SET "status" = 'queued'`)) {
        return mockExecuteRaw(sql, params);
      }

      return mockExecuteRaw(sql, params);
    },
  });

  dbMock.dataSource = dataSource;
  dbMock.notificationRepo = notificationRepo;
  dbMock.consentRepo = consentRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

vi.mock('@/services/binbang-runtime-settings.service', () => ({
  getBinbangRuntimeSettings: vi.fn(async () => ({
    notificationDispatchLimit: 50,
    notificationMaxAttempts: 5,
  })),
}));

vi.mock('../agoda-email.service', () => ({
  sendAgodaAlertEmail: mockSendAgodaAlertEmail,
}));

vi.mock('../agoda-unsubscribe.service', () => ({
  createAgodaUnsubscribeToken: mockCreateAgodaUnsubscribeToken,
  buildAgodaUnsubscribeUrl: mockBuildAgodaUnsubscribeUrl,
}));

vi.mock('../agoda-kakao.service', () => ({
  sendBinbangKakaoNotification: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================================
// Fixtures
// ============================================================================

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: 'queued',
    attempt: 0,
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    accommodation: {
      id: 'acc_001',
      name: '테스트 호텔',
      platformId: '12345',
      isActive: true,
      url: null,
      userId: 'user_001',
      checkIn: new Date('2026-11-10T00:00:00Z'),
      checkOut: new Date('2026-11-14T00:00:00Z'),
      adults: 2,
      rooms: 1,
      children: 0,
      locale: 'ko',
      platformMetadata: null,
      user: { email: 'user@example.com' },
    },
    alertEvent: {
      id: 100,
      type: 'vacancy',
      status: 'detected',
      meta: {
        propertyId: '12345',
        roomId: '67890',
        ratePlanId: '11111',
        currency: 'KRW',
        totalInclusive: 150_000,
        afterRemainingRooms: 2,
      },
    },
    ...overrides,
  };
}

function extractClickoutUrlFromEmail(text: string): URL {
  const line = text
    .split('\n')
    .find((item) => item.includes('예약 페이지 이동:') || item.includes('Go to booking page:'));
  expect(line).toBeDefined();

  const rawUrl = line?.split(':').slice(1).join(':').trim();
  expect(rawUrl).toBeTruthy();
  return new URL(rawUrl as string);
}

function extractSqlTemplate(callArg: unknown): string {
  if (Array.isArray(callArg)) {
    return callArg.map((part) => String(part)).join('?');
  }
  return String(callArg);
}

// ============================================================================
// Mock helpers
//
// 새 dispatch 흐름:
//   1. updateMany  (stale 'processing' 복구)
//   2. findMany    → queued ID 목록 { id }[]
//   3. findMany    → failed ID 목록 { id, updatedAt, attempt }[]
//   4. SELECT ... FOR UPDATE SKIP LOCKED → queued 클레임 후보 잠금
//   5. UPDATE ... SET status='processing' → queued 실제 클레임
//   6. SELECT ... FOR UPDATE SKIP LOCKED → failed 클레임 후보 잠금
//   7. UPDATE ... SET status='processing' → failed 실제 클레임
//   8. findMany    → 클레임된 알림 전체 데이터 (claimedIds.length > 0 일 때만)
//
// claimNotifications(ids, ...) 은 ids.length === 0 이면 즉시 [] 반환 (no claim query call).
// ============================================================================

/** queued 알림만 있고 모두 이 워커가 클레임한 경우 */
function mockQueued(rows: ReturnType<typeof makeNotification>[]) {
  mockNotificationFindMany
    .mockResolvedValueOnce(rows.map((r) => ({ id: r.id }))) // queued IDs
    .mockResolvedValueOnce([]) // failed IDs
    .mockResolvedValueOnce(rows); // full data for claimed

  // failedDueIds = [] 이므로 claimNotifications(failedDueIds, ...) 은 즉시 반환.
  mockClaimSelect.mockResolvedValueOnce(rows.map((r) => ({ id: r.id.toString() }))); // lock queued
  mockClaimUpdate.mockResolvedValueOnce(rows.length); // mark queued as processing
}

/** failed 알림만 있고 아직 재시도 대기 중 (not due) — 클레임 없음 */
function mockFailed(rows: ReturnType<typeof makeNotification>[]) {
  // pre-filter 에서 모두 제외되므로 $queryRawUnsafe 호출 없음
  mockNotificationFindMany
    .mockResolvedValueOnce([]) // queued IDs
    .mockResolvedValueOnce(rows.map((r) => ({ id: r.id, updatedAt: r.updatedAt, attempt: r.attempt }))); // failed IDs
}

/** failed 알림만 있고 재시도 기간 경과 (due) — 클레임 있음 */
function mockFailedDue(rows: ReturnType<typeof makeNotification>[]) {
  mockNotificationFindMany
    .mockResolvedValueOnce([]) // queued IDs
    .mockResolvedValueOnce(rows.map((r) => ({ id: r.id, updatedAt: r.updatedAt, attempt: r.attempt }))) // failed IDs
    .mockResolvedValueOnce(rows); // full data for claimed

  // queuedIds = [] 이므로 claimNotifications(queuedIds, ...) 는 즉시 반환.
  mockClaimSelect.mockResolvedValueOnce(rows.map((r) => ({ id: r.id.toString() }))); // lock failed
  mockClaimUpdate.mockResolvedValueOnce(rows.length); // mark failed as processing
}

// ============================================================================
// Tests
// ============================================================================

describe('dispatchAgodaNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotificationFindMany.mockReset();
    mockNotificationUpdate.mockReset();
    mockConsentLogFindFirst.mockReset();
    mockClaimSelect.mockReset();
    mockClaimUpdate.mockReset();
    mockExecuteRaw.mockReset();
    mockSendAgodaAlertEmail.mockReset();
    mockCreateAgodaUnsubscribeToken.mockReset();
    mockBuildAgodaUnsubscribeUrl.mockReset();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    mockNotificationFindMany.mockResolvedValue([]);
    mockNotificationUpdate.mockResolvedValue({});
    mockClaimSelect.mockResolvedValue([]); // 기본값: 클레임 없음
    mockClaimUpdate.mockResolvedValue(0);
    mockExecuteRaw.mockResolvedValue(0); // stale processing 복구: 기본 0건
    mockCreateAgodaUnsubscribeToken.mockReturnValue('test_token');
    mockBuildAgodaUnsubscribeUrl.mockReturnValue('https://example.com/unsubscribe?token=test_token');
  });

  it('빈 큐이면 모두 0 반환', async () => {
    mockNotificationFindMany.mockResolvedValue([]);

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.suppressed).toBe(0);
  });

  it('stale processing 복구 시 maxAttempts 도달 항목은 failed로 종료 처리한다', async () => {
    mockNotificationFindMany.mockResolvedValue([]);

    await dispatchAgodaNotifications();

    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
    const sqlTexts = mockExecuteRaw.mock.calls.map((call) => extractSqlTemplate(call[0]));
    expect(sqlTexts.some((sql) => sql.includes(`SET "status" = 'failed'`))).toBe(true);
    expect(sqlTexts.some((sql) => sql.includes(`SET "status" = 'queued'`))).toBe(true);
  });

  it('동의(opt_in) 있는 사용자 → 이메일 전송 후 sent', async () => {
    mockQueued([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.sent).toBe(1);
    expect(result.suppressed).toBe(0);
    expect(mockSendAgodaAlertEmail).toHaveBeenCalledOnce();
    const args = mockSendAgodaAlertEmail.mock.calls[0][0] as { html: string; text: string };
    expect(args.text).toContain('가용성 감지 알림');
    expect(args.html).toContain('예약 페이지 이동');
    expect(args.html).toContain('알림 수신거부');
  });

  it('이메일 없는 사용자 → suppressed', async () => {
    const notification = makeNotification();
    (notification.accommodation.user as { email: string | null }).email = null;
    mockQueued([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(result.suppressedReasonCounts.SUPPRESSED_MISSING_RECIPIENT_EMAIL).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
    expect(mockNotificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: 'SUPPRESSED_MISSING_RECIPIENT_EMAIL::user email is missing',
        }),
      }),
    );
  });

  it('동의 없는 사용자 → suppressed', async () => {
    mockQueued([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_out' });

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('동의 기록 자체 없으면 → suppressed', async () => {
    mockQueued([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue(null);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
  });

  it('비활성 숙소 → suppressed', async () => {
    const notification = makeNotification();
    notification.accommodation.isActive = false;
    mockQueued([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('이메일 전송 실패 → failed 카운트 증가', async () => {
    mockQueued([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockRejectedValue(new Error('SMTP 오류'));

    const result = await dispatchAgodaNotifications();
    expect(result.failed).toBe(1);
    expect(result.failedReasonCounts.FAILED_EMAIL_SEND).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockNotificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: 'FAILED_EMAIL_SEND::SMTP 오류',
        }),
      }),
    );
  });

  it('price_drop 타입 알림도 전송', async () => {
    const priceDropNotification = makeNotification({
      alertEvent: {
        id: 200,
        type: 'price_drop',
        status: 'detected',
        meta: {
          propertyId: '12345',
          roomId: '67890',
          ratePlanId: '11111',
          currency: 'KRW',
          afterPrice: 120_000,
          dropRatio: 0.2,
        },
      },
    });
    mockQueued([priceDropNotification]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.sent).toBe(1);
    // 가격 하락 이메일은 subject에 '가격' 포함
    const callArgs = mockSendAgodaAlertEmail.mock.calls[0][0] as { subject: string };
    expect(callArgs.subject).toContain('가격');
  });

  it('locale=en이면 영문 템플릿으로 발송', async () => {
    const englishNotification = makeNotification({
      accommodation: {
        id: 'acc_en',
        name: 'Test Hotel',
        platformId: '12345',
        isActive: true,
        url: null,
        userId: 'user_en',
        checkIn: new Date('2026-11-10T00:00:00Z'),
        checkOut: new Date('2026-11-14T00:00:00Z'),
        adults: 2,
        rooms: 1,
        children: 0,
        locale: 'en',
        platformMetadata: null,
        user: { email: 'english@example.com' },
      },
      alertEvent: {
        id: 201,
        type: 'price_drop',
        status: 'detected',
        meta: {
          propertyId: '12345',
          roomId: '67890',
          ratePlanId: '11111',
          currency: 'USD',
          afterPrice: 99.5,
          dropRatio: 0.12,
        },
      },
    });
    mockQueued([englishNotification]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.sent).toBe(1);
    const args = mockSendAgodaAlertEmail.mock.calls[0][0] as { subject: string; text: string; html: string };
    expect(args.subject).toContain('Price dropped');
    expect(args.text).toContain('Availability Alert');
    expect(args.text).toContain('Go to booking page:');
    expect(args.html).toContain('Go to Booking Page');
  });

  it('platformMetadata.landingUrl가 있으면 해당 URL을 우선 사용한다', async () => {
    const storedLandingUrl = 'https://www.agoda.com/ko-kr/hotel-a/hotel/seoul-kr.html?cid=123';
    const notification = makeNotification({
      accommodation: {
        id: 'acc_001',
        name: '테스트 호텔',
        platformId: '12345',
        isActive: true,
        url: null,
        userId: 'user_001',
        checkIn: new Date('2026-11-10T00:00:00Z'),
        checkOut: new Date('2026-11-14T00:00:00Z'),
        adults: 2,
        rooms: 1,
        children: 0,
        locale: 'ko',
        platformMetadata: { landingUrl: storedLandingUrl },
        user: { email: 'user@example.com' },
      },
    });

    mockQueued([notification]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    await dispatchAgodaNotifications();

    const args = mockSendAgodaAlertEmail.mock.calls[0][0] as { text: string };
    const clickoutUrl = extractClickoutUrlFromEmail(args.text);
    expect(clickoutUrl.pathname).toBe('/api/go');
    expect(clickoutUrl.searchParams.get('accommodationId')).toBe('acc_001');
    expect(clickoutUrl.searchParams.get('url')).toBe(storedLandingUrl);
  });

  it('landingUrl가 없으면 platformId 기반 fallback URL을 사용한다', async () => {
    const notification = makeNotification();
    mockQueued([notification]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    await dispatchAgodaNotifications();

    const expectedFallback = buildAgodaLandingUrl({
      platformId: '12345',
      checkIn: '2026-11-10',
      checkOut: '2026-11-14',
      adults: 2,
      rooms: 1,
      children: 0,
    });
    const args = mockSendAgodaAlertEmail.mock.calls[0][0] as { text: string };
    const clickoutUrl = extractClickoutUrlFromEmail(args.text);
    expect(clickoutUrl.searchParams.get('url')).toBe(expectedFallback);
  });

  it('실패 상태지만 재시도 대기 중이면 skippedNotDue', async () => {
    // attempt=0, updatedAt=방금 → 아직 1분 대기 중
    const notification = makeNotification({
      status: 'failed',
      attempt: 0,
      updatedAt: new Date(), // 방금 실패
    });
    mockFailed([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.skippedNotDue).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('재시도 기간 경과한 failed 알림 → 클레임 후 전송', async () => {
    const notification = makeNotification({
      status: 'failed',
      attempt: 0,
      updatedAt: new Date('2025-01-01T00:00:00Z'), // 오래전 실패 → due
    });
    mockFailedDue([notification]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.skippedNotDue).toBe(0);
  });

  it('queued/failed 조회 모두 maxAttempts 미만만 대상으로 삼는다', async () => {
    mockNotificationFindMany.mockResolvedValue([]);

    await dispatchAgodaNotifications();

    const queuedQuery = mockNotificationFindMany.mock.calls[0]?.[0] as { where?: Record<string, unknown> };
    const failedQuery = mockNotificationFindMany.mock.calls[1]?.[0] as { where?: Record<string, unknown> };

    expect(queuedQuery.where).toHaveProperty('attempt');
    expect(failedQuery.where).toHaveProperty('attempt');
  });

  it('동시 실행 시 다른 워커가 먼저 클레임하면 picked=0', async () => {
    // 두 개의 queued ID가 선택됐지만 lock 대상이 0건이면 다른 워커가 먼저 클레임한 것이다.
    mockNotificationFindMany
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // queued IDs
      .mockResolvedValueOnce([]); // failed IDs
    mockClaimSelect.mockResolvedValueOnce([]); // lock queued → 0개 클레임

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(0);
    expect(result.sent).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('여러 알림 혼합 처리', async () => {
    const notifications = [
      makeNotification({ id: 1 }),
      makeNotification({
        id: 2,
        accommodation: {
          id: 'acc_002',
          name: '호텔2',
          platformId: '99999',
          isActive: false, // 비활성
          url: null,
          userId: 'user_002',
          checkIn: new Date('2026-11-10T00:00:00Z'),
          checkOut: new Date('2026-11-14T00:00:00Z'),
          adults: 2,
          rooms: 1,
          children: 0,
          locale: 'ko',
          platformMetadata: null,
          user: { email: 'user2@example.com' },
        },
      }),
      makeNotification({
        id: 3,
        accommodation: {
          id: 'acc_003',
          name: '호텔3',
          platformId: '77777',
          isActive: true,
          url: null,
          userId: 'user_003',
          checkIn: new Date('2026-11-10T00:00:00Z'),
          checkOut: new Date('2026-11-14T00:00:00Z'),
          adults: 2,
          rooms: 1,
          children: 0,
          locale: 'ko',
          platformMetadata: null,
          user: { email: 'user3@example.com' },
        },
      }),
    ];
    mockQueued(notifications);
    // 첫번째: opt_in, 세번째: opt_out
    mockConsentLogFindFirst.mockResolvedValueOnce({ type: 'opt_in' }).mockResolvedValueOnce({ type: 'opt_out' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(3);
    expect(result.sent).toBe(1); // acc_001: opt_in + active
    expect(result.suppressed).toBe(2); // acc_002: inactive, acc_003: opt_out
  });
});
