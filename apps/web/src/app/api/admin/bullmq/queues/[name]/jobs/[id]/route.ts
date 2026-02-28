import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  notFoundResponse,
  unauthorizedResponse,
} from '@/lib/handleServiceError';
import { getJobDetail, parseQueueName, QUEUE_NAMES } from '@/services/admin/bullmq.service';
import { removeJob } from '@/services/admin/bullmq.service';

interface RouteParams {
  params: Promise<{ name: string; id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name, id } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}. Allowed: ${QUEUE_NAMES.join(', ')}`);

  try {
    const job = await getJobDetail(queueName, id);
    if (!job) return notFoundResponse(`Job ${id} 를 찾을 수 없습니다.`);
    return NextResponse.json(job);
  } catch (error) {
    return handleServiceError(error, 'BullMQ getJobDetail 오류');
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name, id } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}`);

  try {
    await removeJob(queueName, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleServiceError(error, 'BullMQ removeJob 오류');
  }
}
