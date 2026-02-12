/**
 * Worker 알림 렌더링 템플릿.
 *
 * 구조화된 페이로드 + locale → 발송 가능한 알림 콘텐츠로 변환한다.
 * 발송 직전에 호출하여 locale 고정 의존을 제거한다 (ADR-2).
 */
import type { Locale } from '@workspace/shared/i18n';

import { createWorkerI18n } from './loader';

/** 구조화된 알림 페이로드 (DB에 저장되는 형태) */
export interface StructuredNotificationPayload {
  type: 'conditionMet';
  userId: string;
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  price: string | null;
  checkUrl: string;
}

/** 렌더링된 알림 콘텐츠 (발송 직전 생성) */
export interface RenderedNotification {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

function formatStayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toISOString().split('T')[0];
}

/**
 * 구조화된 페이로드를 locale 기반으로 렌더링한다.
 */
export function renderNotification(locale: Locale, payload: StructuredNotificationPayload): RenderedNotification {
  const i18n = createWorkerI18n(locale);
  const t = i18n.t('notification');

  if (payload.type === 'conditionMet') {
    const title = t('conditionMet.title');
    const buttonText = t('conditionMet.button');
    const checkNow = t('conditionMet.checkNow');

    const lines = [
      `📍 ${payload.accommodationName}`,
      `📅 ${formatStayDate(payload.checkIn)} ~ ${formatStayDate(payload.checkOut)}`,
    ];
    if (payload.price) {
      lines.push(`💰 ${payload.price}`);
    }
    lines.push('', `🔗 ${payload.checkUrl}`, '', checkNow);

    return { title, description: lines.join('\n'), buttonText, buttonUrl: payload.checkUrl };
  }

  return { title: '', description: '', buttonText: '', buttonUrl: '' };
}

/**
 * DB 페이로드가 구조화된 형식인지 판별한다.
 * 구조화 형식: `type` 필드가 존재하며 문자열.
 * 레거시 형식: `title` 필드가 존재 (렌더링된 텍스트 직접 저장).
 */
export function isStructuredPayload(payload: Record<string, unknown>): boolean {
  return typeof payload.type === 'string';
}
