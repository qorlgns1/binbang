import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { parseQueueName, QUEUE_NAMES, retryJob } from '@/services/admin/bullmq.service';

interface RouteParams {
  params: Promise<{ name: string; id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name, id } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}. Allowed: ${QUEUE_NAMES.join(', ')}`);

  try {
    await retryJob(queueName, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleServiceError(error, 'BullMQ retryJob 오류');
  }
}
