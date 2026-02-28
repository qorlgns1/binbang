import { timingSafeEqual } from 'node:crypto';

/**
 * Internal API 요청을 인증한다.
 *
 * - production: BINBANG_INTERNAL_API_TOKEN 필수. 미설정 시 503.
 * - non-production: BINBANG_INTERNAL_API_TOKEN이 설정되어 있으면 검증, 미설정 시 통과.
 *   → staging 배포 시 반드시 토큰을 설정해야 보호됨.
 * - 토큰 비교에 timingSafeEqual을 사용하여 타이밍 공격을 방지한다.
 */
export function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
  const internalToken = process.env.BINBANG_INTERNAL_API_TOKEN?.trim();
  if (!internalToken) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, message: 'BINBANG_INTERNAL_API_TOKEN is not configured' };
    }
    // development 환경에서 토큰 미설정 시 허용 (로컬 개발 편의)
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
