import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { triggerScheduler } from '@/services/admin/bullmq-trigger.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const result = await triggerScheduler(id);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return handleServiceError(error, 'BullMQ triggerScheduler 오류');
  }
}
