import { describe, expect, it } from 'vitest';

import {
  buildAvailabilityDetailMeta,
  buildAvailabilityListMeta,
  buildAvailabilityRegionMeta,
} from './availabilityMeta';

describe('availabilityMeta helpers', () => {
  it('builds ko detail metadata with expected length constraints', () => {
    const meta = buildAvailabilityDetailMeta({
      locale: 'ko',
      propertyName: '제주 오션뷰 풀빌라',
      platformLabel: '에어비앤비',
      locationLabel: '제주',
    });

    expect(meta.title.length).toBeGreaterThanOrEqual(45);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.description.length).toBeGreaterThanOrEqual(110);
    expect(meta.description.length).toBeLessThanOrEqual(155);
  });

  it('falls back to indexable sentences when detail values are missing', () => {
    const meta = buildAvailabilityDetailMeta({
      locale: 'en',
      propertyName: '',
      platformLabel: '',
      locationLabel: '',
    });

    expect(meta.title).toContain('availability');
    expect(meta.description).toContain('Binbang');
  });

  it('builds list and region metadata without empty outputs', () => {
    const listMeta = buildAvailabilityListMeta({ locale: 'en' });
    const regionMeta = buildAvailabilityRegionMeta({
      locale: 'ko',
      regionName: '제주',
      platformLabel: '아고다',
      propertyCount: 12,
    });

    expect(listMeta.title.length).toBeGreaterThan(0);
    expect(listMeta.description.length).toBeGreaterThan(0);
    expect(regionMeta.title.length).toBeGreaterThan(0);
    expect(regionMeta.description.length).toBeGreaterThan(0);
  });
});
