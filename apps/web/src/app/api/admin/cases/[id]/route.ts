import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getCaseById } from '@/services/cases.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_detail');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const { id } = await params;
    const caseDetail = await getCaseById(id);

    if (!caseDetail) {
      return notFoundResponse('Case not found', requestId);
    }

    return NextResponse.json({ case: caseDetail });
  } catch (error) {
    return handleServiceError(error, 'Admin case detail error', requestId);
  }
}
