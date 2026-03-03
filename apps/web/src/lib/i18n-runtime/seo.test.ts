import { describe, expect, it } from 'vitest';

import { buildPublicAlternates } from './seo';

describe('buildPublicAlternates', () => {
  it('builds canonical and language alternates with ko as unprefixed default', () => {
    const result = buildPublicAlternates('ko', '/availability');

    expect(result.canonical.endsWith('/availability')).toBe(true);
    expect(result.languages.ko.endsWith('/availability')).toBe(true);
    expect(result.languages.en.endsWith('/en/availability')).toBe(true);
  });

  it('builds canonical for english with prefixed path', () => {
    const result = buildPublicAlternates('en', '/availability');

    expect(result.canonical.endsWith('/en/availability')).toBe(true);
    expect(result.languages.ko.endsWith('/availability')).toBe(true);
  });
});
