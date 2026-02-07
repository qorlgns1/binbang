import { describe, expect, it } from 'vitest';

import { cn, formatDate, formatDateTime } from '@/lib/utils';

describe('cn', (): void => {
  it('여러 클래스를 병합', (): void => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('falsy 값 무시', (): void => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar');
  });

  it('조건부 클래스', (): void => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('Tailwind 충돌 클래스는 나중 값 우선', (): void => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('빈 입력은 빈 문자열', (): void => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', (): void => {
  it('Date 객체를 YYYY-MM-DD로 변환', (): void => {
    const date = new Date('2025-03-15T12:00:00.000Z');
    expect(formatDate(date)).toBe('2025-03-15');
  });

  it('ISO 문자열을 YYYY-MM-DD로 변환', (): void => {
    expect(formatDate('2025-06-20')).toBe('2025-06-20');
  });

  it('날짜+시간 문자열도 날짜만 추출', (): void => {
    expect(formatDate('2025-12-31T23:59:59.999Z')).toBe('2025-12-31');
  });
});

describe('formatDateTime', (): void => {
  it('Date 객체를 ko-KR 형식으로 변환', (): void => {
    const date = new Date('2025-01-15T09:30:00.000Z');
    const result = formatDateTime(date);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('2025');
    expect(result).toMatch(/\d/);
  });

  it('문자열 입력도 처리', (): void => {
    const result = formatDateTime('2025-07-04T14:00:00.000Z');

    expect(typeof result).toBe('string');
    expect(result).toContain('2025');
  });
});
