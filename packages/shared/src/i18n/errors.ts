/**
 * i18n Core — 에러 타입
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */

/** 번역 키가 메시지 카탈로그에 존재하지 않을 때 발생하는 에러 */
export class MissingKeyError extends Error {
  readonly locale: string;
  readonly namespace: string;
  readonly key: string;

  constructor(locale: string, namespace: string, key: string) {
    super(`[i18n] Missing key: ${namespace}:${key} (locale: ${locale})`);
    this.name = 'MissingKeyError';
    this.locale = locale;
    this.namespace = namespace;
    this.key = key;
  }
}

/** ICU 메시지 렌더링 중 파라미터 불일치 등으로 발생하는 에러 */
export class MessageFormatError extends Error {
  readonly locale: string;
  readonly namespace: string;
  readonly key: string;
  readonly cause: unknown;

  constructor(locale: string, namespace: string, key: string, cause: unknown) {
    super(`[i18n] Format error: ${namespace}:${key} (locale: ${locale})`);
    this.name = 'MessageFormatError';
    this.locale = locale;
    this.namespace = namespace;
    this.key = key;
    this.cause = cause;
  }
}
