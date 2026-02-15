import { describe, expect, it } from 'vitest';

import { KST_TIMEZONE, formatKstDateTime } from './formatKst';

describe('formatKstDateTime', () => {
  it('forces Asia/Seoul timezone conversion at UTC boundary', () => {
    expect(formatKstDateTime('2026-02-14T00:00:00.000Z')).toBe('2026-02-14 09:00');
  });

  it('converts UTC end-of-day into next KST date when needed', () => {
    expect(formatKstDateTime('2026-02-13T23:59:00.000Z')).toBe('2026-02-14 08:59');
  });

  it('supports date-only display with the same timezone rule', () => {
    expect(formatKstDateTime('2026-02-13T23:59:00.000Z', { withTime: false })).toBe('2026-02-14');
  });

  it('exposes fixed display timezone constant', () => {
    expect(KST_TIMEZONE).toBe('Asia/Seoul');
  });

  it('throws on invalid date input', () => {
    expect(() => formatKstDateTime('not-a-date')).toThrowError('Invalid date value');
  });
});
