import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { forbiddenResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { cleanupE2eUserById } from '@/services/e2e-cleanup.service';

const E2E_EMAIL_PREFIX = 'e2e.';
const E2E_EMAIL_SUFFIX = '@example.com';

/**
 * 현재 로그인 사용자 이메일이 E2E 전용 계정 패턴인지 검증한다.
 *
 * 보안 목적:
 * - 테스트 API가 실사용자 계정을 삭제하지 않도록 강제한다.
 *
 * @param email 세션에서 조회된 사용자 이메일
 * @returns E2E 패턴(`e2e.*@example.com`)이면 true
 */
function isAllowedE2eEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.startsWith(E2E_EMAIL_PREFIX) && normalized.endsWith(E2E_EMAIL_SUFFIX);
}

/**
 * 현재 로그인된 E2E 사용자를 정리하는 test-only endpoint.
 *
 * 제약:
 * - production 환경에서는 404 반환(엔드포인트 비활성화)
 * - 인증된 세션 사용자만 호출 가능
 * - E2E 이메일 패턴 사용자만 삭제 가능
 *
 * 응답:
 * - `{ ok: true, result: { deleted: boolean } }`
 *   - deleted=true: 실제 삭제됨
 *   - deleted=false: 이미 삭제되었거나 미존재
 */
export async function DELETE(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  if (!isAllowedE2eEmail(session.user.email)) {
    return forbiddenResponse('e2e cleanup is allowed only for e2e test accounts');
  }

  try {
    const result = await cleanupE2eUserById(session.user.id);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return handleServiceError(error, 'E2E cleanup failed');
  }
}
