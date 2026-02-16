import { prisma } from '@workspace/db';
import axios from 'axios';

import {
  type SendMessageParams,
  buildNotificationEmailHtml,
  sendEmailHttp,
  sendKakaoMessageHttp,
} from '@workspace/worker-shared/observability';
import { getSettings } from './settings';
import { getEnv } from './settings/env';

// ── Types ──

export interface NotificationFallbackResult {
  sent: boolean;
  channel: 'KAKAO' | 'EMAIL';
  failReason?: string;
}

// ── Kakao Token Management ──

/**
 * 카카오 access_token 갱신
 * refreshToken을 직접 받아 추가 DB 조회를 방지한다.
 */
async function refreshKakaoToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: getEnv('KAKAO_CLIENT_ID'),
        client_secret: getEnv('KAKAO_CLIENT_SECRET'),
        refresh_token: refreshToken,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const { access_token, refresh_token, expires_in } = response.data;

    await prisma.user.update({
      where: { id: userId },
      data: {
        kakaoAccessToken: access_token,
        kakaoRefreshToken: refresh_token || refreshToken,
        kakaoTokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
      select: { id: true },
    });

    console.log('✅ 카카오 토큰 갱신 완료');
    return access_token;
  } catch (error) {
    console.error('카카오 토큰 갱신 실패:', error);
    return null;
  }
}

/**
 * 유효한 access_token 가져오기 (DB 1회 조회)
 */
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
    console.error('카카오 토큰이 없습니다. 카카오 로그인이 필요합니다.');
    return null;
  }

  // 토큰 만료 확인
  const refreshMarginMs = getSettings().notification.kakaoTokenRefreshMarginMs;
  if (
    user.kakaoTokenExpiry &&
    user.kakaoRefreshToken &&
    new Date(user.kakaoTokenExpiry) < new Date(Date.now() + refreshMarginMs)
  ) {
    console.log('⚠️ 카카오 토큰 만료 임박. 갱신 중...');
    return refreshKakaoToken(userId, user.kakaoRefreshToken);
  }

  return user.kakaoAccessToken;
}

// ── Notification Sending ──

/**
 * 카카오 알림 전송 (토큰 조회 + HTTP 전송 + 401 재시도)
 */
export async function sendKakaoNotification(params: SendMessageParams, retried = false): Promise<boolean> {
  const accessToken = await getValidAccessToken(params.userId);

  if (!accessToken) {
    console.error('유효한 카카오 토큰이 없습니다.');
    return false;
  }

  const result = await sendKakaoMessageHttp(params, accessToken);

  if (result === 'unauthorized' && !retried) {
    // 토큰 만료 시 갱신 후 1회 재시도
    console.log('⚠️ 토큰 만료. 갱신 후 재시도...');
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { kakaoRefreshToken: true },
    });
    if (user?.kakaoRefreshToken) {
      const newToken = await refreshKakaoToken(params.userId, user.kakaoRefreshToken);
      if (newToken) {
        return sendKakaoNotification(params, true);
      }
    }
  }

  return result === true;
}

/**
 * 관리자 알림 전송 (heartbeat에서 사용)
 */
export async function sendAlertNotification(params: {
  userId: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
}): Promise<boolean> {
  return sendKakaoNotification({
    userId: params.userId,
    title: params.title,
    description: params.description,
    buttonText: params.buttonText ?? 'Dashboard',
    buttonUrl: params.buttonUrl ?? '',
  });
}

/**
 * 숙소 예약 가능 알림 보내기
 */
export async function notifyAvailable(
  userId: string,
  accommodationName: string,
  checkIn: Date,
  checkOut: Date,
  price: string | null,
  checkUrl: string,
): Promise<boolean> {
  const title = '숙소 예약 가능! 🎉';

  const lines = [
    `📍 ${accommodationName}`,
    `📅 ${checkIn.toISOString().split('T')[0]} ~ ${checkOut.toISOString().split('T')[0]}`,
  ];

  if (price) {
    lines.push(`💰 ${price}`);
  }

  lines.push('');
  lines.push(`🔗 ${checkUrl}`);
  lines.push('');
  lines.push('지금 바로 확인하세요!');

  const description = lines.join('\n');

  return sendKakaoNotification({
    userId,
    title,
    description,
    buttonText: '예약하러 가기',
    buttonUrl: checkUrl,
  });
}

// ── Email Notification ──

/**
 * 사용자에게 이메일 알림을 전송한다.
 * User.email이 없으면 false를 반환한다.
 */
export async function sendEmailNotification(params: SendMessageParams): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true },
  });

  if (!user?.email) {
    console.warn('[email-fallback] 사용자 이메일이 없습니다:', params.userId);
    return false;
  }

  const html = buildNotificationEmailHtml(params.title, params.description, params.buttonText, params.buttonUrl);

  const result = await sendEmailHttp({
    to: user.email,
    subject: params.title,
    html,
  });

  return result === 'sent';
}

// ── Fallback Chain: Kakao → Email ──

/**
 * 카카오 알림을 시도하고, 실패 시 이메일로 자동 전환한다.
 *
 * 반환값에 실제 전송된 채널과 실패 사유가 포함된다.
 */
export async function sendNotificationWithFallback(params: SendMessageParams): Promise<NotificationFallbackResult> {
  const kakaoSent = await sendKakaoNotification(params);
  if (kakaoSent) {
    return { sent: true, channel: 'KAKAO' };
  }

  console.log('[fallback] 카카오 실패 → 이메일 전환 시도:', params.userId);

  const emailSent = await sendEmailNotification(params);
  if (emailSent) {
    return { sent: true, channel: 'EMAIL' };
  }

  return { sent: false, channel: 'EMAIL', failReason: '카카오 및 이메일 모두 전송 실패' };
}
