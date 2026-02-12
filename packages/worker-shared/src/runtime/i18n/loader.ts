/**
 * Worker i18n 메시지 로더.
 *
 * `packages/worker-shared/messages/{locale}/{namespace}.json`에서 메시지를 읽는다.
 * Node.js fs 기반 + 인메모리 캐시.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type Locale, createI18n } from '@workspace/shared/i18n';
import type { I18nInstance } from '@workspace/shared/i18n';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(__dirname, '..', '..', '..', 'messages');

const cache = new Map<string, Record<string, unknown>>();

/**
 * 단일 namespace의 메시지를 로드한다 (캐시 우선).
 */
export function loadWorkerMessages(locale: Locale, namespace: string): Record<string, unknown> {
  const key = `${locale}:${namespace}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const filePath = join(MESSAGES_DIR, locale, `${namespace}.json`);
  const raw = readFileSync(filePath, 'utf-8');
  const messages = JSON.parse(raw) as Record<string, unknown>;
  cache.set(key, messages);
  return messages;
}

/**
 * Worker용 i18n 인스턴스를 생성한다.
 *
 * @param locale - 사용할 locale
 * @param namespaces - 로드할 namespace 목록 (기본: ['notification'])
 */
export function createWorkerI18n(locale: Locale, namespaces: string[] = ['notification']): I18nInstance {
  const messages: Record<string, unknown> = {};
  for (const ns of namespaces) {
    messages[ns] = loadWorkerMessages(locale, ns);
  }

  return createI18n({
    locale,
    messages,
    missingKeyPolicy: 'fallback',
  });
}

/** 테스트용: 캐시 초기화 */
export function clearMessageCache(): void {
  cache.clear();
}
