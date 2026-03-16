import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { updateUserRoles } from '@/services/admin/users.service';

const rolesUpdateSchema = z.object({
  roles: z.array(z.string()).min(1, '최소 1개의 역할이 필요합니다'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_user_roles');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const { id } = await params;

    if (session.user.id === id) {
      return badRequestResponse('자기 자신의 역할은 변경할 수 없습니다', undefined, requestId);
    }

    const body = await request.json();
    const parsed = rolesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const result = await updateUserRoles({
      userId: id,
      roles: parsed.data.roles,
      changedById: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'Admin roles update error', requestId);
  }
}
