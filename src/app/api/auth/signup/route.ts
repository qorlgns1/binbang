import { NextResponse } from 'next/server';

import { hash } from 'bcryptjs';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ message: '회원가입이 완료되었습니다' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
