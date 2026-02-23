import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { deletePattern, updatePattern } from '@/services/admin/patterns.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePatternSchema = z
  .object({
    pattern: z.string().min(1, '패턴 텍스트를 입력해주세요').optional(),
    isActive: z.boolean().optional(),
    priority: z.number().int().optional(),
    locale: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: '업데이트할 항목이 없습니다',
    path: [],
  });

// PATCH /api/admin/patterns/[id]
export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid JSON');
  }

  const parsed = updatePatternSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const pattern = await updatePattern({
      id,
      ...parsed.data,
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
