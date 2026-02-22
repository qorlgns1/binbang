import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createCase, getCases } from '@/services/cases.service';

const createCaseSchema = z.object({
  submissionId: z.string().min(1, 'submissionId is required'),
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const status = searchParams.get('status') ?? undefined;

    const response = await getCases({
      cursor,
      limit,
      ...(status && { status: status as Parameters<typeof getCases>[0]['status'] }),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin cases fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = createCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const result = await createCase({
      submissionId: parsed.data.submissionId,
      changedById: session.user.id,
    });

    return NextResponse.json({ case: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (
      message === 'Submission not found' ||
      message === 'Cannot create case from rejected submission' ||
      message === 'Submission already processed' ||
      message === 'Submission has no extracted fields'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Admin case creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
