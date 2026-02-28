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
import {
  cleanQueue,
  drainQueue,
  parseQueueName,
  pauseQueue,
  QUEUE_NAMES,
  resumeQueue,
} from '@/services/admin/bullmq.service';

const controlSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause') }),
  z.object({ action: z.literal('resume') }),
  z.object({ action: z.literal('drain') }),
  z.object({
    action: z.literal('clean'),
    state: z.enum(['failed', 'completed']),
    graceMs: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(1000).default(100),
  }),
]);

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { name } = await params;
  const queueName = parseQueueName(name);
  if (!queueName) return badRequestResponse(`Unknown queue: ${name}. Allowed: ${QUEUE_NAMES.join(', ')}`);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid JSON body');
  }

  const bodyResult = controlSchema.safeParse(body);
  if (!bodyResult.success) return validationErrorResponse(bodyResult.error.issues);

  const data = bodyResult.data;

  try {
    switch (data.action) {
      case 'pause':
        await pauseQueue(queueName);
        return NextResponse.json({ ok: true, action: 'pause' });
      case 'resume':
        await resumeQueue(queueName);
        return NextResponse.json({ ok: true, action: 'resume' });
      case 'drain':
        await drainQueue(queueName);
        return NextResponse.json({ ok: true, action: 'drain' });
      case 'clean': {
        const removed = await cleanQueue(queueName, data.state, data.graceMs, data.limit);
        return NextResponse.json({ ok: true, action: 'clean', removed });
      }
    }
  } catch (error) {
    return handleServiceError(error, 'BullMQ control 오류');
  }
}
