import { NextResponse } from 'next/server';

import { z } from 'zod';

import { handleServiceError, validationErrorResponse } from '@/lib/handleServiceError';
import { checkEmailExists, createUserWithCredentials } from '@/services/auth.service';

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const { email, password, name } = parsed.data;

    const exists = await checkEmailExists(email);
    if (exists) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: '이미 사용 중인 이메일입니다' } },
        { status: 409 },
      );
    }

    await createUserWithCredentials({ email, password, name });

    return NextResponse.json({ message: '회원가입이 완료되었습니다' }, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Auth signup error');
  }
}
