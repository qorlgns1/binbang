import { prisma } from '@workspace/db';

import { buildAgodaLandingUrl, buildClickoutUrl } from '@/lib/agoda/buildAgodaUrl';
import { sendAgodaAlertEmail } from '@/services/agoda-email.service';
import { sendMoonCatchKakaoNotification } from '@/services/agoda-kakao.service';
import { buildAgodaUnsubscribeUrl, createAgodaUnsubscribeToken } from '@/services/agoda-unsubscribe.service';

const DEFAULT_DISPATCH_LIMIT = 50;
const DEFAULT_MAX_ATTEMPTS = 5;
const RETRY_BACKOFF_MINUTES = [1, 5, 30, 120, 360];

export interface DispatchAgodaNotificationsResult {
  now: string;
  picked: number;
  sent: number;
  failed: number;
  suppressed: number;
  skippedNotDue: number;
}

function parsePositiveInteger(value: string | undefined, fallbackValue: number): number {
  if (!value) return fallbackValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
  return parsed;
}

type AgodaEmailLocale = 'ko' | 'en';

function resolveEmailLocale(locale: string | null | undefined): AgodaEmailLocale {
  if (!locale) return 'ko';
  return locale.trim().toLowerCase().startsWith('en') ? 'en' : 'ko';
}

