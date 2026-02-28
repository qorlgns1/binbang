import { timingSafeEqual } from 'node:crypto';

/**
 * Internal API 요청을 인증한다.
 *
 * - production 또는 APP_ENV가 local/development 이외인 경우: BINBANG_INTERNAL_API_TOKEN 필수.
 *   미설정 시 503. (staging 등 인터넷 노출 환경 보호)
 * - APP_ENV=local/development 또는 APP_ENV 미설정(로컬): 토큰 미설정 시 통과.
 * - 토큰 비교에 timingSafeEqual을 사용하여 타이밍 공격을 방지한다.
 */
export function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
  const internalToken = process.env.BINBANG_INTERNAL_API_TOKEN?.trim();
  if (!internalToken) {
    const appEnv = process.env.APP_ENV;
    const isLocalDev = !appEnv || appEnv === 'local' || appEnv === 'development';
    if (process.env.NODE_ENV === 'production' || !isLocalDev) {
      return { ok: false, status: 503, message: 'BINBANG_INTERNAL_API_TOKEN is not configured' };
    }
    // APP_ENV=local/development 또는 미설정 환경에서 토큰 미설정 시 허용 (로컬 개발 편의)
    return { ok: true };
  }

  const provided = req.headers.get('x-binbang-internal-token')?.trim();
  if (!provided) {
    return { ok: false, status: 401, message: 'invalid internal token' };
  }

  // 길이가 다르면 timingSafeEqual이 throw 하므로 길이 먼저 확인
  const expectedBuf = Buffer.from(internalToken, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    return { ok: false, status: 401, message: 'invalid internal token' };
  }

  return { ok: true };
}
