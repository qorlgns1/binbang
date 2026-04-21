import { type FormQuestionField, FormQuestionMapping, getDataSource } from '@workspace/db';
import { BadRequestError, ConflictError, NotFoundError } from '@workspace/shared/errors';

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

const CONSENT_FIELDS: FormQuestionField[] = [
  'BILLING_CONSENT' as FormQuestionField,
  'SCOPE_CONSENT' as FormQuestionField,
];

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
    throw new BadRequestError(`${fieldName} is required`);
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
  if (error == null || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return message.includes('ORA-00001');
}

function toOutput(row: FormQuestionMapping): FormQuestionMappingOutput {
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
    throw new BadRequestError(`expectedAnswer is required for ${field}`);
  }
  return requiresExpectedAnswer(field) ? expectedAnswer : null;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getFormQuestionMappings(
  input: GetFormQuestionMappingsInput,
): Promise<{ mappings: FormQuestionMappingOutput[] }> {
  const ds = await getDataSource();

  const rows = await ds.getRepository(FormQuestionMapping).find({
    where: {
      ...(input.formKey ? { formKey: normalizeFormKey(input.formKey) } : {}),
      ...(input.includeInactive ? {} : { isActive: true }),
    },
    order: { formKey: 'ASC', field: 'ASC' },
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

  const ds = await getDataSource();
  const repo = ds.getRepository(FormQuestionMapping);

  try {
    const entity = repo.create({
      formKey,
      field: input.field,
      questionItemId,
      questionTitle,
      expectedAnswer,
      isActive: input.isActive ?? true,
    });
    await repo.save(entity);
    return toOutput(entity);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Mapping already exists for formKey and field');
    }
    throw error;
  }
}

export async function updateFormQuestionMapping(
  input: UpdateFormQuestionMappingInput,
): Promise<FormQuestionMappingOutput> {
  const ds = await getDataSource();
  const repo = ds.getRepository(FormQuestionMapping);

  const existing = await repo.findOne({ where: { id: input.id } });

  if (!existing) {
    throw new NotFoundError('Mapping not found');
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
    await repo.update(
      { id: input.id },
      {
        formKey,
        field,
        questionItemId,
        questionTitle,
        expectedAnswer,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    );

    const updated = await repo.findOneOrFail({ where: { id: input.id } });
    return toOutput(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Mapping already exists for formKey and field');
    }
    throw error;
  }
}

export async function deleteFormQuestionMapping(id: string): Promise<void> {
  const ds = await getDataSource();
  const repo = ds.getRepository(FormQuestionMapping);

  const result = await repo.delete({ id });
  if ((result.affected ?? 0) === 0) {
    throw new NotFoundError('Mapping not found');
  }
}
