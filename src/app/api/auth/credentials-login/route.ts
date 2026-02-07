import { NextResponse } from 'next/server';

import { compare } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30일

const ERROR_MSG = '이메일 또는 비밀번호가 올바르지 않습니다';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: ERROR_MSG }, { status: 401 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      return NextResponse.json({ error: ERROR_MSG }, { status: 401 });
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: ERROR_MSG }, { status: 401 });
    }

    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // NextAuth v4: production(https)에서는 __Secure- prefix 사용
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
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
