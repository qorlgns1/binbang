import { prisma, type Prisma } from '@workspace/db';

import { getUserLocale, isStructuredPayload, renderNotification } from './i18n';
import { sendKakaoNotification } from './notifications';

export interface RetryCaseNotificationsOptions {
  /**
   * 한 번 실행 시 처리할 최대 건수
   */
  batchSize?: number;
  /**
   * PENDING 상태가 오래 지속되면 “중단된 시도”로 보고 재시도한다.
   */
  pendingStaleMs?: number;
}

export interface RetryCaseNotificationsResult {
  scanned: number;
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
}

type NotificationPayload = {
  title?: unknown;
  description?: unknown;
  buttonText?: unknown;
  buttonUrl?: unknown;
  userId?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function extractPayload(payload: Prisma.JsonValue): NotificationPayload {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as NotificationPayload;
  }
  return {};
}

/**
 * FAILED/PENDING(오래된) 알림을 재시도한다.
 *
 * - 멱등/중복 방지: (id + status + retryCount 조건)으로 먼저 “claim” 후 전송
 * - maxRetries 초과 건은 스킵
 */
export async function retryStaleCaseNotifications(
  options: RetryCaseNotificationsOptions = {},
): Promise<RetryCaseNotificationsResult> {
  const batchSize = options.batchSize ?? 25;
  const pendingStaleMs = options.pendingStaleMs ?? 2 * 60_000;
  const pendingBefore = new Date(Date.now() - pendingStaleMs);

  const candidates = await prisma.caseNotification.findMany({
    where: {
      OR: [{ status: 'FAILED' }, { status: 'PENDING', updatedAt: { lt: pendingBefore } }],
    },
    orderBy: { updatedAt: 'asc' },
    take: batchSize,
    select: {
      id: true,
      status: true,
      payload: true,
      retryCount: true,
      maxRetries: true,
      updatedAt: true,
      case: {
        select: {
          accommodation: {
            select: { userId: true },
          },
        },
      },
    },
  });

  const result: RetryCaseNotificationsResult = {
    scanned: candidates.length,
    claimed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const n of candidates) {
    if (n.retryCount >= n.maxRetries) {
      result.skipped += 1;
      continue;
    }

    // “claim” (경합 방지): 현재 상태 + retryCount 조건을 만족하는 경우에만 점유
    const claimed = await prisma.caseNotification.updateMany({
      where: {
        id: n.id,
        status: n.status,
        retryCount: n.retryCount,
      },
      data: {
        status: 'PENDING',
        retryCount: { increment: 1 },
        failReason: null,
      },
    });

    if (claimed.count !== 1) {
      result.skipped += 1;
      continue;
    }

    result.claimed += 1;

    const payload = extractPayload(n.payload as Prisma.JsonValue);
    const userId = (isNonEmptyString(payload.userId) ? payload.userId : null) ?? n.case?.accommodation?.userId ?? null;

    if (!userId) {
      await prisma.caseNotification.update({
        where: { id: n.id },
        data: { status: 'FAILED', failReason: 'payload(userId) 누락' },
        select: { id: true },
      });
      result.failed += 1;
      continue;
    }

    // 구조화된 페이로드: 발송 직전 locale 조회 + i18n 렌더링
    // 레거시 페이로드: 기존 렌더링된 텍스트 사용
    let title: string | null;
    let description: string | null;
    let buttonText: string;
    let buttonUrl: string;

    if (isStructuredPayload(payload)) {
      try {
        const locale = await getUserLocale(userId);
        const rendered = renderNotification(locale, payload);
        title = rendered.title;
        description = rendered.description;
        buttonText = rendered.buttonText;
        buttonUrl = rendered.buttonUrl;
      } catch (error) {
        const failReason = error instanceof Error ? error.message : 'locale/렌더링 예외';
        await prisma.caseNotification.update({
          where: { id: n.id },
          data: { status: 'FAILED', failReason },
          select: { id: true },
        });
        result.failed += 1;
        continue;
      }
    } else {
      title = isNonEmptyString(payload.title) ? payload.title : null;
      description = isNonEmptyString(payload.description) ? payload.description : null;
      buttonText = isNonEmptyString(payload.buttonText) ? payload.buttonText : '확인하기';
      buttonUrl = isNonEmptyString(payload.buttonUrl) ? payload.buttonUrl : '';
    }

    if (!title || !description) {
      await prisma.caseNotification.update({
        where: { id: n.id },
        data: { status: 'FAILED', failReason: 'payload(title/description) 누락' },
        select: { id: true },
      });
      result.failed += 1;
      continue;
    }

    let sent = false;
    try {
      sent = await sendKakaoNotification({
        userId,
        title,
        description,
        buttonText,
        buttonUrl,
      });
    } catch (error) {
      const failReason = error instanceof Error ? error.message : '카카오 메시지 전송 예외';
      await prisma.caseNotification.update({
        where: { id: n.id },
        data: { status: 'FAILED', failReason },
        select: { id: true },
      });
      result.failed += 1;
      continue;
    }

    await prisma.caseNotification.update({
      where: { id: n.id },
      data: sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', failReason: '카카오 메시지 전송 실패' },
      select: { id: true },
    });

    if (sent) {
      result.sent += 1;
    } else {
      result.failed += 1;
    }
  }

  return result;
}
