import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createFormQuestionMapping, getFormQuestionMappings } from '@/services/admin/form-question-mappings.service';

const FORM_QUESTION_FIELDS = [
  'CONTACT_CHANNEL',
  'CONTACT_VALUE',
  'TARGET_URL',
  'CONDITION_DEFINITION',
  'REQUEST_WINDOW',
  'CHECK_FREQUENCY',
  'BILLING_CONSENT',
  'SCOPE_CONSENT',
] as const;

const createMappingSchema = z.object({
  formKey: z.string().optional(),
  field: z.enum(FORM_QUESTION_FIELDS),
  questionItemId: z.string().nullable().optional(),
  questionTitle: z.string().min(1, 'questionTitle is required'),
  expectedAnswer: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const formKey = searchParams.get('formKey') ?? undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const response = await getFormQuestionMappings({
      formKey,
      includeInactive,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin intake mappings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = createMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const mapping = await createFormQuestionMapping(parsed.data);
    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('expectedAnswer is required') || error.message.includes('questionTitle is required'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Mapping already exists for formKey and field') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Admin intake mappings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
