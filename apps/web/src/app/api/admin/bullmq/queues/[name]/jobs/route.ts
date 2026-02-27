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
import { bulkRemoveJobs, bulkRetryJobs, listJobs, parseQueueName, QUEUE_NAMES } from '@/services/admin/bullmq.service';
import type { JobState } from '@/types/bullmq';

const listQuerySchema = z.object({
  state: z.enum(['waiting', 'active', 'failed', 'completed', 'delayed']).default('failed'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const bulkActionSchema = z.object({
  action: z.enum(['retry', 'remove']),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}. Allowed: ${QUEUE_NAMES.join(', ')}`);

  const sp = request.nextUrl.searchParams;
  const queryResult = listQuerySchema.safeParse({
    state: sp.get('state'),
    page: sp.get('page'),
    limit: sp.get('limit'),
  });
  if (!queryResult.success) return validationErrorResponse(queryResult.error.issues);

  const { state, page, limit } = queryResult.data;

  try {
    const result = await listJobs(queueName, state as JobState, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'BullMQ listJobs 오류');
  }
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}`);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid JSON body');
  }

  const bodyResult = bulkActionSchema.safeParse(body);
  if (!bodyResult.success) return validationErrorResponse(bodyResult.error.issues);

  const { action, ids } = bodyResult.data;

  try {
    const result = action === 'retry' ? await bulkRetryJobs(queueName, ids) : await bulkRemoveJobs(queueName, ids);
    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'BullMQ bulk action 오류');
  }
}
