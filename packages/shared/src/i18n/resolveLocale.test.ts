import { describe, expect, it } from 'vitest';

import { resolveLocale } from './resolveLocale';

describe('resolveLocale', () => {
  describe('우선순위', () => {
    it('URL이 최우선이다', () => {
      const result = resolveLocale({
        url: 'en',
        userPreferredLocale: 'ko',
        cookie: 'ko',
        acceptLanguage: 'ko',
      });
      expect(result).toEqual({ locale: 'en', source: 'url' });
    });

    it('URL이 없으면 userProfile이 우선이다', () => {
      const result = resolveLocale({
        url: null,
        userPreferredLocale: 'en',
        cookie: 'ko',
        acceptLanguage: 'ko',
      });
      expect(result).toEqual({ locale: 'en', source: 'userProfile' });
    });

    it('URL, userProfile이 없으면 cookie가 우선이다', () => {
      const result = resolveLocale({
        url: null,
        userPreferredLocale: null,
        cookie: 'en',
        acceptLanguage: 'ko',
      });
      expect(result).toEqual({ locale: 'en', source: 'cookie' });
    });

    it('URL, userProfile, cookie가 없으면 acceptLanguage를 사용한다', () => {
      const result = resolveLocale({
        url: null,
        userPreferredLocale: null,
        cookie: null,
        acceptLanguage: 'en',
      });
      expect(result).toEqual({ locale: 'en', source: 'acceptLanguage' });
    });

    it('모든 소스가 없으면 default를 반환한다', () => {
      const result = resolveLocale({});
      expect(result).toEqual({ locale: 'ko', source: 'default' });
    });

    it('인자 없이 호출하면 default를 반환한다', () => {
      const result = resolveLocale();
      expect(result).toEqual({ locale: 'ko', source: 'default' });
    });
  });

  describe('무효한 값 건너뛰기', () => {
    it('URL이 지원하지 않는 locale이면 다음 소스로 넘어간다', () => {
      const result = resolveLocale({
        url: 'fr',
        userPreferredLocale: 'en',
      });
      expect(result).toEqual({ locale: 'en', source: 'userProfile' });
    });

    it('모든 소스가 무효하면 default를 반환한다', () => {
      const result = resolveLocale({
        url: 'fr',
        userPreferredLocale: 'zh',
        cookie: 'de',
        acceptLanguage: 'pt',
      });
      expect(result).toEqual({ locale: 'ko', source: 'default' });
    });

    it('빈 문자열은 무시한다', () => {
      const result = resolveLocale({
        url: '',
        userPreferredLocale: '',
        cookie: '',
        acceptLanguage: 'en',
      });
      expect(result).toEqual({ locale: 'en', source: 'acceptLanguage' });
    });

    it('undefined 값은 무시한다', () => {
      const result = resolveLocale({
        url: undefined,
        cookie: 'en',
      });
      expect(result).toEqual({ locale: 'en', source: 'cookie' });
    });
  });

  describe('각 소스 단독 테스트', () => {
    it('URL만 있는 경우', () => {
      expect(resolveLocale({ url: 'ko' })).toEqual({ locale: 'ko', source: 'url' });
      expect(resolveLocale({ url: 'en' })).toEqual({ locale: 'en', source: 'url' });
      expect(resolveLocale({ url: 'ja' })).toEqual({ locale: 'ja', source: 'url' });
      expect(resolveLocale({ url: 'zh-CN' })).toEqual({ locale: 'zh-CN', source: 'url' });
      expect(resolveLocale({ url: 'es-419' })).toEqual({ locale: 'es-419', source: 'url' });
    });

    it('userPreferredLocale만 있는 경우', () => {
      expect(resolveLocale({ userPreferredLocale: 'en' })).toEqual({ locale: 'en', source: 'userProfile' });
      expect(resolveLocale({ userPreferredLocale: 'ja' })).toEqual({ locale: 'ja', source: 'userProfile' });
    });

    it('cookie만 있는 경우', () => {
      expect(resolveLocale({ cookie: 'en' })).toEqual({ locale: 'en', source: 'cookie' });
    });

    it('acceptLanguage만 있는 경우', () => {
      expect(resolveLocale({ acceptLanguage: 'en' })).toEqual({ locale: 'en', source: 'acceptLanguage' });
      expect(resolveLocale({ acceptLanguage: 'zh-CN' })).toEqual({ locale: 'zh-CN', source: 'acceptLanguage' });
    });
  });
});
