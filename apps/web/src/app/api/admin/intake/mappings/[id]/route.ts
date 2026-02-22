import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { deleteFormQuestionMapping, updateFormQuestionMapping } from '@/services/admin/form-question-mappings.service';

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

const updateMappingSchema = z.object({
  formKey: z.string().optional(),
  field: z.enum(FORM_QUESTION_FIELDS).optional(),
  questionItemId: z.string().nullable().optional(),
  questionTitle: z.string().min(1).optional(),
  expectedAnswer: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.issues }, { status: 400 });
    }

    const { id } = await params;
    const mapping = await updateFormQuestionMapping({
      id,
      ...parsed.data,
    });

    return NextResponse.json({ mapping });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('expectedAnswer is required') || error.message.includes('questionTitle is required'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Mapping not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Mapping already exists for formKey and field') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Admin intake mappings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteFormQuestionMapping(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Mapping not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('Admin intake mappings DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
