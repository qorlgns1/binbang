import { describe, expect, it, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (must be defined before import)
// ---------------------------------------------------------------------------

const mockSendKakaoMessageHttp = vi.fn();
const mockSendEmailHttp = vi.fn();
const mockBuildNotificationEmailHtml = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@workspace/worker-shared/observability', () => ({
  sendKakaoMessageHttp: (...args: unknown[]) => mockSendKakaoMessageHttp(...args),
  sendEmailHttp: (...args: unknown[]) => mockSendEmailHttp(...args),
  buildNotificationEmailHtml: (...args: unknown[]) => mockBuildNotificationEmailHtml(...args),
}));

vi.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('./settings', () => ({
  getSettings: () => ({
    notification: { kakaoTokenRefreshMarginMs: 300000 },
  }),
}));

vi.mock('./settings/env', () => ({
  getEnv: (key: string) => `mock-${key}`,
}));

import { sendNotificationWithFallback, sendEmailNotification } from './notifications';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sendNotificationWithFallback', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('returns KAKAO channel when Kakao succeeds', async (): Promise<void> => {
    // Kakao: getValidAccessToken → findUnique returns token
    mockFindUnique.mockResolvedValue({
      kakaoAccessToken: 'token-123',
      kakaoRefreshToken: null,
      kakaoTokenExpiry: null,
    });
    mockSendKakaoMessageHttp.mockResolvedValue(true);

    const result = await sendNotificationWithFallback({
      userId: 'user-1',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toEqual({ sent: true, channel: 'KAKAO' });
    expect(mockSendEmailHttp).not.toHaveBeenCalled();
  });

  it('falls back to EMAIL when Kakao fails', async (): Promise<void> => {
    // Kakao fails: no access token
    mockFindUnique
      .mockResolvedValueOnce({ kakaoAccessToken: null, kakaoRefreshToken: null, kakaoTokenExpiry: null })
      // Email: user has email
      .mockResolvedValueOnce({ email: 'user@example.com' });

    mockBuildNotificationEmailHtml.mockReturnValue('<p>Email</p>');
    mockSendEmailHttp.mockResolvedValue('sent');

    const result = await sendNotificationWithFallback({
      userId: 'user-1',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toEqual({ sent: true, channel: 'EMAIL' });
    expect(mockSendEmailHttp).toHaveBeenCalled();
  });

  it('returns failure when both Kakao and Email fail', async (): Promise<void> => {
    // Kakao fails: no access token
    mockFindUnique
      .mockResolvedValueOnce({ kakaoAccessToken: null, kakaoRefreshToken: null, kakaoTokenExpiry: null })
      // Email: user has no email
      .mockResolvedValueOnce({ email: null });

    const result = await sendNotificationWithFallback({
      userId: 'user-1',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toEqual({
      sent: false,
      channel: 'EMAIL',
      failReason: '카카오 및 이메일 모두 전송 실패',
    });
  });
});

describe('sendEmailNotification', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  it('sends email when user has email address', async (): Promise<void> => {
    mockFindUnique.mockResolvedValue({ email: 'user@example.com' });
    mockBuildNotificationEmailHtml.mockReturnValue('<p>Notification</p>');
    mockSendEmailHttp.mockResolvedValue('sent');

    const result = await sendEmailNotification({
      userId: 'user-1',
      title: 'Test Title',
      description: 'Test Description',
      buttonText: 'Click',
      buttonUrl: 'https://example.com',
    });

    expect(result).toBe(true);
    expect(mockSendEmailHttp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test Title',
      }),
    );
  });

  it('returns false when user has no email', async (): Promise<void> => {
    mockFindUnique.mockResolvedValue({ email: null });

    const result = await sendEmailNotification({
      userId: 'user-1',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toBe(false);
    expect(mockSendEmailHttp).not.toHaveBeenCalled();
  });

  it('returns false when user not found', async (): Promise<void> => {
    mockFindUnique.mockResolvedValue(null);

    const result = await sendEmailNotification({
      userId: 'nonexistent',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toBe(false);
  });

  it('returns false when email sending fails', async (): Promise<void> => {
    mockFindUnique.mockResolvedValue({ email: 'user@example.com' });
    mockBuildNotificationEmailHtml.mockReturnValue('<p>Notification</p>');
    mockSendEmailHttp.mockResolvedValue('failed');

    const result = await sendEmailNotification({
      userId: 'user-1',
      title: 'Test',
      description: 'Desc',
    });

    expect(result).toBe(false);
  });
});
