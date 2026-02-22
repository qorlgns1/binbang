import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createCaseMessage, getCaseMessages } from '@/services/messages.service';

const createMessageSchema = z.object({
  templateKey: z.string().min(1),
  channel: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const messages = await getCaseMessages(id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Admin case messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    if (errorMessage === 'Case not found') {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    console.error('Admin case messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
