import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getUsers } from '@/services/admin/users.service';

const usersParamsSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_users');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = usersParamsSchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const response = await getUsers(parsed.data);

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Admin users error', requestId);
  }
}
