import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getCaseById } from '@/services/cases.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const caseDetail = await getCaseById(id);

    if (!caseDetail) {
      return notFoundResponse('Case not found');
    }

    return NextResponse.json({ case: caseDetail });
  } catch (error) {
    return handleServiceError(error, 'Admin case detail error');
  }
}
