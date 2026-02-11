import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { transitionCaseStatus } from '@/services/cases.service';

const transitionSchema = z.object({
  status: z.string().min(1, 'status is required'),
  reason: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const result = await transitionCaseStatus({
      caseId: id,
      toStatus: parsed.data.status as Parameters<typeof transitionCaseStatus>[0]['toStatus'],
      changedById: session.user.id,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Case not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.startsWith('Invalid transition:')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Admin case status transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
