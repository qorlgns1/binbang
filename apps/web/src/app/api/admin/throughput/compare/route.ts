import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getThroughputCompare } from '@/services/admin/throughputService';

const paramsSchema = z.object({
  compareBy: z.enum(['concurrency', 'browserPoolSize']),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
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

    const response = await getThroughputCompare({
      compareBy: parsed.data.compareBy,
      from: parsed.data.from,
      to: parsed.data.to,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Throughput compare error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
