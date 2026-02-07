import { NextResponse } from 'next/server';

import type { PatternType, Platform } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/admin';
import { createPattern, getPatterns } from '@/services/admin/patterns.service';
import type { CreatePatternPayload } from '@/types/admin';

// GET /api/admin/patterns
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const patternType = searchParams.get('patternType') as PatternType | null;
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const response = await getPatterns({ platform, patternType, includeInactive });

  return NextResponse.json(response);
}

// POST /api/admin/patterns
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CreatePatternPayload;

  // 필수 필드 검증
  if (!body.platform || !body.patternType || !body.pattern) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const pattern = await createPattern({
      ...body,
      createdById: session.user.id,
    });

    return NextResponse.json({ pattern });
  } catch (error) {
    if (error instanceof Error && error.message === 'Pattern already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
