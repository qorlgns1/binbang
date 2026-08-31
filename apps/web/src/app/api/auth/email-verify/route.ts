import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { handleServiceError, validationErrorResponse } from '@/lib/handleServiceError';
import { verifyEmailOtp } from '@/services/email-otp.service';

const requestSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다').max(255),
  code: z.string().regex(/^\d{6}$/, '6자리 숫자를 입력해주세요'),
});

const INVALID_MESSAGE = '인증코드가 올바르지 않습니다';

/**
 * 인증코드 검증 + 로그인.
 *
 * NextAuth v4의 CredentialsProvider는 database 세션 전략과 함께 쓸 수 없어서,
 * 기존 credentials-login 라우트와 동일하게 Session 레코드를 직접 만들고 쿠키를 굽는다.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const result = await verifyEmailOtp(parsed.data);

    if (result.status === 'too_many_attempts') {
      return NextResponse.json({ message: '시도 횟수를 초과했습니다. 코드를 다시 요청해주세요' }, { status: 429 });
    }

    if (result.status === 'expired') {
      return NextResponse.json({ message: '인증코드가 만료됐습니다. 다시 요청해주세요' }, { status: 400 });
    }

    if (result.status === 'invalid') {
      return NextResponse.json({ message: INVALID_MESSAGE }, { status: 400 });
    }

    const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') ?? false;
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    const response = NextResponse.json({ message: '인증되었습니다', isNewUser: result.isNewUser });
    response.cookies.set(cookieName, result.sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      expires: result.expires,
    });

    return response;
  } catch (error) {
    return handleServiceError(error, 'Email OTP verify error');
  }
}
