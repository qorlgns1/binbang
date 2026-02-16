import { describe, expect, it } from 'vitest';

import { addUtcDays, endOfUtcDay, MS_PER_DAY, startOfUtcDay } from './date';

describe('MS_PER_DAY', () => {
  it('하루는 86,400,000 밀리초', () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
    expect(MS_PER_DAY).toBe(86_400_000);
  });
});

describe('startOfUtcDay', () => {
  it('UTC 기준 하루의 시작 시각 반환', () => {
    const input = new Date('2026-02-15T14:30:45.123Z');
    const result = startOfUtcDay(input);

    expect(result.toISOString()).toBe('2026-02-15T00:00:00.000Z');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('원본 객체를 변경하지 않음', () => {
    const input = new Date('2026-02-15T14:30:45.123Z');
    const original = input.toISOString();
    startOfUtcDay(input);

    expect(input.toISOString()).toBe(original);
  });
});

describe('endOfUtcDay', () => {
  it('UTC 기준 하루의 마지막 시각 반환', () => {
    const input = new Date('2026-02-15T14:30:45.123Z');
    const result = endOfUtcDay(input);

    expect(result.toISOString()).toBe('2026-02-15T23:59:59.999Z');
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('원본 객체를 변경하지 않음', () => {
    const input = new Date('2026-02-15T14:30:45.123Z');
    const original = input.toISOString();
    endOfUtcDay(input);

    expect(input.toISOString()).toBe(original);
  });
});

describe('addUtcDays', () => {
  it('양수 일수 추가', () => {
    const input = new Date('2026-02-15T12:00:00.000Z');
    const result = addUtcDays(input, 3);

    expect(result.toISOString()).toBe('2026-02-18T12:00:00.000Z');
  });

  it('음수 일수 추가 (과거)', () => {
    const input = new Date('2026-02-15T12:00:00.000Z');
    const result = addUtcDays(input, -7);

    expect(result.toISOString()).toBe('2026-02-08T12:00:00.000Z');
  });

  it('0일 추가는 동일 시각', () => {
    const input = new Date('2026-02-15T12:00:00.000Z');
    const result = addUtcDays(input, 0);

    expect(result.getTime()).toBe(input.getTime());
  });

  it('월/년 경계 처리', () => {
    const input = new Date('2026-01-30T12:00:00.000Z');
    const result = addUtcDays(input, 5);

    expect(result.toISOString()).toBe('2026-02-04T12:00:00.000Z');
  });

  it('원본 객체를 변경하지 않음', () => {
    const input = new Date('2026-02-15T12:00:00.000Z');
    const original = input.toISOString();
    addUtcDays(input, 10);

    expect(input.toISOString()).toBe(original);
  });
});
