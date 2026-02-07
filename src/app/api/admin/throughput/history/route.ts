import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getThroughputHistory } from '@/services/admin/throughput.service';

const paramsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  bucketMinutes: z.coerce.number().min(1).max(1440).optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const response = await getThroughputHistory({
      from: parsed.data.from,
      to: parsed.data.to,
      bucketMinutes: parsed.data.bucketMinutes,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Throughput history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
