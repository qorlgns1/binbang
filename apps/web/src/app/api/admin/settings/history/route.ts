import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getSettingsHistory } from '@/services/admin/settingsService';

const historyParamsSchema = z.object({
  settingKey: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = historyParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const response = await getSettingsHistory({
      settingKey: parsed.data.settingKey,
      from: parsed.data.from,
      to: parsed.data.to,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Settings history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
