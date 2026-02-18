import { cookies } from 'next/headers';

import { parseSessionId, TRAVEL_SESSION_COOKIE_NAME } from '@/lib/session';

interface ExtractSessionIdOptions {
  bodySessionId?: unknown;
  headerSessionId?: unknown;
  generateIfMissing?: boolean;
}

/**
 * API route에서 sessionId를 일관되게 추출한다.
 * 우선순위: header -> body -> cookie -> generate
 * (클라이언트가 명시적으로 보낸 값이 쿠키보다 우선)
 */
export async function extractSessionIdFromRequest(options: ExtractSessionIdOptions = {}): Promise<string | null> {
  const cookieStore = await cookies();
  const headerSessionId = parseSessionId(options.headerSessionId);
  const bodySessionId = parseSessionId(options.bodySessionId);
  const cookieSessionId = parseSessionId(cookieStore.get(TRAVEL_SESSION_COOKIE_NAME)?.value);

  const sessionId = headerSessionId ?? bodySessionId ?? cookieSessionId;
  if (sessionId) {
    return sessionId;
  }

  if (!options.generateIfMissing) {
    return null;
  }

  return crypto.randomUUID();
}
