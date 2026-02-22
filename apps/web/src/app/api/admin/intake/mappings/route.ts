import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
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
    return unauthorizedResponse();
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
    return handleServiceError(error, 'Admin intake mappings GET error');
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON');
    }
    const parsed = createMappingSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const mapping = await createFormQuestionMapping(parsed.data);
    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Admin intake mappings POST error');
  }
}
