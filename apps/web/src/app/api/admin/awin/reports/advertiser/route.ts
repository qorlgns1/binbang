import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, getAwinAdvertiserReport } from '@/services/admin/awin.service';

const REGIONS = [
  'AT',
  'AU',
  'BE',
  'BR',
  'CA',
  'CH',
  'DE',
  'DK',
  'ES',
  'FI',
  'FR',
  'GB',
  'IE',
  'IT',
  'NL',
  'NO',
  'PL',
  'SE',
  'US',
] as const;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const reportSchema = z.object({
  startDate: z.string().regex(dateRegex, 'yyyy-MM-dd format required'),
  endDate: z.string().regex(dateRegex, 'yyyy-MM-dd format required'),
  region: z.enum(REGIONS).default('US'),
  dateType: z.enum(['transaction', 'validation']).optional(),
  timezone: z.string().optional(),
});

/** GET: Awin 광고주별 집계 성과 리포트 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = reportSchema.safeParse({
    startDate: searchParams.get('startDate') ?? '',
    endDate: searchParams.get('endDate') ?? '',
    region: (searchParams.get('region') ?? 'US').toUpperCase(),
    dateType: searchParams.get('dateType') || undefined,
    timezone: searchParams.get('timezone')?.trim() || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await getAwinAdvertiserReport(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
