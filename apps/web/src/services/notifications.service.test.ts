import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retryNotificationForCase } from './notifications.service';

const {
  mockCaseNotificationFindUnique,
  mockCaseNotificationUpdateMany,
  mockUserFindUnique,
  mockUserUpdate,
  mockFetch,
} = vi.hoisted(() => ({
  mockCaseNotificationFindUnique: vi.fn(),
  mockCaseNotificationUpdateMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@workspace/db', () => ({
  prisma: {
    caseNotification: {
      findUnique: mockCaseNotificationFindUnique,
      updateMany: mockCaseNotificationUpdateMany,
    },
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

const ORIGINAL_FETCH = global.fetch;

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-1',
    caseId: 'case-1',
    status: 'FAILED',
    payload: {
      title: '예약 가능',
      description: '빈방이 열렸습니다',
      buttonUrl: 'https://example.com',
      buttonText: '확인',
    },
    retryCount: 0,
    maxRetries: 3,
    case: {
      accommodation: {
        userId: 'user-1',
      },
    },
    ...overrides,
  };
}

describe('notifications.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KAKAO_CLIENT_ID = 'kakao-client-id';
    process.env.KAKAO_CLIENT_SECRET = 'kakao-client-secret';
    global.fetch = mockFetch as typeof fetch;
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  it('retries a failed case notification and marks it SENT when Kakao send succeeds', async () => {
    mockCaseNotificationFindUnique.mockResolvedValue(makeNotification());
    mockCaseNotificationUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindUnique.mockResolvedValue({
      name: 'Tester',
      email: 'tester@example.com',
      kakaoAccessToken: 'token-123',
      kakaoRefreshToken: null,
      kakaoTokenExpiry: null,
    });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ result_code: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await retryNotificationForCase('notif-1', 'case-1', { requestId: 'case_retry_1' });

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockCaseNotificationUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ id: 'notif-1', status: 'FAILED' }),
        data: expect.objectContaining({
          status: 'PENDING',
          retryCount: { increment: 1 },
        }),
      }),
    );
    expect(mockCaseNotificationUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 'notif-1', status: 'PENDING' },
        data: expect.objectContaining({
          status: 'SENT',
          sentAt: expect.any(Date),
        }),
      }),
    );
  });

  it('marks the notification FAILED when no valid Kakao token exists', async () => {
    mockCaseNotificationFindUnique.mockResolvedValue(makeNotification());
    mockCaseNotificationUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindUnique.mockResolvedValue({
      name: 'Tester',
      email: 'tester@example.com',
      kakaoAccessToken: null,
      kakaoRefreshToken: null,
      kakaoTokenExpiry: null,
    });

    const result = await retryNotificationForCase('notif-1', 'case-1', { requestId: 'case_retry_2' });

    expect(result).toEqual({ success: false, error: 'No valid Kakao token' });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCaseNotificationUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 'notif-1', status: 'PENDING' },
        data: { status: 'FAILED', failReason: '유효한 카카오 토큰 없음' },
      }),
    );
  });
});
