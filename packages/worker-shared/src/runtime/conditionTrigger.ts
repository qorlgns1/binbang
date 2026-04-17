import {
  getDataSource,
  Case,
  CaseStatus,
  CaseStatusLog,
  CaseNotification,
  NotificationStatus,
  ConditionMetEvent,
  BillingEvent,
  BillingEventType,
  QueryFailedError,
} from '@workspace/db';

import { type StructuredNotificationPayload, getUserLocale, renderNotification } from './i18n/index.js';
import { sendKakaoNotification } from './notifications.js';

// ============================================================================
// Types
// ============================================================================

export interface TriggerConditionMetInput {
  caseId: string;
  checkLogId: string;
  evidenceSnapshot: object;
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
  // Oracle ORA-00001: unique constraint violated
  if (error instanceof QueryFailedError) {
    const driverErr = (error as { driverError?: { errorNum?: number } }).driverError;
    return driverErr?.errorNum === 1;
  }
  return false;
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

    const ds = await getDataSource();
    await ds
      .getRepository(CaseNotification)
      .update(
        { id: notificationId },
        sent
          ? { status: NotificationStatus.SENT, sentAt: new Date() }
          : { status: NotificationStatus.FAILED, failReason: '카카오 메시지 전송 실패' },
      );
  } catch (error) {
    const failReason = toErrorMessage(error);
    console.error('sendAndUpdateNotification failed:', error);

    try {
      const ds = await getDataSource();
      await ds
        .getRepository(CaseNotification)
        .update({ id: notificationId }, { status: NotificationStatus.FAILED, failReason });
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
  const ds = await getDataSource();

  try {
    const result = await ds.transaction(async (manager) => {
      // 1. Case 상태 확인
      const currentCase = await manager.getRepository(Case).findOne({
        where: { id: input.caseId },
        select: { id: true, status: true },
      });

      if (!currentCase || currentCase.status !== CaseStatus.ACTIVE_MONITORING) {
        return null;
      }

      // 2. ConditionMetEvent 생성
      const evidence = manager.getRepository(ConditionMetEvent).create({
        caseId: input.caseId,
        checkLogId: input.checkLogId,
        evidenceSnapshot: input.evidenceSnapshot,
        screenshotBase64: input.screenshotBase64,
        capturedAt: input.capturedAt,
      });
      await manager.save(evidence);

      // 3. BillingEvent 생성 (caseId @unique)
      const billing = manager.getRepository(BillingEvent).create({
        caseId: input.caseId,
        type: BillingEventType.CONDITION_MET_FEE,
        conditionMetEventId: evidence.id,
        // NOTE: 현재 CONDITION_MET 알림은 무료(0원) 정책이다.
        amountKrw: 0,
        description: '조건 충족 수수료',
      });
      await manager.save(billing);

      // 4. CaseNotification 생성 (PENDING)
      const notification = manager.getRepository(CaseNotification).create({
        caseId: input.caseId,
        channel: 'KAKAO',
        status: NotificationStatus.PENDING,
        payload: notificationPayload as object,
        idempotencyKey,
        maxRetries: 3,
      });
      await manager.save(notification);

      // 5. Case 전이: ACTIVE_MONITORING → CONDITION_MET
      await manager.getRepository(Case).update(
        { id: input.caseId },
        {
          status: CaseStatus.CONDITION_MET,
          statusChangedAt: new Date(),
          statusChangedBy: 'system',
        },
      );

      // 6. CaseStatusLog 생성
      const statusLog = manager.getRepository(CaseStatusLog).create({
        caseId: input.caseId,
        fromStatus: CaseStatus.ACTIVE_MONITORING,
        toStatus: CaseStatus.CONDITION_MET,
        changedById: 'system',
        reason: '자동 전환: 조건 충족 감지',
      });
      await manager.save(statusLog);

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
