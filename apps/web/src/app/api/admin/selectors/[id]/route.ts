import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError } from '@/lib/handleServiceError';
import { deleteSelector, updateSelector } from '@/services/admin/selectors.service';
import type { UpdateSelectorPayload } from '@/types/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/selectors/[id]
export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateSelectorPayload;

  try {
    const selector = await updateSelector({
      id,
      ...body,
      updatedById: session.user.id,
    });

    return NextResponse.json({ selector });
  } catch (error) {
    return handleServiceError(error, 'Admin selector update error');
  }
}

// DELETE /api/admin/selectors/[id]
export async function DELETE(_request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteSelector({
      id,
      deletedById: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Admin selector delete error');
  }
}
