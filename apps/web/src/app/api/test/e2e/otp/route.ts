import { NextResponse } from 'next/server';

import { z } from 'zod';

import { areTestEndpointsEnabled } from '@/lib/testEndpointGuard';
import { forbiddenResponse, handleServiceError, validationErrorResponse } from '@/lib/handleServiceError';
import { issueEmailOtpForTest } from '@/services/email-otp.service';

const E2E_EMAIL_PREFIX = 'e2e.';
const E2E_EMAIL_SUFFIX = '@example.com';

const requestSchema = z.object({
  email: z.email().max(255),
});

/**
 * E2E 전용 이메일 패턴인지 검증한다.
 *
 * 보안 목적:
 * - 이 엔드포인트는 인증코드를 평문으로 돌려주므로,
 *   실사용자 이메일에는 절대 동작하면 안 된다.
 */
function isAllowedE2eEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.startsWith(E2E_EMAIL_PREFIX) && normalized.endsWith(E2E_EMAIL_SUFFIX);
}

/**
 * 인증코드를 발급하고 평문으로 돌려주는 test-only endpoint.
 *
 * 제약:
 * - production 환경에서는 404 반환(엔드포인트 비활성화)
 * - `e2e.*@example.com` 이메일만 허용
 *
 * E2E는 이 코드를 받아 실제 `/api/auth/email-verify`를 호출한다.
 * 즉 검증 경로는 그대로 검증되고, 발송 경로만 우회한다.
 */
export async function POST(request: Request): Promise<Response> {
  if (!areTestEndpointsEnabled()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    if (!isAllowedE2eEmail(parsed.data.email)) {
      return forbiddenResponse('otp issuing is allowed only for e2e test accounts');
    }

    const code = await issueEmailOtpForTest(parsed.data.email);
    return NextResponse.json({ ok: true, code });
  } catch (error) {
    return handleServiceError(error, 'E2E OTP issue failed');
  }
}
