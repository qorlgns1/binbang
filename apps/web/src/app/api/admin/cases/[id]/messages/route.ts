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
import { createRequestId } from '@/lib/logger';
import { createCaseMessage, getCaseMessages } from '@/services/messages.service';

const createMessageSchema = z.object({
  templateKey: z.string().min(1),
  channel: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_messages');
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id } = await params;
    const messages = await getCaseMessages(id);
    return NextResponse.json({ messages });
  } catch (error) {
    return handleServiceError(error, 'Admin case messages GET error', requestId);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_message_create');
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON', undefined, requestId);
    }

    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const message = await createCaseMessage({
      caseId: id,
      templateKey: parsed.data.templateKey,
      channel: parsed.data.channel,
      content: parsed.data.content,
      sentById: session.user.id,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Admin case messages POST error', requestId);
  }
}