function toDisplayPrice(value: number | null, currency: string | null, locale: AgodaEmailLocale): string {
  if (value == null) return locale === 'en' ? 'unknown' : '확인 필요';
  const resolvedCurrency = currency || 'KRW';
  try {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${resolvedCurrency}`;
  }
}

function resolveRetryDelayMinutes(attempt: number): number {
  const index = Math.min(Math.max(attempt, 0), RETRY_BACKOFF_MINUTES.length - 1);
  return RETRY_BACKOFF_MINUTES[index] ?? RETRY_BACKOFF_MINUTES[RETRY_BACKOFF_MINUTES.length - 1] ?? 60;
}

function isRetryDue(updatedAt: Date, attempt: number): boolean {
  const waitMinutes = resolveRetryDelayMinutes(attempt);
  const dueAt = new Date(updatedAt.getTime() + waitMinutes * 60 * 1000);
  return dueAt <= new Date();
}

function parseEventMeta(meta: unknown): {
  propertyId?: string;
  roomId?: string;
  ratePlanId?: string;
  currency?: string;
  totalInclusive?: number;
  afterPrice?: number;
  dropRatio?: number;
  afterRemainingRooms?: number;
} {
  if (typeof meta !== 'object' || meta == null) return {};
  const value = meta as Record<string, unknown>;

  return {
    propertyId: typeof value.propertyId === 'string' ? value.propertyId : undefined,
    roomId: typeof value.roomId === 'string' ? value.roomId : undefined,
    ratePlanId: typeof value.ratePlanId === 'string' ? value.ratePlanId : undefined,
    currency: typeof value.currency === 'string' ? value.currency : undefined,
    totalInclusive: typeof value.totalInclusive === 'number' ? value.totalInclusive : undefined,
    afterPrice: typeof value.afterPrice === 'number' ? value.afterPrice : undefined,
    dropRatio: typeof value.dropRatio === 'number' ? value.dropRatio : undefined,
    afterRemainingRooms: typeof value.afterRemainingRooms === 'number' ? value.afterRemainingRooms : undefined,
  };
}

async function hasActiveConsent(userId: string, email: string, accommodationId: string): Promise<boolean> {
  const latest = await prisma.agodaConsentLog.findFirst({
    where: {
      accommodationId,
      OR: [{ userId }, { email: email.trim().toLowerCase() }],
    },
    orderBy: { createdAt: 'desc' },
    select: { type: true },
  });

  return latest?.type === 'opt_in';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmailContent(params: {
  accommodationName: string;
  alertType: string;
  meta: ReturnType<typeof parseEventMeta>;
  agodaUrl: string | null;
  unsubscribeUrl: string;
  dashboardUrl: string;
  locale: AgodaEmailLocale;
}): { subject: string; text: string; html: string } {
  const hotelName = params.accommodationName;
  const isEnglish = params.locale === 'en';
  const heading = isEnglish ? 'Availability Alert' : '가용성 감지 알림';

  const buttonHtml = params.agodaUrl
    ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(params.agodaUrl)}" style="display:inline-block;padding:10px 14px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${isEnglish ? 'Go to Booking Page' : '예약 페이지 이동'}</a></p>`
    : '';

  const commonFooterText = isEnglish
    ? [`Manage alerts: ${params.dashboardUrl}`, `Unsubscribe: ${params.unsubscribeUrl}`]
    : [`대시보드 보기: ${params.dashboardUrl}`, `알림 수신거부: ${params.unsubscribeUrl}`];

  const commonFooterHtml = [
    `<p style="margin:0 0 6px;"><a href="${escapeHtml(params.dashboardUrl)}">${isEnglish ? 'Manage alerts on Dashboard' : '대시보드에서 알림 관리'}</a></p>`,
    `<p style="margin:0;"><a href="${escapeHtml(params.unsubscribeUrl)}">${isEnglish ? 'Unsubscribe from this alert' : '이 알림 수신거부'}</a></p>`,
  ].join('');

  if (params.alertType === 'vacancy_proxy') {
    if (isEnglish) {
      return {
        subject: `[${hotelName}] New room type detected`,
        text: [
          `${heading} - ${hotelName}`,
          '',
          `A new room type appeared for your tracked stay.`,
          `This may indicate availability — please check the booking page.`,
          '',
          ...(params.agodaUrl ? [`Go to booking page: ${params.agodaUrl}`] : []),
          ...commonFooterText,
        ].join('\n'),
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">A new room type appeared for your tracked stay.</p><p style="margin:0 0 16px;">This may indicate availability — please check the booking page.</p>${buttonHtml}${commonFooterHtml}</div>`,
      };
    }

    return {
      subject: `[${hotelName}] 새 객실 유형이 감지되었습니다`,
      text: [
        `${heading} - ${hotelName}`,
        '',
        `추적 중인 일정에서 새 객실 유형이 나타났습니다.`,
        `가용성 신호일 수 있으니 예약 페이지에서 확인해주세요.`,
        '',
        ...(params.agodaUrl ? [`예약 페이지 이동: ${params.agodaUrl}`] : []),
        ...commonFooterText,
      ].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">추적 중인 일정에서 새 객실 유형이 나타났습니다.</p><p style="margin:0 0 16px;">가용성 신호일 수 있으니 예약 페이지에서 확인해주세요.</p>${buttonHtml}${commonFooterHtml}</div>`,
    };
  }

  if (params.alertType === 'price_drop') {
    const currentPrice = params.meta.afterPrice ?? params.meta.totalInclusive ?? null;
    const dropRatio = params.meta.dropRatio ?? null;
    const dropText = dropRatio != null ? `${(dropRatio * 100).toFixed(1)}%` : 'N/A';
    const priceText = toDisplayPrice(currentPrice, params.meta.currency ?? null, params.locale);

    if (isEnglish) {
      return {
        subject: `[${hotelName}] Price dropped by ${dropText}`,
        text: [
          `${heading} - ${hotelName}`,
          '',
          `Price drop detected for your tracked stay.`,
          `Current price: ${priceText} (drop: ${dropText})`,
          '',
          ...(params.agodaUrl ? [`Go to booking page: ${params.agodaUrl}`] : []),
          ...commonFooterText,
        ].join('\n'),
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">Price drop detected for your tracked stay.</p><p style="margin:0 0 16px;">Current price: <strong>${escapeHtml(priceText)}</strong> (drop: ${escapeHtml(dropText)})</p>${buttonHtml}${commonFooterHtml}</div>`,
      };
    }

    return {
      subject: `[${hotelName}] 가격이 ${dropText} 내려갔습니다`,
      text: [
        `${heading} - ${hotelName}`,
        '',
        '추적 중인 일정에서 가격 하락을 감지했습니다.',
        `현재 가격: ${priceText} (하락률: ${dropText})`,
        '',
        ...(params.agodaUrl ? [`예약 페이지 이동: ${params.agodaUrl}`] : []),
        ...commonFooterText,
      ].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">추적 중인 일정에서 가격 하락을 감지했습니다.</p><p style="margin:0 0 16px;">현재 가격: <strong>${escapeHtml(priceText)}</strong> (하락률: ${escapeHtml(dropText)})</p>${buttonHtml}${commonFooterHtml}</div>`,
    };
  }

  if (isEnglish) {
    return {
      subject: `[${hotelName}] Room availability detected`,
      text: [
        `${heading} - ${hotelName}`,
        '',
        `The hotel you're tracking has become available again.`,
        `Please check the booking page before it sells out.`,
        '',
        ...(params.agodaUrl ? [`Go to booking page: ${params.agodaUrl}`] : []),
        ...commonFooterText,
      ].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">The hotel you're tracking has become available again.</p><p style="margin:0 0 16px;">Please check the booking page before it sells out.</p>${buttonHtml}${commonFooterHtml}</div>`,
    };
  }

  return {
    subject: `[${hotelName}] 빈방이 감지되었습니다`,
    text: [
      `${heading} - ${hotelName}`,
      '',
      `추적 중인 숙소에서 다시 방이 열렸습니다.`,
      `매진되기 전에 예약 페이지에서 확인해주세요.`,
      '',
      ...(params.agodaUrl ? [`예약 페이지 이동: ${params.agodaUrl}`] : []),
      ...commonFooterText,
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;"><h2 style="margin:0 0 8px;">${escapeHtml(heading)}</h2><p style="margin:0 0 12px;"><strong>${escapeHtml(hotelName)}</strong></p><p style="margin:0 0 8px;">추적 중인 숙소에서 다시 방이 열렸습니다.</p><p style="margin:0 0 16px;">매진되기 전에 예약 페이지에서 확인해주세요.</p>${buttonHtml}${commonFooterHtml}</div>`,
  };
}

type NotificationOutcome =
  | { id: bigint; kind: 'skipped_not_due' }
  | { id: bigint; kind: 'suppressed'; reason: string }
  | { id: bigint; kind: 'sent' }
  | { id: bigint; kind: 'failed'; nextAttempt: number; lastError: string };

export async function dispatchAgodaNotifications(params?: {
  limit?: number;
}): Promise<DispatchAgodaNotificationsResult> {
  const limit =
    params?.limit ?? parsePositiveInteger(process.env.MOONCATCH_NOTIFICATION_DISPATCH_LIMIT, DEFAULT_DISPATCH_LIMIT);
  const maxAttempts = parsePositiveInteger(process.env.MOONCATCH_NOTIFICATION_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
  const now = new Date();

  const notificationSelect = {
    id: true,
    status: true,
    attempt: true,
    updatedAt: true,
    accommodation: {
      select: {
        id: true,
        name: true,
        platformId: true,
        isActive: true,
        url: true,
        userId: true,
        checkIn: true,
        checkOut: true,
        adults: true,
        rooms: true,
        children: true,
        locale: true,
        platformMetadata: true,
        user: { select: { email: true, kakaoAccessToken: true } },
      },
    },
    alertEvent: {
      select: {
        id: true,
        type: true,
        status: true,
        meta: true,
      },
    },
  } as const;

  // queued를 우선 처리하고, 남은 슬롯에만 failed를 채운다.
  // queued + failed를 혼합 조회하면 backoff 중인 failed가 슬롯을 점유해
  // 새로운 queued 알림이 영원히 선택되지 못하는 starvation이 발생한다.
  const queued = await prisma.agodaNotification.findMany({
    where: { channel: 'email', status: 'queued', attempt: { lt: maxAttempts } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: limit,
    select: notificationSelect,
  });

  const remaining = limit - queued.length;
  const failedCandidates =
    remaining > 0
      ? await prisma.agodaNotification.findMany({
          where: { channel: 'email', status: 'failed', attempt: { lt: maxAttempts } },
          orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
          take: remaining,
          select: notificationSelect,
        })
      : [];

  const candidates = [...queued, ...failedCandidates];

  const outcomes: NotificationOutcome[] = [];
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000';

  for (const notification of candidates) {
    if (notification.status === 'failed' && !isRetryDue(notification.updatedAt, notification.attempt)) {
      outcomes.push({ id: notification.id, kind: 'skipped_not_due' });
      continue;
    }

    if (!notification.accommodation || !notification.accommodation.isActive) {
      outcomes.push({ id: notification.id, kind: 'suppressed', reason: 'accommodation is missing or inactive' });
      continue;
    }

    const recipientEmail = notification.accommodation.user?.email?.trim().toLowerCase();
    if (!recipientEmail) {
      outcomes.push({ id: notification.id, kind: 'suppressed', reason: 'user email is missing' });
      continue;
    }

    const consented = await hasActiveConsent(notification.accommodation.userId, recipientEmail, notification.accommodation.id);
    if (!consented) {
      outcomes.push({ id: notification.id, kind: 'suppressed', reason: 'no active consent (opt_in required)' });
      continue;
    }

    try {
      const unsubscribeToken = createAgodaUnsubscribeToken({
        accommodationId: notification.accommodation.id,
        email: recipientEmail,
      });
      const unsubscribeUrl = buildAgodaUnsubscribeUrl(unsubscribeToken);
      const dashboardUrl = `${baseUrl.replace(/\/$/, '')}/dashboard`;
      const meta = parseEventMeta(notification.alertEvent.meta);

      // Agoda 랜딩 URL: metaSearch에서 받은 URL > fallback(platformId 기반) > null
      const acc = notification.accommodation;
      const storedLandingUrl =
        acc.platformMetadata != null &&
        typeof acc.platformMetadata === 'object' &&
        !Array.isArray(acc.platformMetadata) &&
        typeof (acc.platformMetadata as Record<string, unknown>).landingUrl === 'string'
          ? ((acc.platformMetadata as Record<string, unknown>).landingUrl as string)
          : null;

      const rawAgodaUrl =
        storedLandingUrl ??
        (acc.platformId
          ? buildAgodaLandingUrl({
              platformId: acc.platformId,
              checkIn: acc.checkIn.toISOString().slice(0, 10),
              checkOut: acc.checkOut.toISOString().slice(0, 10),
              adults: acc.adults,
              rooms: acc.rooms,
              children: acc.children,
            })
          : null);

      // /api/go 클릭아웃 경유 URL (추적용)
      const agodaUrl = rawAgodaUrl
        ? buildClickoutUrl({
            baseUrl: baseUrl,
            accommodationId: acc.id,
            landingUrl: rawAgodaUrl,
          })
        : null;

      const emailContent = buildEmailContent({
        accommodationName: notification.accommodation.name,
        alertType: notification.alertEvent.type,
        meta,
        agodaUrl,
        unsubscribeUrl,
        dashboardUrl,
        locale: resolveEmailLocale(notification.accommodation.locale),
      });

      await sendAgodaAlertEmail({
        to: recipientEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      // 카카오 토큰이 있으면 병행 발송 (실패해도 이메일 상태에 영향 없음)
      if (notification.accommodation.user?.kakaoAccessToken) {
        await sendMoonCatchKakaoNotification(notification.accommodation.userId, {
          accommodationId: acc.id,
          accommodationName: acc.name,
          alertType: notification.alertEvent.type,
          checkIn: acc.checkIn,
          checkOut: acc.checkOut,
          rawAgodaUrl: rawAgodaUrl,
          dropRatio: meta.dropRatio ?? null,
          currency: meta.currency ?? null,
          afterPrice: meta.afterPrice ?? null,
          totalInclusive: meta.totalInclusive ?? null,
          baseUrl,
        }).catch(() => {});
      }

      outcomes.push({ id: notification.id, kind: 'sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({
        id: notification.id,
        kind: 'failed',
        nextAttempt: notification.attempt + 1,
        lastError: message.slice(0, 1000),
      });
    }
  }

  const sentIds = outcomes
    .filter((o): o is Extract<NotificationOutcome, { kind: 'sent' }> => o.kind === 'sent')
    .map((o) => o.id);
  const suppressedList = outcomes.filter(
    (o): o is Extract<NotificationOutcome, { kind: 'suppressed' }> => o.kind === 'suppressed',
  );
  const failedList = outcomes.filter((o): o is Extract<NotificationOutcome, { kind: 'failed' }> => o.kind === 'failed');

  await Promise.all([
    sentIds.length > 0
      ? prisma.agodaNotification.updateMany({
          where: { id: { in: sentIds } },
          data: { status: 'sent', sentAt: now, lastError: null },
        })
      : Promise.resolve(),
    suppressedList.length > 0
      ? prisma.$transaction(
          suppressedList.map((o) =>
            prisma.agodaNotification.update({
              where: { id: o.id },
              data: { status: 'suppressed', lastError: o.reason },
            }),
          ),
        )
      : Promise.resolve(),
    failedList.length > 0
      ? prisma.$transaction(
          failedList.map((o) =>
            prisma.agodaNotification.update({
              where: { id: o.id },
              data: { status: 'failed', attempt: o.nextAttempt, lastError: o.lastError },
            }),
          ),
        )
      : Promise.resolve(),
  ]);

  return {
    now: now.toISOString(),
    picked: candidates.length,
    sent: sentIds.length,
    failed: failedList.length,
    suppressed: suppressedList.length,
    skippedNotDue: outcomes.filter((o) => o.kind === 'skipped_not_due').length,
  };
}
