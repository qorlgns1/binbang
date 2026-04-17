import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retryNotificationForCase } from './notifications.service';

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    queryBuilder: {
      execute: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
    caseNotificationRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    userRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
    mockFetch: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    queryBuilder: {
      execute: vi.fn(),
      set: vi.fn(),
    },
    caseNotificationRepo: {
      findOne: vi.fn(),
    },
    userRepo: {
      findOne: vi.fn(),
    },
    getDataSource: vi.fn(),
    mockFetch: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockQueryBuilder, createMockRepository } = await import(
    '../../../../test-utils/mock-db.ts'
  );

  const queryBuilder = createMockQueryBuilder();
  const caseNotificationRepo = createMockRepository();
  const userRepo = createMockRepository();
  const dataSource = createMockDataSource({
    queryBuilder,
    repositories: [
      [actual.CaseNotification, caseNotificationRepo],
      [actual.User, userRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  dbMock.queryBuilder = queryBuilder;
  dbMock.caseNotificationRepo = caseNotificationRepo;
  dbMock.userRepo = userRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

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
    global.fetch = dbMock.mockFetch as typeof fetch;
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.queryBuilder.execute.mockResolvedValue({ affected: 1 });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  it('retries a failed case notification and marks it SENT when Kakao send succeeds', async () => {
    dbMock.caseNotificationRepo.findOne.mockResolvedValue(makeNotification());
    dbMock.userRepo.findOne.mockResolvedValue({
      name: 'Tester',
      email: 'tester@example.com',
      kakaoAccessToken: 'token-123',
      kakaoRefreshToken: null,
      kakaoTokenExpiry: null,
    });
    dbMock.mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ result_code: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await retryNotificationForCase('notif-1', 'case-1', { requestId: 'case_retry_1' });

    expect(result).toEqual({ success: true });
    expect(dbMock.mockFetch).toHaveBeenCalledOnce();
    expect(dbMock.queryBuilder.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        status: 'PENDING',
        retryCount: expect.any(Function),
        failReason: expect.any(Function),
      }),
    );
    expect(dbMock.queryBuilder.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        status: 'SENT',
        sentAt: expect.any(Date),
      }),
    );
    expect(dbMock.queryBuilder.execute).toHaveBeenCalledTimes(2);
  });

  it('marks the notification FAILED when no valid Kakao token exists', async () => {
    dbMock.caseNotificationRepo.findOne.mockResolvedValue(makeNotification());
    dbMock.userRepo.findOne.mockResolvedValue({
      name: 'Tester',
      email: 'tester@example.com',
      kakaoAccessToken: null,
      kakaoRefreshToken: null,
      kakaoTokenExpiry: null,
    });

    const result = await retryNotificationForCase('notif-1', 'case-1', { requestId: 'case_retry_2' });

    expect(result).toEqual({ success: false, error: 'No valid Kakao token' });
    expect(dbMock.mockFetch).not.toHaveBeenCalled();
    expect(dbMock.queryBuilder.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        status: 'FAILED',
        failReason: '유효한 카카오 토큰 없음',
      }),
    );
    expect(dbMock.queryBuilder.execute).toHaveBeenCalledTimes(2);
  });
});
