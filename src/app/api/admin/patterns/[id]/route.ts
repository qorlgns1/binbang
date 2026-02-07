import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { deletePattern, updatePattern } from '@/services/admin/patterns.service';
import type { UpdatePatternPayload } from '@/types/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/patterns/[id]
export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    if (error instanceof Error) {
      if (error.message === 'Pattern not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'No changes detected') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    throw error;
  }
}

// DELETE /api/admin/patterns/[id]
export async function DELETE(request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deletePattern({
      id,
      deletedById: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Pattern not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
