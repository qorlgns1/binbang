import { describe, expect, it } from 'vitest';

import { buildUtcFilterFromRange } from './date-filter';

describe('buildUtcFilterFromRange', () => {
  const now = new Date('2026-02-14T12:34:56.000Z');

  it('builds today filter with UTC ISO boundaries', () => {
    const result = buildUtcFilterFromRange('today', now);

    expect(result).toEqual({
      range: 'today',
      from: '2026-02-14T00:00:00.000Z',
      to: '2026-02-14T23:59:59.999Z',
    });
  });

  it('builds 7d and 30d filters with UTC day boundaries', () => {
    const sevenDays = buildUtcFilterFromRange('7d', now);
    const thirtyDays = buildUtcFilterFromRange('30d', now);

    expect(sevenDays.from).toBe('2026-02-08T00:00:00.000Z');
    expect(thirtyDays.from).toBe('2026-01-16T00:00:00.000Z');
    expect(sevenDays.to).toBe('2026-02-14T23:59:59.999Z');
    expect(thirtyDays.to).toBe('2026-02-14T23:59:59.999Z');
  });

  it('builds all-range filter without synthetic boundaries', () => {
    const result = buildUtcFilterFromRange('all', now);

    expect(result).toEqual({
      range: 'all',
    });
  });
});
