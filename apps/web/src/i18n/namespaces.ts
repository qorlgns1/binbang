/**
 * Namespace slicing — route group별 최소 메시지 로딩.
 *
 * 메시지 파일: `apps/web/messages/{locale}/{namespace}.json`
 * 각 route group은 필요한 namespace만 선언적으로 매핑하여 번들 크기를 최소화한다.
 *
 * @example
 * const messages = await getRequestMessages('ko', '(public)');
 * // → { common: {...}, landing: {...} }
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Locale, Messages } from '@workspace/shared/i18n';

/** Route group → namespace 매핑 (선언적 관리) */
const ROUTE_NAMESPACES: Record<string, readonly string[]> = {
  '(public)': ['common', 'landing'],
  '(app)': ['common', 'app'],
  admin: ['common', 'admin'],
};

const DEFAULT_NAMESPACES: readonly string[] = ['common'];

/**
 * Route group에 필요한 namespace 목록을 반환한다.
 *
 * @param routeGroup - Next.js route group명 (예: "(public)", "(app)", "admin")
 * @returns 해당 route group에 필요한 namespace 배열
 */
export function getNamespacesForRoute(routeGroup: string): readonly string[] {
  return ROUTE_NAMESPACES[routeGroup] ?? DEFAULT_NAMESPACES;
}

/**
 * 지정된 namespace의 메시지 JSON을 로드한다.
 *
 * @param locale - 로드할 locale
 * @param ns - namespace명 (파일명)
 * @returns 메시지 객체
 */
async function loadNamespace(locale: Locale, ns: string): Promise<Record<string, unknown>> {
  const filePath = join(process.cwd(), 'messages', locale, `${ns}.json`);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * 여러 namespace의 메시지를 병렬 로드하여 하나의 Messages 객체로 합친다.
 *
 * @param locale - 로드할 locale
 * @param namespaces - 로드할 namespace 목록
 * @returns namespace를 키로 하는 메시지 객체
 */
export async function loadMessages(locale: Locale, namespaces: readonly string[]): Promise<Messages> {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const messages = await loadNamespace(locale, ns);
      return [ns, messages] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/**
 * Route group 기반으로 필요한 namespace만 로드한다.
 *
 * @param locale - 로드할 locale
 * @param routeGroup - Next.js route group명
 * @returns namespace를 키로 하는 메시지 객체 (필요한 namespace만 포함)
 *
 * @example
 * // (public) 그룹: common + landing만 로드
 * const messages = await getRequestMessages('ko', '(public)');
 * // { common: { brand: "Binbang", ... }, landing: { hero: {...}, ... } }
 */
export async function getRequestMessages(locale: Locale, routeGroup: string): Promise<Messages> {
  const namespaces = getNamespacesForRoute(routeGroup);
  return loadMessages(locale, namespaces);
}
