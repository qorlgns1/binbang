import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const testRequestSchema = z
  .object({
    hotelCode: z.string().trim().min(1),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    adults: z.number().int().min(1).max(20).default(2),
    rooms: z.number().int().min(1).max(8).default(1),
  })
  .superRefine((value, ctx): void => {
    if (value.checkIn >= value.checkOut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkOut must be after checkIn',
        path: ['checkOut'],
      });
    }
  });

function buildHotelbedsUrl(hotelCode: string, checkIn: string, checkOut: string, adults: number): string {
  const baseUrl = (process.env.HOTELBEDS_BASE_URL ?? 'https://api.test.hotelbeds.com').replace(/\/$/, '');
  const params = new URLSearchParams({
    hotelCode,
    checkIn,
    checkOut,
    adults: String(adults),
  });
  return `${baseUrl}/hotel-api/1.0/hotels?${params.toString()}`;
}

// POST /api/admin/hotelbeds/test
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const data = testRequestSchema.parse(body);

    const resolvedHotelCode = data.hotelCode.trim();
    const url = buildHotelbedsUrl(resolvedHotelCode, data.checkIn, data.checkOut, data.adults);

    const workerUrl = process.env.WORKER_INTERNAL_URL || 'http://localhost:3500';
    const workerRes = await fetch(`${workerUrl}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        platform: 'HOTELBEDS',
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        rooms: data.rooms,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!workerRes.ok) {
      const workerErrorText = await workerRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `Worker error: ${workerErrorText}`,
          durationMs: Date.now() - startTime,
          request: {
            hotelCode: resolvedHotelCode,
            url,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            adults: data.adults,
            rooms: data.rooms,
          },
        },
        { status: 500 },
      );
    }

    const workerResult = await workerRes.json();

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startTime,
      request: {
        hotelCode: resolvedHotelCode,
        url,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        rooms: data.rooms,
      },
      result: {
        available: workerResult.available,
        price: workerResult.price,
        reason: workerResult.error || workerResult.reason || null,
        metadata: workerResult.metadata || null,
      },
      raw: workerResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
          durationMs: Date.now() - startTime,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('fetch') || message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          error: '워커가 실행 중이지 않습니다. 로컬에서 pnpm cron을 실행하거나 프로덕션 워커를 확인하세요.',
          durationMs: Date.now() - startTime,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        durationMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
