import { type Prisma, prisma } from '@workspace/db';

import { type StructuredNotificationPayload, getUserLocale, renderNotification } from './i18n';
import { sendKakaoNotification } from './notifications';

// ============================================================================
// Types
// ============================================================================

export interface TriggerConditionMetInput {
  caseId: string;
  checkLogId: string;
  evidenceSnapshot: Prisma.InputJsonValue;
  screenshotBase64: string | null;
  capturedAt: Date;
  userId: string;
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  price: string | null;
  checkUrl: string;
}

export interface TriggerConditionMetResult {
  conditionMetEventId: string;
  billingEventId: string;
  notificationId: string;
  alreadyTriggered: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function isUniqueConstraintError(error: unknown): boolean {
  return error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002';
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * 구조화된 알림 페이로드를 생성한다.
 * locale 고정 텍스트 없이 데이터만 저장하여 발송 시점에 i18n 렌더링한다.
 */
function buildNotificationPayload(input: TriggerConditionMetInput): StructuredNotificationPayload {
  return {
    type: 'conditionMet',
    userId: input.userId,
    accommodationName: input.accommodationName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    price: input.price,
    checkUrl: input.checkUrl,
  };
}

async function sendAndUpdateNotification(
  notificationId: string,
  userId: string,
  payload: StructuredNotificationPayload,
): Promise<void> {
  try {
    const locale = await getUserLocale(userId);
    const rendered = renderNotification(locale, payload);

    const sent = await sendKakaoNotification({
      userId,
      title: rendered.title,
      description: rendered.description,
      buttonText: rendered.buttonText,
      buttonUrl: rendered.buttonUrl,
    });

    await prisma.caseNotification.update({
      where: { id: notificationId },
      data: sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', failReason: '카카오 메시지 전송 실패' },
      select: { id: true },
    });
  } catch (error) {
    const failReason = toErrorMessage(error);
    console.error('sendAndUpdateNotification failed:', error);

    try {
      await prisma.caseNotification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failReason,
        },
        select: { id: true },
      });
    } catch (updateError) {
      console.error('sendAndUpdateNotification: failed to update notification status after send error:', {
        updateError,
        originalError: error,
        notificationId,
      });
    }
  }
}

// ============================================================================
// Main
// ============================================================================

/**
 * 조건 충족 시 원자적 트리거:
 * TX 내부: 증거 + 과금 + 알림(PENDING) + Case 전이 + 상태 로그
 * TX 외부: 카카오 알림 전송 + 결과 업데이트
 */
export async function triggerConditionMet(input: TriggerConditionMetInput): Promise<TriggerConditionMetResult | null> {
  const idempotencyKey = `${input.caseId}:${input.checkLogId}`;
  const notificationPayload = buildNotificationPayload(input);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Case 상태 확인
      const currentCase = await tx.case.findUnique({
        where: { id: input.caseId },
        select: { id: true, status: true },
      });

      if (!currentCase || currentCase.status !== 'ACTIVE_MONITORING') {
        return null;
      }

      // 2. ConditionMetEvent 생성
      const evidence = await tx.conditionMetEvent.create({
        data: {
          caseId: input.caseId,
          checkLogId: input.checkLogId,
          evidenceSnapshot: input.evidenceSnapshot,
          screenshotBase64: input.screenshotBase64,
          capturedAt: input.capturedAt,
        },
        select: { id: true },
      });

      // 3. BillingEvent 생성 (caseId @unique)
      const billing = await tx.billingEvent.create({
        data: {
          caseId: input.caseId,
          type: 'CONDITION_MET_FEE',
          conditionMetEventId: evidence.id,
          // NOTE: 현재 CONDITION_MET 알림은 무료(0원) 정책이다.
          // input.price는 숙소 가격 문자열로, 알림/증거 용도로만 사용한다.
          amountKrw: 0,
          description: '조건 충족 수수료',
        },
        select: { id: true },
      });

      // 4. CaseNotification 생성 (PENDING)
      const notification = await tx.caseNotification.create({
        data: {
          caseId: input.caseId,
          channel: 'KAKAO',
          status: 'PENDING',
          payload: notificationPayload as unknown as Prisma.InputJsonValue,
          idempotencyKey,
          maxRetries: 3,
        },
        select: { id: true },
      });

      // 5. Case 전이: ACTIVE_MONITORING → CONDITION_MET
      await tx.case.update({
        where: { id: input.caseId },
        data: {
          status: 'CONDITION_MET',
          statusChangedAt: new Date(),
          statusChangedBy: 'system',
        },
        select: { id: true },
      });

      // 6. CaseStatusLog 생성
      await tx.caseStatusLog.create({
        data: {
          caseId: input.caseId,
          fromStatus: 'ACTIVE_MONITORING',
          toStatus: 'CONDITION_MET',
          changedById: 'system',
          reason: '자동 전환: 조건 충족 감지',
        },
        select: { id: true },
      });

      return {
        conditionMetEventId: evidence.id,
        billingEventId: billing.id,
        notificationId: notification.id,
        alreadyTriggered: false,
      };
    });

    if (!result) {
      return null;
    }

    // 7. TX 외부: 카카오 알림 전송
    await sendAndUpdateNotification(result.notificationId, input.userId, notificationPayload);

    return result;
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return {
        conditionMetEventId: '',
        billingEventId: '',
        notificationId: '',
        alreadyTriggered: true,
      };
    }
    throw error;
  }
}
