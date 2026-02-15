import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { deleteSelector, updateSelector } from '@/services/admin/selectorsService';
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
    if (error instanceof Error) {
      if (error.message === 'Selector not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Selector with same name already exists') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    throw error;
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
    if (error instanceof Error && error.message === 'Selector not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
