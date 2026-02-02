import { describe, expect, it } from 'vitest';

import { determineStatus, shouldSendAvailabilityNotification } from '@/lib/cron/statusUtils';

describe('determineStatus', () => {
  it('에러 있으면 ERROR', () => {
    expect(determineStatus({ error: 'Connection failed', available: false })).toBe('ERROR');
  });

  it('에러 있으면 available true여도 ERROR', () => {
    expect(determineStatus({ error: 'timeout', available: true })).toBe('ERROR');
  });

  it('에러 없고 예약 가능하면 AVAILABLE', () => {
    expect(determineStatus({ error: null, available: true })).toBe('AVAILABLE');
  });

  it('에러 없고 예약 불가하면 UNAVAILABLE', () => {
    expect(determineStatus({ error: null, available: false })).toBe('UNAVAILABLE');
  });
});

describe('shouldSendAvailabilityNotification', () => {
  it('AVAILABLE로 전환 + 이전 UNAVAILABLE + 토큰 있음 → 전송', () => {
    expect(shouldSendAvailabilityNotification('AVAILABLE', 'UNAVAILABLE', true)).toBe(true);
  });

  it('AVAILABLE로 전환 + 이전 null + 토큰 있음 → 전송', () => {
    expect(shouldSendAvailabilityNotification('AVAILABLE', null, true)).toBe(true);
  });

  it('이미 AVAILABLE였으면 전송 안 함', () => {
    expect(shouldSendAvailabilityNotification('AVAILABLE', 'AVAILABLE', true)).toBe(false);
  });

  it('토큰 없으면 전송 안 함', () => {
    expect(shouldSendAvailabilityNotification('AVAILABLE', 'UNAVAILABLE', false)).toBe(false);
  });

  it('UNAVAILABLE 상태면 전송 안 함', () => {
    expect(shouldSendAvailabilityNotification('UNAVAILABLE', null, true)).toBe(false);
  });

  it('ERROR 상태면 전송 안 함', () => {
    expect(shouldSendAvailabilityNotification('ERROR', 'UNAVAILABLE', true)).toBe(false);
  });
});
