import { prisma } from '@workspace/db';

import { getEnv } from '@/lib/env';

// ============================================================================
// Types
// ============================================================================

export interface RetryNotificationResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Service
// ============================================================================

export async function retryNotification(notificationId: string): Promise<RetryNotificationResult> {
  return retryNotificationForCase(notificationId, null);
}

export async function retryNotificationForCase(
  notificationId: string,
  caseId: string | null,
): Promise<RetryNotificationResult> {
  const notification = await prisma.caseNotification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      caseId: true,
      status: true,
      payload: true,
      retryCount: true,
      maxRetries: true,
      case: {
        select: {
          accommodation: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  if (caseId && notification.caseId !== caseId) {
    return { success: false, error: 'Notification does not belong to this case' };
  }

  if (notification.status !== 'FAILED') {
    return { success: false, error: 'Only FAILED notifications can be retried' };
  }

  if (notification.retryCount >= notification.maxRetries) {
    return { success: false, error: 'Max retries exceeded' };
  }

  // 원자적 claim(중복 발송 방지): 읽은 retryCount와 동일할 때만 FAILED→PENDING 전이
  const claimed = await prisma.caseNotification.updateMany({
    where: {
      id: notificationId,
      status: 'FAILED',
      retryCount: notification.retryCount,
    },
    data: {
      status: 'PENDING',
      retryCount: { increment: 1 },
      failReason: null,
    },
  });

  if (claimed.count !== 1) {
    return { success: false, error: 'Notification is already being retried' };
  }

  const userId = notification.case?.accommodation?.userId;
  if (!userId) {
    await prisma.caseNotification.update({
      where: { id: notificationId },
      data: { status: 'FAILED', failReason: 'No user linked to case accommodation' },
      select: { id: true },
    });
    return { success: false, error: 'No user linked to case accommodation' };
  }

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    await prisma.caseNotification.update({
      where: { id: notificationId },
      data: { status: 'FAILED', failReason: '유효한 카카오 토큰 없음' },
      select: { id: true },
    });
    return { success: false, error: 'No valid Kakao token' };
  }

  const payload = notification.payload as Record<string, unknown>;
  const sent = await sendKakaoMessage(payload, accessToken);

  await prisma.caseNotification.updateMany({
    where: { id: notificationId, status: 'PENDING' },
    data: sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', failReason: '재시도 전송 실패' },
  });

  return { success: sent };
}

// ============================================================================
// Kakao HTTP (fetch 기반, worker-shared 경계 규칙상 별도 구현)
// ============================================================================

async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      kakaoAccessToken: true,
      kakaoRefreshToken: true,
      kakaoTokenExpiry: true,
    },
  });

  if (!user?.kakaoAccessToken) {
    return null;
  }

  const REFRESH_MARGIN_MS = 300_000; // 5분
  if (
    user.kakaoTokenExpiry &&
    user.kakaoRefreshToken &&
    new Date(user.kakaoTokenExpiry) < new Date(Date.now() + REFRESH_MARGIN_MS)
  ) {
    return refreshKakaoToken(userId, user.kakaoRefreshToken);
  }

  return user.kakaoAccessToken;
}

async function refreshKakaoToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: getEnv('KAKAO_CLIENT_ID'),
        client_secret: getEnv('KAKAO_CLIENT_SECRET'),
        refresh_token: refreshToken,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        kakaoAccessToken: data.access_token,
        kakaoRefreshToken: data.refresh_token || refreshToken,
        kakaoTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      },
      select: { id: true },
    });

    return data.access_token;
  } catch {
    return null;
  }
}

async function sendKakaoMessage(payload: Record<string, unknown>, accessToken: string): Promise<boolean> {
  const template = {
    object_type: 'text',
    text: `🏨 ${payload.title}\n\n${payload.description}`,
    link: {
      web_url: (payload.buttonUrl as string) || 'https://www.airbnb.co.kr',
      mobile_web_url: (payload.buttonUrl as string) || 'https://www.airbnb.co.kr',
    },
    button_title: (payload.buttonText as string) || '확인하기',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(template),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = (await response.json()) as { result_code: number };
    return data.result_code === 0;
  } catch {
    return false;
  }
}
