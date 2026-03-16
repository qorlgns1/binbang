import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { createCase, getCases } from '@/services/cases.service';

const createCaseSchema = z.object({
  submissionId: z.string().min(1, 'submissionId is required'),
});

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_cases');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

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
    return handleServiceError(error, 'Admin cases fetch error', requestId);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_case_create');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const body: unknown = await request.json();
    const parsed = createCaseSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const result = await createCase({
      submissionId: parsed.data.submissionId,
      changedById: session.user.id,
    });

    return NextResponse.json({ case: result }, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Admin case creation error', requestId);
  }
}
