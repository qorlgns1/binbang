import { describe, expect, it } from 'vitest';

import { formatBrowserLocalDateTime } from './formatBrowserLocal';

describe('formatBrowserLocalDateTime', () => {
  it('formats datetime with explicit timezone override', () => {
    expect(formatBrowserLocalDateTime('2026-02-14T00:00:00.000Z', { timeZone: 'Asia/Seoul' })).toBe('2026-02-14 09:00');
  });

  it('supports date-only output', () => {
    expect(
      formatBrowserLocalDateTime('2026-02-13T23:59:00.000Z', {
        withTime: false,
        timeZone: 'Asia/Seoul',
      }),
    ).toBe('2026-02-14');
  });

  it('throws on invalid input', () => {
    expect(() => formatBrowserLocalDateTime('invalid-date')).toThrowError('Invalid date value');
  });
});
