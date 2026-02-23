import { NextResponse } from 'next/server';

import { z } from 'zod';

import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createSessionForUser, verifyCredentials } from '@/services/auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ERROR_MSG = '이메일 또는 비밀번호가 올바르지 않습니다';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return unauthorizedResponse(ERROR_MSG);
    }

    const { email, password } = parsed.data;

    const user = await verifyCredentials({ email, password });
    if (!user) {
      return unauthorizedResponse(ERROR_MSG);
    }

    const { sessionToken, expires } = await createSessionForUser(user.id);

    const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') ?? false;
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    const response = NextResponse.json({ message: '로그인 성공' });
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      expires,
    });

    return response;
  } catch (error) {
    return handleServiceError(error, 'Auth credentials login error');
  }
}
