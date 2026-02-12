import { beforeEach, describe, expect, it, vi } from 'vitest';

import { retryStaleCaseNotifications } from './caseNotifications';

const { mockFindMany, mockUpdateMany, mockUpdate, mockSendKakaoNotification } = vi.hoisted(
  (): {
    mockFindMany: ReturnType<typeof vi.fn>;
    mockUpdateMany: ReturnType<typeof vi.fn>;
    mockUpdate: ReturnType<typeof vi.fn>;
    mockSendKakaoNotification: ReturnType<typeof vi.fn>;
  } => ({
    mockFindMany: vi.fn(),
    mockUpdateMany: vi.fn(),
    mockUpdate: vi.fn(),
    mockSendKakaoNotification: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    caseNotification: {
      findMany: mockFindMany,
      updateMany: mockUpdateMany,
      update: mockUpdate,
    },
  },
}));

vi.mock('./notifications', () => ({
  sendKakaoNotification: mockSendKakaoNotification,
}));

describe('caseNotifications', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockUpdate.mockResolvedValue({ id: 'n-1' });
  });

  it('skips when maxRetries exceeded', async (): Promise<void> => {
    mockFindMany.mockResolvedValue([
      {
        id: 'n-1',
        status: 'FAILED',
        payload: { title: 't', description: 'd', buttonUrl: 'u', buttonText: 'b', userId: 'u-1' },
        retryCount: 3,
        maxRetries: 3,
        updatedAt: new Date('2026-02-12T00:00:00.000Z'),
        case: { accommodation: { userId: 'u-1' } },
      },
    ]);

    const result = await retryStaleCaseNotifications({ batchSize: 10, pendingStaleMs: 1 });

    expect(result.scanned).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.claimed).toBe(0);
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSendKakaoNotification).not.toHaveBeenCalled();
  });

  it('claims and sends notification successfully', async (): Promise<void> => {
    mockFindMany.mockResolvedValue([
      {
        id: 'n-1',
        status: 'FAILED',
        payload: {
          title: '숙소 예약 가능! 🎉',
          description: 'desc',
          buttonUrl: 'https://x',
          buttonText: '확인',
          userId: 'u-1',
        },
        retryCount: 0,
        maxRetries: 3,
        updatedAt: new Date('2026-02-12T00:00:00.000Z'),
        case: { accommodation: { userId: 'u-1' } },
      },
    ]);
    mockSendKakaoNotification.mockResolvedValue(true);

    const result = await retryStaleCaseNotifications({ batchSize: 10, pendingStaleMs: 1 });

    expect(result.scanned).toBe(1);
    expect(result.claimed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'n-1', status: 'FAILED', retryCount: { lt: 3 } },
      data: { status: 'PENDING', retryCount: { increment: 1 }, failReason: null },
    });
    expect(mockSendKakaoNotification).toHaveBeenCalledWith({
      userId: 'u-1',
      title: '숙소 예약 가능! 🎉',
      description: 'desc',
      buttonText: '확인',
      buttonUrl: 'https://x',
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { status: 'SENT', sentAt: expect.any(Date) },
      select: { id: true },
    });
  });

  it('marks as FAILED when payload missing required fields', async (): Promise<void> => {
    mockFindMany.mockResolvedValue([
      {
        id: 'n-1',
        status: 'FAILED',
        payload: { buttonUrl: 'https://x' },
        retryCount: 0,
        maxRetries: 3,
        updatedAt: new Date('2026-02-12T00:00:00.000Z'),
        case: { accommodation: { userId: 'u-1' } },
      },
    ]);

    const result = await retryStaleCaseNotifications({ batchSize: 10, pendingStaleMs: 1 });

    expect(result.scanned).toBe(1);
    expect(result.claimed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(mockSendKakaoNotification).not.toHaveBeenCalled();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { status: 'FAILED', failReason: 'payload(userId/title/description) 누락' },
      select: { id: true },
    });
  });

  it('skips if claim fails due to race', async (): Promise<void> => {
    mockFindMany.mockResolvedValue([
      {
        id: 'n-1',
        status: 'FAILED',
        payload: { title: 't', description: 'd', buttonUrl: 'https://x', buttonText: '확인', userId: 'u-1' },
        retryCount: 0,
        maxRetries: 3,
        updatedAt: new Date('2026-02-12T00:00:00.000Z'),
        case: { accommodation: { userId: 'u-1' } },
      },
    ]);
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const result = await retryStaleCaseNotifications({ batchSize: 10, pendingStaleMs: 1 });

    expect(result.scanned).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.claimed).toBe(0);
    expect(mockSendKakaoNotification).not.toHaveBeenCalled();
  });
});
