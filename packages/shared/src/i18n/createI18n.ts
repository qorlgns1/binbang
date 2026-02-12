/**
 * i18n Core — createI18n / t() 구현
 *
 * key 조회, 파라미터 치환({name} 패턴), missing-key 정책.
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */
import { MissingKeyError } from './errors.ts';
import type { I18nOptions } from './loaderTypes.ts';

/** t() 함수 시그니처 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/** createI18n 반환 타입 */
export interface I18nInstance {
  /** 현재 locale */
  readonly locale: string;
  /** namespace 지정 번역 함수 생성 */
  t: (namespace: string) => TranslateFunction;
}

/**
 * 중첩된 메시지 객체에서 dot-separated key로 값을 조회한다.
 *
 * @example
 * getNestedValue({ login: { title: "로그인" } }, "login.title") // "로그인"
 */
function getNestedValue(obj: unknown, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * 메시지 문자열에서 {param} 패턴을 치환한다.
 *
 * @example
 * interpolate("Hello, {name}!", { name: "World" }) // "Hello, World!"
 */
function interpolate(message: string, params: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (match, paramName: string) => {
    const value = params[paramName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * i18n 인스턴스를 생성한다.
 *
 * @param options - locale, messages, missingKeyPolicy 등
 * @returns t() 함수를 포함한 i18n 인스턴스
 */
export function createI18n(options: I18nOptions): I18nInstance {
  const { locale, messages, fallbackMessages, missingKeyPolicy = 'error', onMissingKey } = options;

  function t(namespace: string): TranslateFunction {
    return (key: string, params?: Record<string, string | number>): string => {
      const nsMessages = messages[namespace];
      let value = getNestedValue(nsMessages, key);

      // 현재 locale에 없으면 fallback 시도
      if (value === undefined && fallbackMessages) {
        const fallbackNs = fallbackMessages[namespace];
        value = getNestedValue(fallbackNs, key);
      }

      if (value === undefined) {
        onMissingKey?.(locale, namespace, key);

        if (missingKeyPolicy === 'error') {
          throw new MissingKeyError(locale, namespace, key);
        }

        // fallback 정책: key 자체를 반환
        return `${namespace}:${key}`;
      }

      if (typeof value !== 'string') {
        // 중첩 객체/배열은 문자열이 아니므로 key를 반환
        return `${namespace}:${key}`;
      }

      return params ? interpolate(value, params) : value;
    };
  }

  return {
    locale,
    t,
  };
}
