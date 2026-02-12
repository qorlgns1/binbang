import { describe, expect, it, vi } from 'vitest';

import { createI18n } from './createI18n';
import { MissingKeyError } from './errors';

const koMessages = {
  common: {
    greeting: '안녕하세요, {name}님!',
    brand: '빈방',
  },
  auth: {
    login: {
      title: '로그인',
      submit: '로그인하기',
      welcome: '{name}님 환영합니다',
    },
  },
};

const enMessages = {
  common: {
    greeting: 'Hello, {name}!',
    brand: 'Binbang',
  },
  auth: {
    login: {
      title: 'Sign In',
      submit: 'Sign In',
      welcome: 'Welcome, {name}',
    },
  },
};

describe('createI18n', () => {
  describe('기본 key 조회', () => {
    it('단순 key를 조회한다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      expect(t('brand')).toBe('빈방');
    });

    it('중첩 key를 dot-separated로 조회한다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('auth');
      expect(t('login.title')).toBe('로그인');
      expect(t('login.submit')).toBe('로그인하기');
    });

    it('locale을 올바르게 반환한다', () => {
      const i18n = createI18n({ locale: 'en', messages: enMessages });
      expect(i18n.locale).toBe('en');
    });
  });

  describe('파라미터 치환', () => {
    it('{name} 패턴을 치환한다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      expect(t('greeting', { name: '마르코' })).toBe('안녕하세요, 마르코님!');
    });

    it('숫자 파라미터를 문자열로 변환한다', () => {
      const messages = { ns: { count: '총 {count}건' } };
      const i18n = createI18n({ locale: 'ko', messages });
      expect(i18n.t('ns')('count', { count: 42 })).toBe('총 42건');
    });

    it('존재하지 않는 파라미터는 원본 {param}을 유지한다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      expect(t('greeting')).toBe('안녕하세요, {name}님!');
    });

    it('파라미터 없이 호출해도 동작한다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      expect(t('brand')).toBe('빈방');
    });
  });

  describe('missing-key 정책: error (기본)', () => {
    it('존재하지 않는 key에 MissingKeyError를 던진다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      expect(() => t('nonexistent')).toThrow(MissingKeyError);
    });

    it('존재하지 않는 namespace에 MissingKeyError를 던진다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('unknown');
      expect(() => t('any.key')).toThrow(MissingKeyError);
    });

    it('MissingKeyError에 locale, namespace, key가 포함된다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const t = i18n.t('common');
      try {
        t('missing');
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MissingKeyError);
        const err = e as MissingKeyError;
        expect(err.locale).toBe('ko');
        expect(err.namespace).toBe('common');
        expect(err.key).toBe('missing');
      }
    });
  });

  describe('missing-key 정책: fallback', () => {
    it('누락 시 namespace:key 형태로 반환한다', () => {
      const i18n = createI18n({
        locale: 'ko',
        messages: koMessages,
        missingKeyPolicy: 'fallback',
      });
      const t = i18n.t('common');
      expect(t('nonexistent')).toBe('common:nonexistent');
    });

    it('onMissingKey 콜백이 호출된다', () => {
      const onMissingKey = vi.fn();
      const i18n = createI18n({
        locale: 'en',
        messages: enMessages,
        missingKeyPolicy: 'fallback',
        onMissingKey,
      });
      i18n.t('common')('missing.key');
      expect(onMissingKey).toHaveBeenCalledWith('en', 'common', 'missing.key');
    });

    it('error 정책에서도 onMissingKey 콜백이 호출된다', () => {
      const onMissingKey = vi.fn();
      const i18n = createI18n({
        locale: 'ko',
        messages: koMessages,
        missingKeyPolicy: 'error',
        onMissingKey,
      });
      expect(() => i18n.t('common')('missing')).toThrow();
      expect(onMissingKey).toHaveBeenCalledWith('ko', 'common', 'missing');
    });
  });

  describe('fallbackMessages', () => {
    it('현재 locale에 없는 key를 fallback에서 찾는다', () => {
      const partial = { common: { brand: '빈방' } };
      const i18n = createI18n({
        locale: 'ko',
        messages: partial,
        fallbackMessages: koMessages,
      });
      expect(i18n.t('common')('greeting', { name: '테스트' })).toBe('안녕하세요, 테스트님!');
    });

    it('fallback에도 없으면 정책에 따라 동작한다', () => {
      const empty = {};
      const i18n = createI18n({
        locale: 'ko',
        messages: empty,
        fallbackMessages: { common: {} },
        missingKeyPolicy: 'fallback',
      });
      expect(i18n.t('common')('nonexistent')).toBe('common:nonexistent');
    });
  });

  describe('다른 namespace 독립 사용', () => {
    it('서로 다른 namespace의 t()가 독립적이다', () => {
      const i18n = createI18n({ locale: 'ko', messages: koMessages });
      const tCommon = i18n.t('common');
      const tAuth = i18n.t('auth');
      expect(tCommon('brand')).toBe('빈방');
      expect(tAuth('login.title')).toBe('로그인');
    });
  });
});
