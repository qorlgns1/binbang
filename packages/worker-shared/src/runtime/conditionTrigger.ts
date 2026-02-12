import { type Prisma, prisma } from '@workspace/db';

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

function buildNotificationPayload(input: TriggerConditionMetInput): Record<string, unknown> {
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  const lines = [
    `📍 ${input.accommodationName}`,
    `📅 ${checkIn.toISOString().split('T')[0]} ~ ${checkOut.toISOString().split('T')[0]}`,
  ];
  if (input.price) {
    lines.push(`💰 ${input.price}`);
  }
  lines.push('', `🔗 ${input.checkUrl}`, '', '지금 바로 확인하세요!');

  return {
    title: '숙소 예약 가능! 🎉',
    description: lines.join('\n'),
    buttonText: '예약하러 가기',
    buttonUrl: input.checkUrl,
    userId: input.userId,
  };
}

async function sendAndUpdateNotification(
  notificationId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const sent = await sendKakaoNotification({
      userId,
      title: payload.title as string,
      description: payload.description as string,
      buttonText: payload.buttonText as string,
      buttonUrl: payload.buttonUrl as string,
    });

    await prisma.caseNotification.update({
      where: { id: notificationId },
      data: sent ? { status: 'SENT', sentAt: new Date() } : { status: 'FAILED', failReason: '카카오 메시지 전송 실패' },
      select: { id: true },
    });
  } catch (error) {
    await prisma.caseNotification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        failReason: error instanceof Error ? error.message : 'Unknown error',
      },
      select: { id: true },
    });
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
          payload: notificationPayload as Prisma.InputJsonValue,
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
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
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
