/**
 * Namespace slicing — pathname 기반 최소 namespace 결정.
 *
 * public [lang] layout은 클라이언트 라우팅에서 재사용되므로,
 * login/signup에서 사용하는 auth를 base에 포함해 키 노출(fallback)을 방지한다.
 * PublicHeader가 common/landing/pricing을 무조건 사용하므로,
 * public 라우트의 기본(base)은 common/landing/pricing/auth 이고, 페이지별로 legal 등만 추가한다.
 * app 라우트는 common만 로드한다.
 */

/** 모든 public 라우트의 기본 namespace (PublicHeader가 사용) */
const PUBLIC_BASE = ['common', 'landing', 'pricing', 'auth'] as const;

/** 모든 namespace (fallback용) */
const ALL_NAMESPACES = [
  'common',
  'landing',
  'legal',
  'auth',
  'pricing',
  'faq',
  'about',
  'availability',
  'chat',
  'destinations',
  'place',
  'weather',
  'exchange',
] as const;

/** Public pathname의 locale prefix + 첫 세그먼트만 캡처 (하위 경로 무시) */
const LOCALE_PREFIX_REGEX = /^\/(ko|en|ja|zh-CN|es-419)(?:\/([^/]*))?(?:\/.*)?$/;

/**
 * pathname에서 locale prefix 뒤의 첫 번째 segment만 추출한다.
 *
 * @example "/ko/pricing" → "pricing"
 * @example "/en" → ""
 * @example "/ja/signup" → "signup"
 * @example "/ja/login/reset" → "login" (첫 세그먼트만)
 * @example "/dashboard" → null (locale prefix 없음)
 */
function extractPublicSegment(pathname: string): string | null {
  const match = pathname.match(LOCALE_PREFIX_REGEX);
  if (!match) return null;
  return match[2] ?? '';
}

/**
 * pathname으로부터 필요한 namespace 목록을 결정한다.
 *
 * @param pathname - 요청 경로 (예: "/ko/pricing", "/dashboard")
 * @returns 로드해야 할 namespace 배열
 */
export function getNamespacesForPathname(pathname: string): readonly string[] {
  const segment = extractPublicSegment(pathname);

  // locale prefix가 없는 경로 → app 라우트
  if (segment === null) return ['common'];

  // public 라우트: 페이지별 추가 namespace
  switch (segment) {
    case '':
    case 'pricing':
      return PUBLIC_BASE;
    case 'faq':
      return [...PUBLIC_BASE, 'faq'];
    case 'about':
      return [...PUBLIC_BASE, 'about'];
    case 'availability':
      return [...PUBLIC_BASE, 'availability'];
    case 'login':
    case 'signup':
      return PUBLIC_BASE;
    case 'terms':
    case 'privacy':
      return [...PUBLIC_BASE, 'legal'];
    case 'chat':
      return [...PUBLIC_BASE, 'chat', 'place', 'weather', 'exchange'];
    case 'destinations':
      return [...PUBLIC_BASE, 'destinations'];
    default:
      return PUBLIC_BASE;
  }
}

/** pathname을 결정할 수 없을 때 사용하는 전체 namespace 목록 */
export function getAllNamespaces(): readonly string[] {
  return ALL_NAMESPACES;
}
