import { type FormQuestionField, prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface FormQuestionMappingOutput {
  id: string;
  formKey: string;
  field: FormQuestionField;
  questionItemId: string | null;
  questionTitle: string;
  expectedAnswer: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetFormQuestionMappingsInput {
  formKey?: string;
  includeInactive?: boolean;
}

export interface CreateFormQuestionMappingInput {
  formKey?: string;
  field: FormQuestionField;
  questionItemId?: string | null;
  questionTitle: string;
  expectedAnswer?: string | null;
  isActive?: boolean;
}

export interface UpdateFormQuestionMappingInput {
  id: string;
  formKey?: string;
  field?: FormQuestionField;
  questionItemId?: string | null;
  questionTitle?: string;
  expectedAnswer?: string | null;
  isActive?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FORM_KEY = '*';

const CONSENT_FIELDS: FormQuestionField[] = ['BILLING_CONSENT', 'SCOPE_CONSENT'];

const FORM_QUESTION_MAPPING_SELECT = {
  id: true,
  formKey: true,
  field: true,
  questionItemId: true,
  questionTitle: true,
  expectedAnswer: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ============================================================================
// Helpers
// ============================================================================

function normalizeFormKey(formKey?: string): string {
  const trimmed = formKey?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_FORM_KEY;
}

function normalizeRequiredText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  return trimmed;
}

function normalizeOptionalText(value?: string | null): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiresExpectedAnswer(field: FormQuestionField): boolean {
  return CONSENT_FIELDS.includes(field);
}

function isUniqueConstraintError(error: unknown): boolean {
  return error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002';
}

function toOutput(row: {
  id: string;
  formKey: string;
  field: FormQuestionField;
  questionItemId: string | null;
  questionTitle: string;
  expectedAnswer: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FormQuestionMappingOutput {
  return {
    id: row.id,
    formKey: row.formKey,
    field: row.field,
    questionItemId: row.questionItemId,
    questionTitle: row.questionTitle,
    expectedAnswer: row.expectedAnswer,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function validateExpectedAnswer(field: FormQuestionField, expectedAnswer: string | null): string | null {
  if (requiresExpectedAnswer(field) && !expectedAnswer) {
    throw new Error(`expectedAnswer is required for ${field}`);
  }
  return requiresExpectedAnswer(field) ? expectedAnswer : null;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getFormQuestionMappings(
  input: GetFormQuestionMappingsInput,
): Promise<{ mappings: FormQuestionMappingOutput[] }> {
  const rows = await prisma.formQuestionMapping.findMany({
    where: {
      ...(input.formKey ? { formKey: normalizeFormKey(input.formKey) } : {}),
      ...(input.includeInactive ? {} : { isActive: true }),
    },
    select: FORM_QUESTION_MAPPING_SELECT,
    orderBy: [{ formKey: 'asc' }, { field: 'asc' }],
  });

  return {
    mappings: rows.map(toOutput),
  };
}

export async function createFormQuestionMapping(
  input: CreateFormQuestionMappingInput,
): Promise<FormQuestionMappingOutput> {
  const formKey = normalizeFormKey(input.formKey);
  const questionItemId = normalizeOptionalText(input.questionItemId);
  const questionTitle = normalizeRequiredText(input.questionTitle, 'questionTitle');
  const expectedAnswer = validateExpectedAnswer(input.field, normalizeOptionalText(input.expectedAnswer));

  try {
    const created = await prisma.formQuestionMapping.create({
      data: {
        formKey,
        field: input.field,
        questionItemId,
        questionTitle,
        expectedAnswer,
        isActive: input.isActive ?? true,
      },
      select: FORM_QUESTION_MAPPING_SELECT,
    });

    return toOutput(created);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error('Mapping already exists for formKey and field');
    }
    throw error;
  }
}

export async function updateFormQuestionMapping(
  input: UpdateFormQuestionMappingInput,
): Promise<FormQuestionMappingOutput> {
  const existing = await prisma.formQuestionMapping.findUnique({
    where: { id: input.id },
    select: FORM_QUESTION_MAPPING_SELECT,
  });

  if (!existing) {
    throw new Error('Mapping not found');
  }

  const formKey = input.formKey !== undefined ? normalizeFormKey(input.formKey) : existing.formKey;
  const field = input.field ?? existing.field;
  const questionItemId =
    input.questionItemId !== undefined ? normalizeOptionalText(input.questionItemId) : existing.questionItemId;
  const questionTitle =
    input.questionTitle !== undefined
      ? normalizeRequiredText(input.questionTitle, 'questionTitle')
      : existing.questionTitle;
  const expectedAnswer = validateExpectedAnswer(
    field,
    input.expectedAnswer !== undefined ? normalizeOptionalText(input.expectedAnswer) : existing.expectedAnswer,
  );

  try {
    const updated = await prisma.formQuestionMapping.update({
      where: { id: input.id },
      data: {
        formKey,
        field,
        questionItemId,
        questionTitle,
        expectedAnswer,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: FORM_QUESTION_MAPPING_SELECT,
    });

    return toOutput(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error('Mapping already exists for formKey and field');
    }
    throw error;
  }
}

export async function deleteFormQuestionMapping(id: string): Promise<void> {
  try {
    await prisma.formQuestionMapping.delete({
      where: { id },
      select: { id: true },
    });
  } catch (error) {
    if (error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      throw new Error('Mapping not found');
    }
    throw error;
  }
}
