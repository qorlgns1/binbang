import { describe, expect, it } from 'vitest';

import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from './format';

// 테스트 기준 날짜: 2026-02-12T13:30:00 KST
const testDate = new Date('2026-02-12T04:30:00Z'); // UTC → KST: 13:30

describe('formatDate', () => {
  describe('date.short', () => {
    it('ko: 날짜를 숫자 형식으로 포맷한다', () => {
      const result = formatDate('ko', testDate, 'date.short');
      expect(result).toContain('2026');
      expect(result).toContain('02');
      expect(result).toContain('12');
    });

    it('en: 날짜를 숫자 형식으로 포맷한다', () => {
      const result = formatDate('en', testDate, 'date.short');
      expect(result).toContain('2026');
      expect(result).toContain('02');
      expect(result).toContain('12');
    });
  });

  describe('date.long', () => {
    it('ko: 한국어 월 이름을 포함한다', () => {
      const result = formatDate('ko', testDate, 'date.long');
      expect(result).toContain('2월');
      expect(result).toContain('12');
    });

    it('en: 영어 월 이름을 포함한다', () => {
      const result = formatDate('en', testDate, 'date.long');
      expect(result).toContain('February');
      expect(result).toContain('12');
    });
  });

  describe('dateTime.short', () => {
    it('시간을 포함한다', () => {
      const result = formatDate('ko', testDate, 'dateTime.short');
      expect(result).toContain('2026');
      expect(result).toContain('30');
      // 12시간제(오후 01:30) 또는 24시간제(13:30) 모두 허용
      expect(result).toMatch(/13|01/);
    });
  });

  describe('timeZone', () => {
    it('커스텀 타임존을 사용할 수 있다', () => {
      const result = formatDate('en', testDate, 'date.short', 'America/New_York');
      // UTC 04:30 → EST: 2026-02-11 23:30
      expect(result).toContain('11');
    });
  });

  describe('결정적 출력', () => {
    it('동일 입력 시 동일 출력을 보장한다', () => {
      const a = formatDate('ko', testDate, 'date.short');
      const b = formatDate('ko', testDate, 'date.short');
      expect(a).toBe(b);
    });
  });
});

describe('formatNumber', () => {
  describe('number.standard', () => {
    it('ko: 천 단위 구분 포맷', () => {
      const result = formatNumber('ko', 1234567);
      expect(result).toContain('1,234,567');
    });

    it('en: 천 단위 구분 포맷', () => {
      const result = formatNumber('en', 1234567);
      expect(result).toContain('1,234,567');
    });
  });

  describe('number.compact', () => {
    it('ko: 축약 표기', () => {
      const result = formatNumber('ko', 1500, 'number.compact');
      expect(result).toBeTruthy();
    });

    it('en: 축약 표기 (1.5K)', () => {
      const result = formatNumber('en', 1500, 'number.compact');
      expect(result).toContain('1.5K');
    });
  });

  describe('number.precise', () => {
    it('소수점 2자리까지 표기', () => {
      const result = formatNumber('en', 1234.5, 'number.precise');
      expect(result).toContain('1,234.50');
    });
  });

  describe('결정적 출력', () => {
    it('동일 입력 시 동일 출력을 보장한다', () => {
      const a = formatNumber('ko', 9999, 'number.standard');
      const b = formatNumber('ko', 9999, 'number.standard');
      expect(a).toBe(b);
    });
  });
});

describe('formatCurrency', () => {
  describe('currency.krw', () => {
    it('ko: 원화 기호로 포맷', () => {
      const result = formatCurrency('ko', 150000, 'currency.krw');
      expect(result).toContain('₩');
      expect(result).toContain('150,000');
    });

    it('소수점 없이 표시한다', () => {
      const result = formatCurrency('ko', 150000.99, 'currency.krw');
      expect(result).not.toContain('.');
    });
  });

  describe('currency.usd', () => {
    it('en: 달러 기호로 포맷', () => {
      const result = formatCurrency('en', 99.99, 'currency.usd');
      expect(result).toContain('$');
      expect(result).toContain('99.99');
    });
  });

  describe('currency.eur', () => {
    it('유로 기호로 포맷', () => {
      const result = formatCurrency('en', 1234.56, 'currency.eur');
      expect(result).toContain('€');
    });
  });
});

describe('formatRelativeTime', () => {
  it('ko: 과거 시간 표현', () => {
    const result = formatRelativeTime('ko', -1, 'day');
    expect(result).toBe('어제');
  });

  it('ko: 미래 시간 표현', () => {
    const result = formatRelativeTime('ko', 1, 'day');
    expect(result).toBe('내일');
  });

  it('en: 과거 시간 표현', () => {
    const result = formatRelativeTime('en', -1, 'day');
    expect(result).toBe('yesterday');
  });

  it('en: 미래 시간 표현', () => {
    const result = formatRelativeTime('en', 1, 'day');
    expect(result).toBe('tomorrow');
  });

  it('ko: 숫자 상대시간', () => {
    const result = formatRelativeTime('ko', -3, 'hour');
    expect(result).toContain('3시간 전');
  });

  it('en: 숫자 상대시간', () => {
    const result = formatRelativeTime('en', -3, 'hour');
    expect(result).toContain('3 hours ago');
  });
});
