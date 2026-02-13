import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, mapToSupportedLocale, normalizeLocale } from './locale';

const ALL_LOCALES = ['ko', 'en', 'ja', 'zh-CN', 'es-419'] as const;

describe('SUPPORTED_LOCALES', () => {
  it('1차 지원 5개 locale을 포함한다', () => {
    for (const lang of ALL_LOCALES) {
      expect(SUPPORTED_LOCALES).toContain(lang);
    }
  });

  it('정확히 5개의 locale을 갖는다', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(5);
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
  it.each(ALL_LOCALES)('%s → true', (lang) => {
    expect(isSupportedLocale(lang)).toBe(true);
  });

  it.each(['fr', 'zh', 'es', 'KO', 'EN', '', 'ko-KR', 'en-US'])('%s → false', (lang) => {
    expect(isSupportedLocale(lang)).toBe(false);
  });
});

describe('mapToSupportedLocale', () => {
  it('지원 locale은 그대로 반환한다', () => {
    for (const lang of ALL_LOCALES) {
      expect(mapToSupportedLocale(lang)).toBe(lang);
    }
  });

  it('zh-* → zh-CN으로 매핑한다', () => {
    expect(mapToSupportedLocale('zh')).toBe('zh-CN');
    expect(mapToSupportedLocale('zh-CN')).toBe('zh-CN');
    expect(mapToSupportedLocale('zh-TW')).toBe('zh-CN');
    expect(mapToSupportedLocale('ZH')).toBe('zh-CN');
  });

  it('es-* → es-419로 매핑한다', () => {
    expect(mapToSupportedLocale('es')).toBe('es-419');
    expect(mapToSupportedLocale('es-419')).toBe('es-419');
    expect(mapToSupportedLocale('es-ES')).toBe('es-419');
  });

  it('매핑 불가 시 null', () => {
    expect(mapToSupportedLocale('fr')).toBeNull();
    expect(mapToSupportedLocale('')).toBeNull();
    expect(mapToSupportedLocale(null)).toBeNull();
    expect(mapToSupportedLocale(undefined)).toBeNull();
  });
});

describe('normalizeLocale', () => {
  it('유효한 locale은 그대로 반환한다', () => {
    for (const lang of ALL_LOCALES) {
      expect(normalizeLocale(lang)).toBe(lang);
    }
  });

  it('raw zh/es는 매핑 후 반환한다', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN');
    expect(normalizeLocale('es')).toBe('es-419');
  });

  it('유효하지 않은 문자열은 DEFAULT_LOCALE을 반환한다', () => {
    expect(normalizeLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('')).toBe(DEFAULT_LOCALE);
  });

  it('null/undefined는 DEFAULT_LOCALE을 반환한다', () => {
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});
