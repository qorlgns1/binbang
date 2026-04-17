import { CaseNotification, User, getDataSource } from '@workspace/db';
import {
  buildKakaoNotificationSender,
  prependKakaoNotificationSender,
  type KakaoNotificationContext,
} from '@workspace/shared/utils/kakaoNotification';

import { getEnv } from '@/lib/env';
import { logError, logInfo, logWarn } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface RetryNotificationResult {
  success: boolean;
  error?: string;
}

interface RetryNotificationOptions {
  requestId?: string | null;
}

const REFRESH_MARGIN_MS = 300_000; // 5분
const refreshInFlight = new Map<string, Promise<string | null>>();

// ============================================================================
// Service
// ============================================================================

export async function retryNotification(
  notificationId: string,
  options?: RetryNotificationOptions,
): Promise<RetryNotificationResult> {
  return retryNotificationForCase(notificationId, null, options);
}

export async function retryNotificationForCase(
  notificationId: string,
  caseId: string | null,
  options?: RetryNotificationOptions,
): Promise<RetryNotificationResult> {
  const requestId = options?.requestId ?? null;

  const markRetryFailed = async (failReason: string, error: unknown): Promise<void> => {
    logError('case_notification_retry_failed', {
      requestId,
      notificationId,
      caseId,
      failReason,
      error,
    });
    try {
      const ds = await getDataSource();
      await ds
        .createQueryBuilder()
        .update(CaseNotification)
        .set({ status: 'FAILED', failReason })
        .where('"id" = :id AND "status" = :status', { id: notificationId, status: 'PENDING' })
        .execute();
    } catch (updateError) {
      logError('case_notification_retry_status_update_failed', {
        requestId,
        notificationId,
        updateError,
        originalError: error,
      });
    }
  };

  try {
    const ds = await getDataSource();

    const notification = await ds.getRepository(CaseNotification).findOne({
      where: { id: notificationId },
      relations: { case: { accommodation: true } },
    });

    if (!notification) {
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId,
        reason: 'notification_not_found',
      });
      return { success: false, error: 'Notification not found' };
    }

    if (caseId && notification.caseId !== caseId) {
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId,
        actualCaseId: notification.caseId,
        reason: 'case_mismatch',
      });
      return { success: false, error: 'Notification does not belong to this case' };
    }

    if (notification.status !== 'FAILED') {
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        status: notification.status,
        reason: 'invalid_status',
      });
      return { success: false, error: 'Only FAILED notifications can be retried' };
    }

    if (notification.retryCount >= notification.maxRetries) {
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        retryCount: notification.retryCount,
        maxRetries: notification.maxRetries,
        reason: 'max_retries_exceeded',
      });
      return { success: false, error: 'Max retries exceeded' };
    }

    // 원자적 claim(중복 발송 방지): 읽은 retryCount와 동일할 때만 FAILED→PENDING 전이
    const claimResult = await ds
      .createQueryBuilder()
      .update(CaseNotification)
      .set({ status: 'PENDING', retryCount: () => '"retryCount" + 1', failReason: () => 'NULL' })
      .where('"id" = :id AND "status" = :status AND "retryCount" = :retryCount', {
        id: notificationId,
        status: 'FAILED',
        retryCount: notification.retryCount,
      })
      .execute();

    if ((claimResult.affected ?? 0) !== 1) {
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        retryCount: notification.retryCount,
        reason: 'claim_conflict',
      });
      return { success: false, error: 'Notification is already being retried' };
    }

    logInfo('case_notification_retry_attempt', {
      requestId,
      notificationId,
      caseId: notification.caseId,
      retryCount: notification.retryCount + 1,
      maxRetries: notification.maxRetries,
    });

    const userId = notification.case?.accommodation?.userId;
    if (!userId) {
      await ds
        .createQueryBuilder()
        .update(CaseNotification)
        .set({ status: 'FAILED', failReason: 'No user linked to case accommodation' })
        .where('"id" = :id AND "status" = :status', { id: notificationId, status: 'PENDING' })
        .execute();
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        reason: 'missing_user_id',
      });
      return { success: false, error: 'No user linked to case accommodation' };
    }

    const context = await getValidAccessToken(userId, {
      requestId,
      notificationId,
      caseId: notification.caseId,
    });
    if (!context) {
      await ds
        .createQueryBuilder()
        .update(CaseNotification)
        .set({ status: 'FAILED', failReason: '유효한 카카오 토큰 없음' })
        .where('"id" = :id AND "status" = :status', { id: notificationId, status: 'PENDING' })
        .execute();
      logWarn('case_notification_retry_rejected', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        userId,
        reason: 'missing_valid_kakao_token',
      });
      return { success: false, error: 'No valid Kakao token' };
    }

    const payload = notification.payload as Record<string, unknown>;
    const sent = await sendKakaoMessage(payload, context, notificationId, {
      requestId,
      caseId: notification.caseId,
      userId,
    });

    await ds
      .createQueryBuilder()
      .update(CaseNotification)
      .set(sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', failReason: '재시도 전송 실패' })
      .where('"id" = :id AND "status" = :status', { id: notificationId, status: 'PENDING' })
      .execute();

    if (sent) {
      logInfo('case_notification_retry_sent', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        userId,
      });
    } else {
      logWarn('case_notification_retry_send_failed', {
        requestId,
        notificationId,
        caseId: notification.caseId,
        userId,
      });
    }

    return { success: sent };
  } catch (error: unknown) {
    const failReason = error instanceof Error ? error.message : 'Unknown error';
    await markRetryFailed(failReason, error);
    return { success: false, error: failReason };
  }
}

