import { describe, expect, it } from 'vitest';

import {
  determineStatus,
  isSameStayDates,
  nightsBetween,
  shouldSendAvailabilityNotification,
} from '@/lib/cron/statusUtils';

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

describe('nightsBetween', () => {
  it('1박 (연속 날짜)', () => {
    expect(nightsBetween(new Date('2026-08-19'), new Date('2026-08-20'))).toBe(1);
  });

  it('3박', () => {
    expect(nightsBetween(new Date('2026-08-19'), new Date('2026-08-22'))).toBe(3);
  });

  it('시/분/초 차이 무시 (같은 날짜면 1박)', () => {
    expect(nightsBetween(new Date('2026-08-19T10:00:00Z'), new Date('2026-08-20T22:00:00Z'))).toBe(1);
  });

  it('checkIn === checkOut 이면 최소 1 반환 (0 나누기 방지)', () => {
    expect(nightsBetween(new Date('2026-08-19'), new Date('2026-08-19'))).toBe(1);
  });

  it('월 경계를 넘는 경우', () => {
    expect(nightsBetween(new Date('2026-08-30'), new Date('2026-09-02'))).toBe(3);
  });

  it('연도 경계를 넘는 경우', () => {
    expect(nightsBetween(new Date('2026-12-30'), new Date('2027-01-02'))).toBe(3);
  });
});

describe('isSameStayDates', () => {
  it('같은 일정이면 true', () => {
    expect(
      isSameStayDates(
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-22') },
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-22') },
      ),
    ).toBe(true);
  });

  it('시/분/초가 달라도 연/월/일이 같으면 true', () => {
    expect(
      isSameStayDates(
        { checkIn: new Date('2026-08-19T00:00:00Z'), checkOut: new Date('2026-08-22T00:00:00Z') },
        { checkIn: new Date('2026-08-19T15:30:00Z'), checkOut: new Date('2026-08-22T12:00:00Z') },
      ),
    ).toBe(true);
  });

  it('체크인만 다르면 false', () => {
    expect(
      isSameStayDates(
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-22') },
        { checkIn: new Date('2026-08-20'), checkOut: new Date('2026-08-22') },
      ),
    ).toBe(false);
  });

  it('체크아웃만 다르면 false', () => {
    expect(
      isSameStayDates(
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-22') },
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-23') },
      ),
    ).toBe(false);
  });

  it('둘 다 다르면 false', () => {
    expect(
      isSameStayDates(
        { checkIn: new Date('2026-08-19'), checkOut: new Date('2026-08-22') },
        { checkIn: new Date('2026-09-01'), checkOut: new Date('2026-09-05') },
      ),
    ).toBe(false);
  });
});
