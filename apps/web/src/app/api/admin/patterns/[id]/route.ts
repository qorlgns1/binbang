import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { deletePattern, updatePattern } from '@/services/admin/patterns.service';
import type { UpdatePatternPayload } from '@/types/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/patterns/[id]
export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const body = (await request.json()) as UpdatePatternPayload;

  try {
    const pattern = await updatePattern({
      id,
      ...body,
      updatedById: session.user.id,
    });

    return NextResponse.json({ pattern });
  } catch (error) {
    return handleServiceError(error, 'Admin pattern update error');
  }
}

// DELETE /api/admin/patterns/[id]
export async function DELETE(_request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    await deletePattern({
      id,
      deletedById: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Admin pattern delete error');
  }
}
