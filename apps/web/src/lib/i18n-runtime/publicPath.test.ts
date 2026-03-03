import { describe, expect, it } from 'vitest';

import { buildPublicPath, stripLocalePrefix } from './publicPath';

describe('buildPublicPath', () => {
  it('uses no locale prefix for default ko locale', () => {
    expect(buildPublicPath('ko', '/availability')).toBe('/availability');
    expect(buildPublicPath('ko', '/')).toBe('/');
  });

  it('uses locale prefix for non-default locales', () => {
    expect(buildPublicPath('en', '/availability')).toBe('/en/availability');
    expect(buildPublicPath('en', '/')).toBe('/en');
  });
});

describe('stripLocalePrefix', () => {
  it('strips locale prefix and returns normalized path', () => {
    expect(stripLocalePrefix('/ko/availability')).toEqual({ locale: 'ko', pathname: '/availability' });
    expect(stripLocalePrefix('/en')).toEqual({ locale: 'en', pathname: '/' });
  });

  it('keeps non-prefixed path intact', () => {
    expect(stripLocalePrefix('/availability')).toEqual({ locale: null, pathname: '/availability' });
  });
});
