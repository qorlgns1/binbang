import { prisma } from '@workspace/db';

import { buildClickoutUrl } from '@/lib/agoda/buildAgodaUrl';
import { getEnv } from '@/lib/env';
import { type KakaoMemoTemplate, sendKakaoMemo } from '@/lib/kakao/sendKakaoMemo';

// ============================================================================
// 토큰 관리
// ============================================================================

const REFRESH_MARGIN_MS = 300_000; // 만료 5분 전 갱신
const REQUEST_TIMEOUT_MS = 10_000;

async function refreshKakaoAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
        kakaoRefreshToken: data.refresh_token ?? refreshToken,
        kakaoTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      },
      select: { id: true },
    });

    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * DB에 저장된 카카오 토큰을 조회하고, 만료 임박 시 자동 갱신 후 반환한다.
 * 토큰이 없거나 갱신에 실패하면 null을 반환한다 (예외 미전파).
 */
export async function getValidKakaoAccessToken(userId: string): Promise<string | null> {
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

  const needsRefresh =
    user.kakaoTokenExpiry &&
    user.kakaoRefreshToken &&
    new Date(user.kakaoTokenExpiry) < new Date(Date.now() + REFRESH_MARGIN_MS);

  if (needsRefresh) {
    return refreshKakaoAccessToken(userId, user.kakaoRefreshToken as string);
  }

  return user.kakaoAccessToken;
}

// ============================================================================
// 메시지 빌더
// ============================================================================

interface BinbangKakaoParams {
  accommodationName: string;
  alertType: string;
  checkIn: string;
  checkOut: string;
  agodaUrl: string | null;
  dropRatio?: number | null;
  currency?: string | null;
  afterPrice?: number | null;
  totalInclusive?: number | null;
  baseUrl: string;
}

function toDisplayPrice(value: number | null | undefined, currency: string | null | undefined): string {
  if (value == null) return '확인 필요';
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency || 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency ?? 'KRW'}`;
  }
}

function buildBinbangKakaoTemplate(params: BinbangKakaoParams): KakaoMemoTemplate {
  const { accommodationName, alertType, checkIn, checkOut, agodaUrl, baseUrl } = params;
  const linkUrl = agodaUrl ?? baseUrl;
  const link = { web_url: linkUrl, mobile_web_url: linkUrl };

  if (alertType === 'price_drop') {
    const price = params.afterPrice ?? params.totalInclusive ?? null;
    const dropText = params.dropRatio != null ? `${(params.dropRatio * 100).toFixed(1)}%` : '';
    const priceText = toDisplayPrice(price, params.currency);
    const dropLine = dropText ? `가격 하락: ${dropText}\n` : '';

    return {
      object_type: 'text',
      text: `💸 [가격 하락 알림] 가격 하락 감지\n\n🏨 ${accommodationName}\n📅 ${checkIn} ~ ${checkOut}\n\n${dropLine}현재 가격: ${priceText}\n\n매진 전에 확인하세요!`,
      link,
      button_title: '예약 페이지 이동',
    };
  }

  return {
    object_type: 'text',
    text: `🏨 [빈방 알림] 방이 열렸어요!\n\n${accommodationName}\n📅 ${checkIn} ~ ${checkOut}\n\n매진 전에 빠르게 확인하세요!`,
    link,
    button_title: '예약 페이지 이동',
  };
}

// ============================================================================
// 발송
// ============================================================================

export interface SendBinbangKakaoParams {
  accommodationId: string;
  accommodationName: string;
  alertType: string;
  checkIn: Date;
  checkOut: Date;
  rawAgodaUrl: string | null;
  dropRatio?: number | null;
  currency?: string | null;
  afterPrice?: number | null;
  totalInclusive?: number | null;
  baseUrl: string;
}

/**
 * 특정 사용자에게 Binbang 빈방/가격 하락 카카오 메시지를 발송한다.
 *
 * - 카카오 토큰이 없거나 갱신 실패 시 skip (false 반환)
 * - 발송 실패 시 false 반환, 예외 미전파
 */
export async function sendBinbangKakaoNotification(userId: string, params: SendBinbangKakaoParams): Promise<boolean> {
  const accessToken = await getValidKakaoAccessToken(userId);
  if (!accessToken) {
    return false;
  }

  const agodaUrl = params.rawAgodaUrl
    ? buildClickoutUrl({
        baseUrl: params.baseUrl,
        accommodationId: params.accommodationId,
        landingUrl: params.rawAgodaUrl,
      })
    : null;

  const template = buildBinbangKakaoTemplate({
    accommodationName: params.accommodationName,
    alertType: params.alertType,
    checkIn: params.checkIn.toISOString().slice(0, 10),
    checkOut: params.checkOut.toISOString().slice(0, 10),
    agodaUrl,
    dropRatio: params.dropRatio,
    currency: params.currency,
    afterPrice: params.afterPrice,
    totalInclusive: params.totalInclusive,
    baseUrl: params.baseUrl,
  });

  return sendKakaoMemo(template, accessToken);
}
