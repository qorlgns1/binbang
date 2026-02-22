import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { deleteAccommodation, getAccommodationById, updateAccommodation } from '@/services/accommodations.service';
import type { RouteParams } from '@/types/api';

const updateAccommodationSchema = z
  .object({
    name: z.string().min(1).optional(),
    url: z.string().url().optional(),
    checkIn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    checkOut: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    adults: z.number().min(1).max(20).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.checkIn) return true;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const checkInDate = new Date(data.checkIn);
      return checkInDate >= today;
    },
    {
      message: '체크인 날짜는 오늘 이후여야 합니다',
      path: ['checkIn'],
    },
  );

// GET: 숙소 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accommodation = await getAccommodationById(id, session.user.id);

  if (!accommodation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(accommodation);
}

// PATCH: 숙소 수정
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateAccommodationSchema.parse(body);

    const accommodation = await updateAccommodation(id, session.user.id, {
      name: data.name,
      url: data.url,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      adults: data.adults,
      isActive: data.isActive,
    });

    if (!accommodation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(accommodation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }

    console.error('숙소 수정 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 숙소 삭제
export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await deleteAccommodation(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
