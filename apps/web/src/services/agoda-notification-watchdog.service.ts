import { AgodaAlertEvent, AgodaNotification, User, getDataSource } from '@workspace/db';

import { logError, logInfo } from '@/lib/logger';
import { sendAgodaAlertEmail } from '@/services/agoda-email.service';

// 감지 직후의 이벤트는 아직 알림을 만드는 중일 수 있어 30분 여유를 둔다.
const GRACE_MINUTES = 30;
// 워커가 한 시간마다 호출한다. 창 길이를 호출 간격과 같게 두면 이벤트 하나는 한 번만 검사된다.
const WINDOW_MINUTES = 60;
const NOTIFIABLE_EVENT_TYPES = ['vacancy', 'price_drop'];
const MAX_LISTED_EVENTS = 20;

export interface AgodaNotificationWatchdogResult {
  windowStart: string;
  windowEnd: string;
  missedCount: number;
  missedEventIds: string[];
  alertedRecipients: number;
}

interface MissedEventRow {
  id: number;
  accommodationId: string;
  type: string;
  detectedAt: Date;
}

/**
 * 감지됐는데 알림 행이 만들어지지 않은 이벤트를 찾아 관리자에게 알린다.
 *
 * 알림 생성은 실패해도 polling을 멈추지 않으므로, 이 감시가 없으면 누락이 조용히 쌓인다.
 * 정상이라면 감지 이벤트마다 agoda_notifications 행이 하나 있다(발송 안 됨 처리도 행은 남는다).
 */
export async function checkMissingAgodaNotifications(now: Date = new Date()): Promise<AgodaNotificationWatchdogResult> {
  const windowEnd = new Date(now.getTime() - GRACE_MINUTES * 60_000);
  const windowStart = new Date(windowEnd.getTime() - WINDOW_MINUTES * 60_000);

  const ds = await getDataSource();
  const missed = await ds
    .getRepository(AgodaAlertEvent)
    .createQueryBuilder('e')
    .select(['e.id', 'e.accommodationId', 'e.type', 'e.detectedAt'])
    .where('e.type IN (:...types)', { types: NOTIFIABLE_EVENT_TYPES })
    .andWhere('e.status = :status', { status: 'detected' })
    .andWhere('e.detectedAt >= :windowStart', { windowStart })
    .andWhere('e.detectedAt < :windowEnd', { windowEnd })
    .andWhere((qb) => {
      const notificationQb = qb
        .subQuery()
        .select('1')
        .from(AgodaNotification, 'n')
        .where('n.alertEventId = e.id')
        .getQuery();
      return `NOT EXISTS ${notificationQb}`;
    })
    .orderBy('e.detectedAt', 'ASC')
    .getMany();

  const result: AgodaNotificationWatchdogResult = {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    missedCount: missed.length,
    missedEventIds: missed.map((event) => String(event.id)),
    alertedRecipients: 0,
  };

  if (missed.length === 0) {
    logInfo('agoda_notification_watchdog_ok', { ...result });
    return result;
  }

  logError('agoda_notification_watchdog_missed', { ...result });

  const admins = await ds
    .getRepository(User)
    .createQueryBuilder('u')
    .innerJoin('u.roles', 'r')
    .select(['u.id', 'u.email'])
    .where('r.name = :roleName', { roleName: 'ADMIN' })
    .getMany();
  const recipients = admins.map((admin) => admin.email).filter((email): email is string => Boolean(email));

  const content = buildAlertEmail(missed, result);
  for (const to of recipients) {
    try {
      await sendAgodaAlertEmail({ to, ...content });
      result.alertedRecipients += 1;
    } catch (error) {
      logError('agoda_notification_watchdog_alert_failed', { error });
    }
  }

  return result;
}

function buildAlertEmail(
  missed: MissedEventRow[],
  result: AgodaNotificationWatchdogResult,
): { subject: string; text: string; html: string } {
  const listed = missed.slice(0, MAX_LISTED_EVENTS);
  const lines = listed.map(
    (event) => `- #${event.id} ${event.type} · 숙소 ${event.accommodationId} · ${event.detectedAt.toISOString()}`,
  );
  if (missed.length > listed.length) {
    lines.push(`- 외 ${missed.length - listed.length}건`);
  }

  const subject = `[빈방 경보] 알림이 만들어지지 않은 감지 ${missed.length}건`;
  const text = [
    `${result.windowStart} ~ ${result.windowEnd} 사이에 감지된 이벤트 중 ${missed.length}건에 알림 행이 없습니다.`,
    '사용자에게 빈방 알림이 나가지 않았을 수 있습니다. 운영 web 로그에서 agoda_notification_enqueue_failed를 확인하세요.',
    '',
    ...lines,
  ].join('\n');
  const html = `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
