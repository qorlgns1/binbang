import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAgodaLandingUrl } from '@/lib/agoda/buildAgodaUrl';

import { dispatchAgodaNotifications } from '../agoda-notification.service';

// ============================================================================
// Mocks
// ============================================================================

const {
  mockNotificationFindMany,
  mockNotificationUpdateMany,
  mockNotificationUpdate,
  mockConsentLogFindFirst,
  mockTransaction,
  mockSendAgodaAlertEmail,
  mockCreateAgodaUnsubscribeToken,
  mockBuildAgodaUnsubscribeUrl,
} = vi.hoisted(() => ({
  mockNotificationFindMany: vi.fn(),
  mockNotificationUpdateMany: vi.fn(),
  mockNotificationUpdate: vi.fn(),
  mockConsentLogFindFirst: vi.fn(),
  mockTransaction: vi.fn(),
  mockSendAgodaAlertEmail: vi.fn(),
  mockCreateAgodaUnsubscribeToken: vi.fn().mockReturnValue('test_token'),
  mockBuildAgodaUnsubscribeUrl: vi.fn().mockReturnValue('https://example.com/unsubscribe?token=test_token'),
}));

vi.mock('@workspace/db', () => ({
  prisma: {
    agodaNotification: {
      findMany: mockNotificationFindMany,
      updateMany: mockNotificationUpdateMany,
      update: mockNotificationUpdate,
    },
    agodaConsentLog: {
      findFirst: mockConsentLogFindFirst,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('../agoda-email.service', () => ({
  sendAgodaAlertEmail: mockSendAgodaAlertEmail,
}));

vi.mock('../agoda-unsubscribe.service', () => ({
  createAgodaUnsubscribeToken: mockCreateAgodaUnsubscribeToken,
  buildAgodaUnsubscribeUrl: mockBuildAgodaUnsubscribeUrl,
}));

// ============================================================================
// Fixtures
// ============================================================================

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
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
      id: 100n,
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

// ============================================================================
// Tests
// ============================================================================

describe('dispatchAgodaNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    // $transaction mock: 배열을 받아 빈 배열 반환
    mockTransaction.mockResolvedValue([]);
    mockNotificationUpdateMany.mockResolvedValue({ count: 1 });
    mockNotificationUpdate.mockResolvedValue({});
  });

  it('빈 큐이면 모두 0 반환', async () => {
    mockNotificationFindMany.mockResolvedValue([]);

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.suppressed).toBe(0);
  });

  it('동의(opt_in) 있는 사용자 → 이메일 전송 후 sent', async () => {
    mockNotificationFindMany.mockResolvedValue([makeNotification()]);
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
    mockNotificationFindMany.mockResolvedValue([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('동의 없는 사용자 → suppressed', async () => {
    mockNotificationFindMany.mockResolvedValue([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_out' });

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('동의 기록 자체 없으면 → suppressed', async () => {
    mockNotificationFindMany.mockResolvedValue([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue(null);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
  });

  it('비활성 숙소 → suppressed', async () => {
    const notification = makeNotification();
    notification.accommodation.isActive = false;
    mockNotificationFindMany.mockResolvedValue([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.suppressed).toBe(1);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('이메일 전송 실패 → failed 카운트 증가', async () => {
    mockNotificationFindMany.mockResolvedValue([makeNotification()]);
    mockConsentLogFindFirst.mockResolvedValue({ type: 'opt_in' });
    mockSendAgodaAlertEmail.mockRejectedValue(new Error('SMTP 오류'));

    const result = await dispatchAgodaNotifications();
    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('price_drop 타입 알림도 전송', async () => {
    const priceDropNotification = makeNotification({
      alertEvent: {
        id: 200n,
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
    mockNotificationFindMany.mockResolvedValue([priceDropNotification]);
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
        id: 201n,
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
    mockNotificationFindMany.mockResolvedValue([englishNotification]);
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

    mockNotificationFindMany.mockResolvedValue([notification]);
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
    mockNotificationFindMany.mockResolvedValue([notification]);
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
    mockNotificationFindMany.mockResolvedValue([notification]);

    const result = await dispatchAgodaNotifications();
    expect(result.skippedNotDue).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('여러 알림 혼합 처리', async () => {
    const notifications = [
      makeNotification({ id: 1n }),
      makeNotification({
        id: 2n,
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
        id: 3n,
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
    mockNotificationFindMany.mockResolvedValue(notifications);
    // 첫번째: opt_in, 세번째: opt_out
    mockConsentLogFindFirst.mockResolvedValueOnce({ type: 'opt_in' }).mockResolvedValueOnce({ type: 'opt_out' });
    mockSendAgodaAlertEmail.mockResolvedValue(undefined);

    const result = await dispatchAgodaNotifications();
    expect(result.picked).toBe(3);
    expect(result.sent).toBe(1); // acc_001: opt_in + active
    expect(result.suppressed).toBe(2); // acc_002: inactive, acc_003: opt_out
  });
});
