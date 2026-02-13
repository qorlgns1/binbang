import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { checkUserQuota, createAccommodation, getAccommodationsByUserId } from '@/services/accommodations.service';

const createAccommodationSchema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요'),
    platform: z.enum(['AIRBNB', 'AGODA']),
    url: z.string().url('올바른 URL을 입력해주세요'),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    adults: z.number().min(1).max(20).default(2),
  })
  .refine((data) => data.checkIn >= new Date().toISOString().split('T')[0], {
    message: '체크인 날짜는 오늘 이후여야 합니다',
    path: ['checkIn'],
  });

// GET: 숙소 목록 조회
export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accommodations = await getAccommodationsByUserId(session.user.id);

  return NextResponse.json(accommodations);
}

// POST: 숙소 생성
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Quota 체크
    const quota = await checkUserQuota(session.user.id);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'quota_exceeded',
          message: `숙소 등록 한도(${quota.max}개)에 도달했습니다. 플랜을 업그레이드해주세요.`,
          quota: { max: quota.max, current: quota.current },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createAccommodationSchema.parse(body);

    // URL에서 플랫폼 자동 감지
    let platform = data.platform;
    if (data.url.includes('airbnb')) {
      platform = 'AIRBNB';
    } else if (data.url.includes('agoda')) {
      platform = 'AGODA';
    }

    const accommodation = await createAccommodation({
      userId: session.user.id,
      name: data.name,
      platform,
      url: data.url,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      adults: data.adults,
    });

    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('숙소 생성 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
