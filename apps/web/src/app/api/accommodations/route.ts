import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import {
  checkUserQuota,
  createAgodaApiAccommodation,
  deleteAccommodations,
  getAccommodationsByUserId,
} from '@/services/accommodations.service';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

// Agoda API 방식 (일반 사용자): platformId 필수, url 불필요
// URL 스크래핑 방식은 /api/admin/accommodations (어드민 전용)
const createAgodaAlertSchema = z
  .object({
    platformId: z.string().regex(/^\d+$/, '유효한 호텔 ID가 아닙니다'),
    name: z.string().min(1, '호텔명을 입력해주세요'),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
    adults: z.number().int().min(1).max(20).default(2),
    children: z.number().int().min(0).max(10).default(0),
    rooms: z.number().int().min(1).max(10).default(1),
    currency: z.string().length(3).default('KRW'),
    locale: z.string().default('ko'),
    consentOptIn: z.literal(true, { message: '알림 수신 동의가 필요합니다' }),
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
  .refine(
    (data) => {
      return new Date(data.checkOut) > new Date(data.checkIn);
    },
    {
      message: '체크아웃은 체크인 이후여야 합니다',
      path: ['checkOut'],
    },
  );

// DELETE: 숙소 일괄 삭제
export async function DELETE(request: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationErrorResponse([{ code: 'custom', path: [], message: '잘못된 JSON 본문입니다' }]);
  }

  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const count = await deleteAccommodations(parsed.data.ids, session.user.id);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    return handleServiceError(error, '숙소 일괄 삭제 오류');
  }
}

// GET: 숙소 목록 조회
export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const accommodations = await getAccommodationsByUserId(session.user.id);

  return NextResponse.json(accommodations);
}

// POST: Agoda API 방식 알림 등록 (일반 사용자)
// URL 스크래핑 방식은 /api/admin/accommodations (어드민 전용)
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    // Quota 체크
    const quota = await checkUserQuota(session.user.id);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `알림 등록 한도(${quota.max}개)에 도달했습니다. 더 필요한 경우 베타 운영팀에 확대를 요청해주세요.`,
            details: { max: quota.max, current: quota.current },
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createAgodaAlertSchema.parse(body);

    const accommodation = await createAgodaApiAccommodation({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      platformId: data.platformId,
      name: data.name,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      adults: data.adults,
      children: data.children,
      rooms: data.rooms,
      currency: data.currency,
      locale: data.locale,
    });

    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.issues);
    }

    return handleServiceError(error, '알림 등록 오류');
  }
}
