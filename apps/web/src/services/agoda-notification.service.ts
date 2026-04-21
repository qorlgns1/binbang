import { AgodaConsentLog, AgodaNotification, In, LessThan, getDataSource } from '@workspace/db';

import { buildAgodaLandingUrl, buildClickoutUrl } from '@/lib/agoda/buildAgodaUrl';
import { logError, logInfo, logWarn } from '@/lib/logger';
import { sendAgodaAlertEmail } from '@/services/agoda-email.service';
import { sendBinbangKakaoNotification } from '@/services/agoda-kakao.service';
import {
  buildAgodaNotificationReasonBreakdown,
  encodeAgodaNotificationReason,
  type AgodaNotificationReasonCode,
} from '@/services/agoda-notification-observability.service';
import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';
import { buildAgodaUnsubscribeUrl, createAgodaUnsubscribeToken } from '@/services/agoda-unsubscribe.service';

const RETRY_BACKOFF_MINUTES = [1, 5, 30, 120, 360];
const STALE_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10분: 워커 충돌 후 복구

export interface DispatchAgodaNotificationsResult {
  now: string;
  picked: number;
  sent: number;
  failed: number;
  suppressed: number;
  skippedNotDue: number;
  failedReasonCounts: Record<string, number>;
  suppressedReasonCounts: Record<string, number>;
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
  const retryIndex = Math.max(attempt - 1, 0);
  const index = Math.min(retryIndex, RETRY_BACKOFF_MINUTES.length - 1);
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
  const ds = await getDataSource();
  // TypeORM OR 조건: accommodationId가 일치하고 userId 또는 email이 일치하는 가장 최근 레코드
  const latest = await ds
    .getRepository(AgodaConsentLog)
    .createQueryBuilder('c')
    .where('c.accommodationId = :accommodationId', { accommodationId })
    .andWhere('(c.userId = :userId OR c.email = :email)', { userId, email: email.trim().toLowerCase() })
    .orderBy('c.createdAt', 'DESC')
    .getOne();

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
  | { id: number; kind: 'suppressed'; reasonCode: AgodaNotificationReasonCode; reasonMessage: string }
  | { id: number; kind: 'sent' }
  | { id: number; kind: 'failed'; nextAttempt: number; reasonCode: AgodaNotificationReasonCode; reasonMessage: string };

function buildReasonCounts(outcomes: NotificationOutcome[], kind: 'failed' | 'suppressed'): Record<string, number> {
  return outcomes.reduce<Record<string, number>>((acc, outcome) => {
    if (outcome.kind !== kind) return acc;
    acc[outcome.reasonCode] = (acc[outcome.reasonCode] ?? 0) + 1;
    return acc;
  }, {});
}

function logDispatchOutcome(params: {
  requestId: string | null;
  notificationId: string;
  accommodationId: string | null;
  alertEventId: string | null;
  kind: 'failed' | 'suppressed';
  reasonCode: AgodaNotificationReasonCode;
  reasonMessage: string;
  attempt: number;
}): void {
  logWarn('agoda_notification_dispatch_outcome', params);
}

/**
 * Oracle에서는 다건 UPDATE ... RETURNING 대체가 까다로우므로,
 * FOR UPDATE SKIP LOCKED로 행을 잠근 뒤 같은 트랜잭션에서 processing으로 전환한다.
 * 이렇게 해야 동시 디스패처 간 중복 클레임이 발생하지 않는다.
 */
async function claimNotifications(ids: number[], fromStatus: string): Promise<number[]> {
  if (ids.length === 0) return [];
  const ds = await getDataSource();
  const idPlaceholders = ids.map((_, i) => `:${i + 2}`).join(',');

  return ds.transaction(async (manager) => {
    const lockedRows = (await manager.query(
      `SELECT "id" FROM "agoda_notifications"
       WHERE "status" = :1 AND "id" IN (${idPlaceholders})
       FOR UPDATE SKIP LOCKED`,
      [fromStatus, ...ids],
    )) as Array<{ id: number }>;

    const claimedIds = lockedRows.map((row) => Number(row.id));
    if (claimedIds.length === 0) {
      return [];
    }

    await manager.query(
      `UPDATE "agoda_notifications"
       SET "status" = 'processing', "updatedAt" = SYSTIMESTAMP
       WHERE "status" = :1 AND "id" IN (${claimedIds.map((_, i) => `:${i + 2}`).join(',')})`,
      [fromStatus, ...claimedIds],
    );

    const claimedIdSet = new Set(claimedIds);
    return ids.filter((id) => claimedIdSet.has(id));
  });
}

export async function dispatchAgodaNotifications(params?: {
  limit?: number;
  requestId?: string;
}): Promise<DispatchAgodaNotificationsResult> {
  const ds = await getDataSource();
  const runtimeSettings = await getBinbangRuntimeSettings();
  const limit = params?.limit ?? runtimeSettings.notificationDispatchLimit;
  const maxAttempts = runtimeSettings.notificationMaxAttempts;
  const now = new Date();
  const staleThreshold = new Date(Date.now() - STALE_PROCESSING_TIMEOUT_MS);
  const requestId = params?.requestId ?? null;
  const staleProcessingError = encodeAgodaNotificationReason(
    'FAILED_STALE_PROCESSING_MAX_ATTEMPTS',
    'stale processing recovered at max attempts',
  );

  // stale processing 복구: maxAttempts 도달한 항목은 failed로 종료
  await ds.query(
    `UPDATE "agoda_notifications"
     SET "status" = 'failed',
         "attempt" = :1,
         "updatedAt" = SYSTIMESTAMP,
         "lastError" = NVL("lastError", :2)
     WHERE "channel" = 'email'
       AND "status" = 'processing'
       AND "updatedAt" <= :3
       AND "attempt" + 1 >= :4`,
    [maxAttempts, staleProcessingError, staleThreshold, maxAttempts],
  );

  // stale processing 복구: maxAttempts 미달 항목은 queued로 되돌림
  await ds.query(
    `UPDATE "agoda_notifications"
     SET "status" = 'queued', "attempt" = "attempt" + 1, "updatedAt" = SYSTIMESTAMP
     WHERE "channel" = 'email'
       AND "status" = 'processing'
       AND "updatedAt" <= :1
       AND "attempt" + 1 < :2`,
    [staleThreshold, maxAttempts],
  );

  const repo = ds.getRepository(AgodaNotification);

  const queuedIdRows = await repo.find({
    where: { channel: 'email', status: 'queued', attempt: LessThan(maxAttempts) },
    order: { createdAt: 'ASC', id: 'ASC' },
    take: limit,
    select: { id: true },
  });

  const remaining = limit - queuedIdRows.length;
  const failedIdRows =
    remaining > 0
      ? await repo.find({
          where: { channel: 'email', status: 'failed', attempt: LessThan(maxAttempts) },
          order: { updatedAt: 'ASC', id: 'ASC' },
          take: remaining * 2,
          select: { id: true, updatedAt: true, attempt: true },
        })
      : [];

  const queuedIds = queuedIdRows.map((r) => r.id);
  const allDueFailed = failedIdRows.filter((r) => isRetryDue(r.updatedAt, r.attempt));
  const failedDueIds = allDueFailed.slice(0, remaining).map((r) => r.id);
  const skippedNotDue = failedIdRows.length - allDueFailed.length;

  const claimedQueuedIds = await claimNotifications(queuedIds, 'queued');
  const claimedFailedIds = await claimNotifications(failedDueIds, 'failed');
  const claimedIds = [...claimedQueuedIds, ...claimedFailedIds];

  if (claimedIds.length === 0) {
    const result = {
      now: now.toISOString(),
      picked: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      skippedNotDue,
      failedReasonCounts: {},
      suppressedReasonCounts: {},
    };
    logInfo('agoda_notification_dispatch_summary', { requestId, ...result });
    return result;
  }

  const candidates = await repo.find({
    where: { id: In(claimedIds) },
    relations: { accommodation: { user: true }, alertEvent: true },
  });

  const outcomes: NotificationOutcome[] = [];
  const baseUrl = (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim() || 'http://localhost:3000';
  if (!process.env.NEXTAUTH_URL?.trim() && process.env.NODE_ENV === 'production') {
    logError('agoda_notification_nextauth_url_missing', {
      requestId,
      baseUrl,
      message: 'NEXTAUTH_URL이 설정되지 않았습니다. 이메일 링크가 localhost를 가리킵니다.',
    });
  }

  for (const notification of candidates) {
    if (!notification.accommodation || !notification.accommodation.isActive) {
      const reasonMessage = 'accommodation is missing or inactive';
      logDispatchOutcome({
        requestId,
        notificationId: notification.id.toString(),
        accommodationId: notification.accommodation?.id ?? null,
        alertEventId: notification.alertEvent.id.toString(),
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_ACCOMMODATION_INACTIVE',
        reasonMessage,
        attempt: notification.attempt,
      });
      outcomes.push({
        id: notification.id,
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_ACCOMMODATION_INACTIVE',
        reasonMessage,
      });
      continue;
    }

    const recipientEmail = notification.accommodation.user?.email?.trim().toLowerCase();
    if (!recipientEmail) {
      const reasonMessage = 'user email is missing';
      logDispatchOutcome({
        requestId,
        notificationId: notification.id.toString(),
        accommodationId: notification.accommodation.id,
        alertEventId: notification.alertEvent.id.toString(),
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_MISSING_RECIPIENT_EMAIL',
        reasonMessage,
        attempt: notification.attempt,
      });
      outcomes.push({
        id: notification.id,
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_MISSING_RECIPIENT_EMAIL',
        reasonMessage,
      });
      continue;
    }

    const consented = await hasActiveConsent(
      notification.accommodation.userId,
      recipientEmail,
      notification.accommodation.id,
    );
    if (!consented) {
      const reasonMessage = 'no active consent (opt_in required)';
      logDispatchOutcome({
        requestId,
        notificationId: notification.id.toString(),
        accommodationId: notification.accommodation.id,
        alertEventId: notification.alertEvent.id.toString(),
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_MISSING_OPT_IN_CONSENT',
        reasonMessage,
        attempt: notification.attempt,
      });
      outcomes.push({
        id: notification.id,
        kind: 'suppressed',
        reasonCode: 'SUPPRESSED_MISSING_OPT_IN_CONSENT',
        reasonMessage,
      });
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

      if (notification.accommodation.user?.kakaoAccessToken) {
        await sendBinbangKakaoNotification(notification.accommodation.userId, {
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
          requestId,
        }).catch((err: unknown) => {
          logError('agoda_notification_kakao_failed', {
            requestId,
            accommodationId: acc.id,
            userId: acc.userId,
            alertEventId: notification.alertEvent.id.toString(),
            error: err,
          });
        });
      }

      outcomes.push({ id: notification.id, kind: 'sent' });
    } catch (error) {
      const rawReasonMessage = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
      logDispatchOutcome({
        requestId,
        notificationId: notification.id.toString(),
        accommodationId: notification.accommodation.id,
        alertEventId: notification.alertEvent.id.toString(),
        kind: 'failed',
        reasonCode: 'FAILED_EMAIL_SEND',
        reasonMessage: 'email provider error',
        attempt: notification.attempt + 1,
      });
      outcomes.push({
        id: notification.id,
        kind: 'failed',
        nextAttempt: notification.attempt + 1,
        reasonCode: 'FAILED_EMAIL_SEND',
        reasonMessage: rawReasonMessage,
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
      ? repo.update({ id: In(sentIds) }, { status: 'sent', sentAt: now, lastError: null })
      : Promise.resolve(),
    ...suppressedList.map((o) =>
      repo.update(
        { id: o.id },
        { status: 'suppressed', lastError: encodeAgodaNotificationReason(o.reasonCode, o.reasonMessage) },
      ),
    ),
    ...failedList.map((o) =>
      repo.update(
        { id: o.id },
        {
          status: 'failed',
          attempt: o.nextAttempt,
          lastError: encodeAgodaNotificationReason(o.reasonCode, o.reasonMessage),
        },
      ),
    ),
  ]);

  const failedReasonCounts = buildReasonCounts(outcomes, 'failed');
  const suppressedReasonCounts = buildReasonCounts(outcomes, 'suppressed');

  const result = {
    now: now.toISOString(),
    picked: claimedIds.length,
    sent: sentIds.length,
    failed: failedList.length,
    suppressed: suppressedList.length,
    skippedNotDue,
    failedReasonCounts,
    suppressedReasonCounts,
  };

  logInfo('agoda_notification_dispatch_summary', {
    requestId,
    ...result,
    reasonBreakdown: buildAgodaNotificationReasonBreakdown(
      [
        ...Object.entries(failedReasonCounts).map(([code, count]) => ({
          status: 'failed',
          lastError: code,
          count,
        })),
        ...Object.entries(suppressedReasonCounts).map(([code, count]) => ({
          status: 'suppressed',
          lastError: code,
          count,
        })),
      ],
      5,
    ),
  });

  return result;
}
