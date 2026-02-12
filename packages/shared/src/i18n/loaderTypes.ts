/**
 * i18n Core — Loader 인터페이스
 *
 * 코어는 "메시지를 어디서 가져오는지" 모른다.
 * 런타임 어댑터(Web/Worker)가 이 인터페이스를 구현해 메시지를 주입한다.
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */
import type { Locale } from './locale';

/** 메시지 카탈로그: namespace를 키로, 중첩 가능한 메시지 객체를 값으로 갖는다 */
export type Messages = Record<string, unknown>;

/**
 * 메시지 로더 인터페이스.
 *
 * 런타임 어댑터가 구현한다 (Web: JSON import, Worker: fs + 캐시 등).
 * 코어는 이 인터페이스만 의존한다.
 */
export interface MessageLoader {
  /**
   * 지정된 locale과 namespace 목록에 대한 메시지를 로드한다.
   *
   * @param locale - 로드할 locale
   * @param namespaces - 로드할 namespace 목록
   * @returns namespace를 키로 하는 메시지 객체
   */
  loadMessages(locale: Locale, namespaces: readonly string[]): Promise<Messages> | Messages;
}

/** missing-key 발생 시 동작 정책 */
export type MissingKeyPolicy = 'error' | 'fallback';

/** createI18n 옵션 */
export interface I18nOptions {
  /** 현재 locale */
  locale: Locale;
  /** 로드된 메시지 (namespace → 중첩 메시지 객체) */
  messages: Messages;
  /** 폴백 locale의 메시지 (누락 키 발생 시 사용, MissingKeyPolicy가 'fallback'일 때) */
  fallbackMessages?: Messages;
  /** missing-key 정책. Dev/CI: 'error', Prod: 'fallback' */
  missingKeyPolicy?: MissingKeyPolicy;
  /** missing-key 발생 시 호출되는 콜백 (관측/로깅용) */
  onMissingKey?: (locale: Locale, namespace: string, key: string) => void;
}
