import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
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
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const parsed = updateMappingSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const { id } = await params;
    const mapping = await updateFormQuestionMapping({
      id,
      ...parsed.data,
    });

    return NextResponse.json({ mapping });
  } catch (error) {
    return handleServiceError(error, 'Admin intake mappings PATCH error');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    await deleteFormQuestionMapping(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Admin intake mappings DELETE error');
  }
}
