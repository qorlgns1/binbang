import { describe, expect, it } from 'vitest';

import {
  calculateNights,
  formatDate,
  isRetryableError,
} from '@/lib/checkers/utils';

describe('isRetryableError', () => {
  it('Navigation timeout는 재시도 불가 (명시적 제외)', () => {
    expect(isRetryableError('Navigation timeout of 30000 ms exceeded')).toBe(
      false,
    );
  });

  it('frame was detached → 재시도 가능', () => {
    expect(isRetryableError('Error: frame was detached')).toBe(true);
  });

  it('Connection closed → 재시도 가능', () => {
    expect(isRetryableError('Connection closed')).toBe(true);
  });

  it('Target closed → 재시도 가능', () => {
    expect(isRetryableError('Target closed')).toBe(true);
  });

  it('protocolTimeout → 재시도 가능', () => {
    expect(isRetryableError('protocolTimeout')).toBe(true);
  });

  it('net::ERR_ 패턴 → 재시도 가능', () => {
    expect(isRetryableError('net::ERR_CONNECTION_REFUSED')).toBe(true);
  });

  it('ECONNREFUSED → 재시도 가능', () => {
    expect(isRetryableError('ECONNREFUSED')).toBe(true);
  });

  it('ECONNRESET → 재시도 가능', () => {
    expect(isRetryableError('ECONNRESET')).toBe(true);
  });

  it('알 수 없는 에러 → 재시도 불가', () => {
    expect(isRetryableError('Something went wrong')).toBe(false);
  });

  it('빈 문자열 → 재시도 불가', () => {
    expect(isRetryableError('')).toBe(false);
  });
});

describe('formatDate', () => {
  it('Date 객체를 YYYY-MM-DD로 변환', () => {
    const date = new Date('2025-03-15T12:00:00.000Z');
    expect(formatDate(date)).toBe('2025-03-15');
  });

  it('날짜+시간 문자열도 날짜만 추출', () => {
    const date = new Date('2025-12-31T23:59:59.999Z');
    expect(formatDate(date)).toBe('2025-12-31');
  });
});

describe('calculateNights', () => {
  it('체크인~체크아웃 3박 계산', () => {
    const checkIn = new Date('2025-03-15');
    const checkOut = new Date('2025-03-18');
    expect(calculateNights(checkIn, checkOut)).toBe(3);
  });

  it('1박 계산', () => {
    const checkIn = new Date('2025-04-01');
    const checkOut = new Date('2025-04-02');
    expect(calculateNights(checkIn, checkOut)).toBe(1);
  });

  it('같은 날짜는 0박', () => {
    const date = new Date('2025-05-10');
    expect(calculateNights(date, date)).toBe(0);
  });

  it('체크아웃이 체크인보다 앞서도 Math.abs로 처리', () => {
    const checkIn = new Date('2025-06-20');
    const checkOut = new Date('2025-06-18');
    expect(calculateNights(checkIn, checkOut)).toBe(2);
  });
});
