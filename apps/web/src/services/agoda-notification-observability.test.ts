import { describe, expect, it } from 'vitest';

import {
  buildAgodaNotificationReasonBreakdown,
  encodeAgodaNotificationReason,
  parseAgodaNotificationReason,
} from './agoda-notification-observability';

describe('agoda-notification-observability', () => {
  it('encodes and parses structured notification reasons', () => {
    const encoded = encodeAgodaNotificationReason('FAILED_EMAIL_SEND', 'SMTP timeout');
    const parsed = parseAgodaNotificationReason(encoded, 'failed');

    expect(encoded).toBe('FAILED_EMAIL_SEND::SMTP timeout');
    expect(parsed.code).toBe('FAILED_EMAIL_SEND');
    expect(parsed.message).toBe('SMTP timeout');
  });

  it('infers legacy suppression reasons', () => {
    const parsed = parseAgodaNotificationReason('no active consent (opt_in required)', 'suppressed');

    expect(parsed.code).toBe('SUPPRESSED_MISSING_OPT_IN_CONSENT');
    expect(parsed.label).toBe('수신 동의 없음');
  });

  it('builds top reason breakdown by status', () => {
    const breakdown = buildAgodaNotificationReasonBreakdown([
      { status: 'failed', lastError: 'FAILED_EMAIL_SEND::SMTP timeout', count: 3 },
      { status: 'failed', lastError: 'FAILED_STALE_PROCESSING_MAX_ATTEMPTS', count: 1 },
      { status: 'suppressed', lastError: 'user email is missing', count: 2 },
    ]);

    expect(breakdown.failed[0]).toEqual({
      code: 'FAILED_EMAIL_SEND',
      label: '이메일 전송 실패',
      count: 3,
    });
    expect(breakdown.suppressed[0]).toEqual({
      code: 'SUPPRESSED_MISSING_RECIPIENT_EMAIL',
      label: '수신자 이메일 없음',
      count: 2,
    });
  });
});
