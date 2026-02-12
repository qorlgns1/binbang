import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, normalizeLocale } from './locale';

describe('SUPPORTED_LOCALES', () => {
  it('ko와 en을 포함한다', () => {
    expect(SUPPORTED_LOCALES).toContain('ko');
    expect(SUPPORTED_LOCALES).toContain('en');
  });

  it('정확히 2개의 locale을 갖는다', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(2);
  });
});

describe('DEFAULT_LOCALE', () => {
  it('ko이다', () => {
    expect(DEFAULT_LOCALE).toBe('ko');
  });

  it('SUPPORTED_LOCALES에 포함된다', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });
});

describe('isSupportedLocale', () => {
  it.each(['ko', 'en'])('%s → true', (lang) => {
    expect(isSupportedLocale(lang)).toBe(true);
  });

  it.each(['ja', 'fr', 'zh', 'KO', 'EN', '', 'ko-KR', 'en-US'])('%s → false', (lang) => {
    expect(isSupportedLocale(lang)).toBe(false);
  });
});

describe('normalizeLocale', () => {
  it('유효한 locale은 그대로 반환한다', () => {
    expect(normalizeLocale('ko')).toBe('ko');
    expect(normalizeLocale('en')).toBe('en');
  });

  it('유효하지 않은 문자열은 DEFAULT_LOCALE을 반환한다', () => {
    expect(normalizeLocale('ja')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('')).toBe(DEFAULT_LOCALE);
  });

  it('null은 DEFAULT_LOCALE을 반환한다', () => {
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it('undefined는 DEFAULT_LOCALE을 반환한다', () => {
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});
