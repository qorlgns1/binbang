import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getAllQueuesStats } from '@/services/admin/bullmq.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const queues = await getAllQueuesStats();
    return NextResponse.json({ queues });
  } catch (error) {
    return handleServiceError(error, 'BullMQ queues stats 오류');
  }
}
