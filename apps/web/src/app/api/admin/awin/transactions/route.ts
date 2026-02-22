import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, listAwinTransactions } from '@/services/admin/awin.service';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const transactionsSchema = z
  .object({
    startDate: z.string().regex(dateRegex, 'yyyy-MM-dd format required'),
    endDate: z.string().regex(dateRegex, 'yyyy-MM-dd format required'),
    advertiserId: z.string().optional(),
    status: z.enum(['pending', 'approved', 'declined', 'deleted']).optional(),
    dateType: z.enum(['transaction', 'validation', 'amendment']).optional(),
    timezone: z.string().optional(),
    showBasketProducts: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 31;
    },
    { message: 'Date range must be 0-31 days.' },
  );

/** GET: Awin 트랜잭션(전환) 목록 조회 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = transactionsSchema.safeParse({
    startDate: searchParams.get('startDate') ?? '',
    endDate: searchParams.get('endDate') ?? '',
    advertiserId: searchParams.get('advertiserId')?.trim() || undefined,
    status: searchParams.get('status') || undefined,
    dateType: searchParams.get('dateType') || undefined,
    timezone: searchParams.get('timezone')?.trim() || undefined,
    showBasketProducts: searchParams.get('showBasketProducts') === 'true' ? true : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await listAwinTransactions(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
