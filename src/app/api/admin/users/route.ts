import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getUsers } from '@/services/admin/users.service';

const usersParamsSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
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
    const parsed = usersParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const response = await getUsers(parsed.data);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
