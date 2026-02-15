import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { calculateTravelScore } from '@/services/travel-score.service';

const scoreRequestSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

/**
 * POST /api/admin/travel-planner/score
 * 여행 점수 계산 (Admin 전용 테스트)
 */
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const data = scoreRequestSchema.parse(body);

    const result = await calculateTravelScore(data);

    return NextResponse.json({
      ...result,
      durationMs: Date.now() - startTime,
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