// ============================================================================
// Kakao HTTP (fetch 기반, worker-shared 경계 규칙상 별도 구현)
// ============================================================================

interface NotificationLogContext {
  requestId?: string | null;
  notificationId?: string | null;
  caseId?: string | null;
  userId?: string | null;
}

async function getValidAccessToken(
  userId: string,
  logContext?: NotificationLogContext,
): Promise<KakaoNotificationContext | null> {
  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      kakaoAccessToken: true,
      kakaoRefreshToken: true,
      kakaoTokenExpiry: true,
    },
  });

  if (!user?.kakaoAccessToken) {
    logWarn('case_notification_kakao_token_missing', {
      requestId: logContext?.requestId ?? null,
      notificationId: logContext?.notificationId ?? null,
      caseId: logContext?.caseId ?? null,
      userId,
    });
    return null;
  }

  const sender = buildKakaoNotificationSender({
    name: user.name,
    email: user.email,
    userId,
  });

  if (
    user.kakaoTokenExpiry &&
    user.kakaoRefreshToken &&
    new Date(user.kakaoTokenExpiry) < new Date(Date.now() + REFRESH_MARGIN_MS)
  ) {
    const existingRefresh = refreshInFlight.get(userId);
    if (existingRefresh) {
      const accessToken = await existingRefresh;
      return accessToken ? { accessToken, senderDisplayName: sender.displayName } : null;
    }

    const refreshPromise = refreshKakaoToken(userId, user.kakaoRefreshToken, logContext).finally(() => {
      refreshInFlight.delete(userId);
    });
    refreshInFlight.set(userId, refreshPromise);

    const accessToken = await refreshPromise;
    return accessToken ? { accessToken, senderDisplayName: sender.displayName } : null;
  }

  return {
    accessToken: user.kakaoAccessToken,
    senderDisplayName: sender.displayName,
  };
}

async function refreshKakaoToken(
  userId: string,
  refreshToken: string,
  logContext?: NotificationLogContext,
): Promise<string | null> {
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

    if (!response.ok) {
      logWarn('case_notification_kakao_token_refresh_failed', {
        requestId: logContext?.requestId ?? null,
        notificationId: logContext?.notificationId ?? null,
        caseId: logContext?.caseId ?? null,
        userId,
        status: response.status,
      });
      return null;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const ds = await getDataSource();
    await ds.getRepository(User).update(
      { id: userId },
      {
        kakaoAccessToken: data.access_token,
        kakaoRefreshToken: data.refresh_token || refreshToken,
        kakaoTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      },
    );

    return data.access_token;
  } catch (error) {
    logError('case_notification_kakao_token_refresh_error', {
      requestId: logContext?.requestId ?? null,
      notificationId: logContext?.notificationId ?? null,
      caseId: logContext?.caseId ?? null,
      userId,
      error,
    });
    return null;
  }
}

async function sendKakaoMessage(
  payload: Record<string, unknown>,
  context: KakaoNotificationContext,
  notificationId: string,
  logContext?: NotificationLogContext,
): Promise<boolean> {
  const template = {
    object_type: 'text',
    text: prependKakaoNotificationSender(`🏨 ${payload.title}\n\n${payload.description}`, {
      name: context.senderDisplayName,
    }),
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
        Authorization: `Bearer ${context.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(template),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logWarn('case_notification_kakao_http_failed', {
        requestId: logContext?.requestId ?? null,
        notificationId,
        caseId: logContext?.caseId ?? null,
        userId: logContext?.userId ?? null,
        status: response.status,
      });
      return false;
    }

    const data = (await response.json()) as { result_code: number };
    if (data.result_code !== 0) {
      logWarn('case_notification_kakao_send_failed', {
        requestId: logContext?.requestId ?? null,
        notificationId,
        caseId: logContext?.caseId ?? null,
        userId: logContext?.userId ?? null,
        resultCode: data.result_code,
      });
    }
    return data.result_code === 0;
  } catch (error) {
    logError('case_notification_kakao_send_error', {
      requestId: logContext?.requestId ?? null,
      notificationId,
      caseId: logContext?.caseId ?? null,
      userId: logContext?.userId ?? null,
      error,
    });
    return false;
  }
}
