import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createAccommodation } from '@/services/accommodations.service';

// 어드민 전용: URL 스크래핑 방식 숙소 등록
const createAccommodationSchema = z
  .object({
    userId: z.string().cuid('유효한 사용자 ID를 입력해주세요').optional(),
    name: z.string().min(1, '이름을 입력해주세요'),
    platform: z.enum(['AIRBNB', 'AGODA']),
    url: z.string().url('올바른 URL을 입력해주세요'),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    adults: z.number().min(1).max(20).default(2),
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const checkInDate = new Date(data.checkIn);
      return checkInDate >= today;
    },
    {
      message: '체크인 날짜는 오늘 이후여야 합니다',
      path: ['checkIn'],
    },
  )
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: '체크아웃은 체크인 이후여야 합니다',
    path: ['checkOut'],
  });

export async function POST(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const data = createAccommodationSchema.parse(body);

    // userId 미지정 시 어드민 본인 ID 사용
    const targetUserId = data.userId ?? session.user.id;

    // URL에서 플랫폼 자동 감지 (hostname 기준으로 판별)
    let platform = data.platform;
    try {
      const hostname = new URL(data.url).hostname;
      if (hostname.includes('airbnb')) {
        platform = 'AIRBNB';
      } else if (hostname.includes('agoda')) {
        platform = 'AGODA';
      }
    } catch {
      // URL 파싱 실패 시 data.platform 유지
    }

    const accommodation = await createAccommodation({
      userId: targetUserId,
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
      return validationErrorResponse(error.issues);
    }

    return handleServiceError(error, '어드민 숙소 등록 오류');
  }
}
