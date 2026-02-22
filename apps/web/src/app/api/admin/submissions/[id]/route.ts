import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getFormSubmissionById } from '@/services/intake.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const submission = await getFormSubmissionById(id);

    if (!submission) {
      return notFoundResponse('Submission not found');
    }

    return NextResponse.json({ submission });
  } catch (error) {
    return handleServiceError(error, 'Admin submission detail error');
  }
}
