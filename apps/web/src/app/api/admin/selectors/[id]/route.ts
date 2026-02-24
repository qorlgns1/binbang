import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { deleteSelector, updateSelector } from '@/services/admin/selectors.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSelectorSchema = z
  .object({
    selector: z.string().min(1, 'CSS 셀렉터를 입력해주세요').optional(),
    extractorCode: z.string().nullable().optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: '업데이트할 항목이 없습니다',
    path: [],
  });

// PATCH /api/admin/selectors/[id]
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

  const parsed = updateSelectorSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const selector = await updateSelector({
      id,
      ...parsed.data,
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
    return unauthorizedResponse();
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
