import { type FormQuestionField, type FormSubmissionStatus, type Prisma, prisma } from '@workspace/db';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface CreateFormSubmissionInput {
  responseId: string;
  rawPayload: Record<string, unknown>;
  sourceIp?: string;
}

export interface CreateFormSubmissionResult {
  submission: FormSubmissionOutput;
  created: boolean;
}

export interface ConsentTexts {
  billing: string;
  scope: string;
}

const FORM_CONSENT_MAP: Record<string, ConsentTexts> = {
  default: {
    billing: '조건 충족(열림 확인) 시 비용이 발생함에 동의합니다',
    scope: '서비스는 Q4에 명시된 조건의 충족(열림) 여부만 확인하며, 예약 완료나 결제를 보장하지 않음에 동의합니다',
  },
} as const;

export interface FormSubmissionOutput {
  id: string;
  responseId: string;
  status: FormSubmissionStatus;
  rawPayload: unknown;
  formVersion: string | null;
  sourceIp: string | null;
  extractedFields: unknown;
  rejectionReason: string | null;
  consentBillingOnConditionMet: boolean | null;
  consentServiceScope: boolean | null;
  consentCapturedAt: string | null;
  consentTexts: ConsentTexts | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetFormSubmissionsInput {
  cursor?: string;
  limit: number;
  status?: FormSubmissionStatus;
}

export interface GetFormSubmissionsResult {
  submissions: FormSubmissionOutput[];
  nextCursor: string | null;
  total?: number;
}

// ============================================================================
// Shared select
// ============================================================================

const FORM_SUBMISSION_SELECT = {
  id: true,
  responseId: true,
  status: true,
  rawPayload: true,
  formVersion: true,
  sourceIp: true,
  extractedFields: true,
  rejectionReason: true,
  consentBillingOnConditionMet: true,
  consentServiceScope: true,
  consentCapturedAt: true,
  consentTexts: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ============================================================================
// Helpers
// ============================================================================

interface FormSubmissionRow {
  id: string;
  responseId: string;
  status: FormSubmissionStatus;
  rawPayload: unknown;
  formVersion: string | null;
  sourceIp: string | null;
  extractedFields: unknown;
  rejectionReason: string | null;
  consentBillingOnConditionMet: boolean | null;
  consentServiceScope: boolean | null;
  consentCapturedAt: Date | null;
  consentTexts: unknown;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const consentTextsSchema = z.object({
  billing: z.string().min(1),
  scope: z.string().min(1),
});

interface NormalizedRawPayload {
  contact_channel: string | null;
  contact_value: string | null;
  target_url: string | null;
  condition_definition: string | null;
  request_window: string | null;
  check_frequency: string | null;
  billing_consent: boolean;
  scope_consent: boolean;
  form_version?: string;
  formVersion?: string;
  consent_texts?: ConsentTexts;
  billing_consent_text?: string;
  scope_consent_text?: string;
  respondent_email?: string | null;
  form_id?: string;
}

interface AnswersItem {
  itemId?: string;
  title: string;
  value: unknown;
}

interface FormQuestionMappingRow {
  formKey: string;
  field: FormQuestionField;
  questionItemId: string | null;
  questionTitle: string;
  expectedAnswer: string | null;
}

interface NormalizedFromAnswersResult {
  payload: Partial<NormalizedRawPayload>;
  mappingWarnings: string[];
}

interface NormalizeRawPayloadResult {
  payload: NormalizedRawPayload;
  mappingWarnings: string[];
}

const DEFAULT_FORM_KEY = '*';

function isValidFutureDate(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

const rawPayloadFieldsSchema = z.object({
  contact_channel: z.enum(['카카오톡', '이메일', '전화번호']),
  contact_value: z.string().min(1, '연락처가 비어있습니다'),
  target_url: z.string().url('유효하지 않은 URL입니다'),
  condition_definition: z.string().min(10, '조건 정의가 너무 짧습니다 (최소 10자)'),
  request_window: z.string().refine(isValidFutureDate, '유효하지 않은 날짜이거나 이미 지난 날짜입니다'),
  check_frequency: z.string().nullable().optional(),
  billing_consent: z.literal(true, { errorMap: () => ({ message: '비용 발생 동의가 필요합니다' }) }),
  scope_consent: z.literal(true, { errorMap: () => ({ message: '서비스 범위 동의가 필요합니다' }) }),
  // Apps Script가 전달할 수 있는 옵션 메타/원문
  form_version: z.string().min(1).optional(),
  formVersion: z.string().min(1).optional(),
  consent_texts: consentTextsSchema.optional(),
  billing_consent_text: z.string().min(1).optional(),
  scope_consent_text: z.string().min(1).optional(),
  respondent_email: z.string().email().nullable().optional(),
  form_id: z.string().min(1).optional(),
});

function isUniqueConstraintError(error: unknown): boolean {
  return error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002';
}

function resolveConsentEvidence(input: { formVersion: string | null; payloadConsentTexts: ConsentTexts | null }): {
  formVersion: string | null;
  consentTexts: ConsentTexts;
} {
  const mapped =
    (input.formVersion ? FORM_CONSENT_MAP[input.formVersion] : null) ??
    FORM_CONSENT_MAP.default ??
    ({ billing: '', scope: '' } as const);
  return {
    formVersion: input.formVersion,
    consentTexts: input.payloadConsentTexts ?? mapped,
  };
}

function parseConsentTexts(value: unknown): ConsentTexts | null {
  const result = consentTextsSchema.safeParse(value);
  return result.success ? result.data : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNullableString(value: unknown): string | null {
  return toOptionalString(value) ?? null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => toOptionalString(item)).filter((item): item is string => item != null);
}

function toFormDateString(value: unknown): string | null {
  const text = toOptionalString(value);
  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }
  return parsed.toISOString().slice(0, 10);
}

function readAnswersFromRawPayload(rawPayload: Record<string, unknown>): AnswersItem[] {
  const rawAnswers = rawPayload.answers;
  if (!Array.isArray(rawAnswers)) {
    return [];
  }

  return rawAnswers
    .map((item): AnswersItem | null => {
      if (!isRecord(item)) {
        return null;
      }
      const title = toOptionalString(item.title);
      if (!title) {
        return null;
      }
      const itemId = toOptionalString(item.itemId) ?? toOptionalString(item.item_id);
      return {
        ...(itemId && { itemId }),
        title,
        value: item.value,
      };
    })
    .filter((item): item is AnswersItem => item != null);
}

function normalizeTitleForExactMatch(title: string): string {
  return title.trim();
}

function toAnswerString(value: unknown): string | null {
  const scalar = toOptionalString(value);
  if (scalar != null) {
    return scalar;
  }

  const values = toStringArray(value);
  if (values.length > 0) {
    return values[0];
  }

  return null;
}

function answerIncludesExactText(value: unknown, expectedAnswer: string): boolean {
  const expected = expectedAnswer.trim();
  if (!expected) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() === expected;
  }

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && item.trim() === expected);
  }

  return false;
}

async function getActiveFormQuestionMappingsByField(input: {
  tx: Prisma.TransactionClient;
  formKey: string;
}): Promise<Map<FormQuestionField, FormQuestionMappingRow>> {
  const rows = await input.tx.formQuestionMapping.findMany({
    where:
      input.formKey === DEFAULT_FORM_KEY
        ? { isActive: true, formKey: DEFAULT_FORM_KEY }
        : { isActive: true, OR: [{ formKey: input.formKey }, { formKey: DEFAULT_FORM_KEY }] },
    select: {
      formKey: true,
      field: true,
      questionItemId: true,
      questionTitle: true,
      expectedAnswer: true,
    },
  });

  const sortedRows = [...rows].sort((a, b) => {
    const aPriority = a.formKey === input.formKey ? 1 : 0;
    const bPriority = b.formKey === input.formKey ? 1 : 0;
    return bPriority - aPriority;
  });

  const mappingByField = new Map<FormQuestionField, FormQuestionMappingRow>();
  sortedRows.forEach((row): void => {
    if (!mappingByField.has(row.field)) {
      mappingByField.set(row.field, row);
    }
  });

  return mappingByField;
}

function normalizeFromAnswersWithMappings(input: {
  rawPayload: Record<string, unknown>;
  mappingByField: Map<FormQuestionField, FormQuestionMappingRow>;
}): NormalizedFromAnswersResult {
  const { rawPayload, mappingByField } = input;
  const answers = readAnswersFromRawPayload(rawPayload);
  if (answers.length === 0 || mappingByField.size === 0) {
    return { payload: {}, mappingWarnings: [] };
  }

  const mappingWarnings: string[] = [];
  const answerByTitle = new Map<string, AnswersItem>();
  const answerByItemId = new Map<string, unknown>();
  answers.forEach((answer): void => {
    if (answer.itemId && !answerByItemId.has(answer.itemId)) {
      answerByItemId.set(answer.itemId, answer.value);
    }
    const key = normalizeTitleForExactMatch(answer.title);
    if (!answerByTitle.has(key)) {
      answerByTitle.set(key, answer);
    }
  });

  function getAnswerValue(field: FormQuestionField): unknown {
    const mapping = mappingByField.get(field);
    if (!mapping) {
      return undefined;
    }

    const itemId = mapping.questionItemId?.trim();
    if (itemId) {
      const answerFromItemId = answerByItemId.get(itemId);
      if (answerFromItemId !== undefined) {
        return answerFromItemId;
      }
    }

    const answerFromTitle = answerByTitle.get(normalizeTitleForExactMatch(mapping.questionTitle));

    if (answerFromTitle !== undefined) {
      if (itemId && answerFromTitle.itemId && answerFromTitle.itemId !== itemId) {
        mappingWarnings.push(`${field}: itemId "${itemId}" 매칭 실패로 title fallback 사용 (${mapping.questionTitle})`);
      }
      return answerFromTitle.value;
    }

    return undefined;
  }

  const contactChannel = toAnswerString(getAnswerValue('CONTACT_CHANNEL'));
  const contactValue = toAnswerString(getAnswerValue('CONTACT_VALUE'));
  const targetUrl = toAnswerString(getAnswerValue('TARGET_URL'));
  const conditionDefinition = toAnswerString(getAnswerValue('CONDITION_DEFINITION'));
  const requestWindow = toFormDateString(getAnswerValue('REQUEST_WINDOW'));
  const checkFrequency = toAnswerString(getAnswerValue('CHECK_FREQUENCY'));

  const billingMapping = mappingByField.get('BILLING_CONSENT');
  const scopeMapping = mappingByField.get('SCOPE_CONSENT');
  const billingConsentText = billingMapping?.expectedAnswer ?? undefined;
  const scopeConsentText = scopeMapping?.expectedAnswer ?? undefined;
  const billingConsent = billingMapping?.expectedAnswer
    ? answerIncludesExactText(getAnswerValue('BILLING_CONSENT'), billingMapping.expectedAnswer)
    : false;
  const scopeConsent = scopeMapping?.expectedAnswer
    ? answerIncludesExactText(getAnswerValue('SCOPE_CONSENT'), scopeMapping.expectedAnswer)
    : false;

  const respondentEmail = toOptionalString(rawPayload.respondentEmail) ?? toOptionalString(rawPayload.respondent_email);
  const formId = toOptionalString(rawPayload.formId) ?? toOptionalString(rawPayload.form_id);
  const formVersion = toOptionalString(rawPayload.formVersion);
  const formVersionSnake = toOptionalString(rawPayload.form_version);

  const consentTexts =
    billingConsentText && scopeConsentText
      ? {
          billing: billingConsentText,
          scope: scopeConsentText,
        }
      : undefined;

  return {
    payload: {
      contact_channel: contactChannel ?? null,
      contact_value: contactValue ?? respondentEmail ?? null,
      target_url: targetUrl ?? null,
      condition_definition: conditionDefinition ?? null,
      request_window: requestWindow ?? null,
      check_frequency: checkFrequency ?? null,
      billing_consent: billingConsent,
      scope_consent: scopeConsent,
      ...(formVersionSnake && { form_version: formVersionSnake }),
      ...(formVersion && { formVersion }),
      ...(formId && { form_id: formId }),
      ...(respondentEmail ? { respondent_email: respondentEmail } : { respondent_email: null }),
      ...(billingConsentText && { billing_consent_text: billingConsentText }),
      ...(scopeConsentText && { scope_consent_text: scopeConsentText }),
      ...(consentTexts && { consent_texts: consentTexts }),
    },
    mappingWarnings,
  };
}

async function normalizeRawPayload(input: {
  rawPayload: Record<string, unknown>;
  tx: Prisma.TransactionClient;
}): Promise<NormalizeRawPayloadResult> {
  const { rawPayload, tx } = input;
  const formKey = toOptionalString(rawPayload.form_id) ?? toOptionalString(rawPayload.formId) ?? DEFAULT_FORM_KEY;
  const mappingByField = await getActiveFormQuestionMappingsByField({
    tx,
    formKey,
  });
  const normalizedFromAnswers = normalizeFromAnswersWithMappings({
    rawPayload,
    mappingByField,
  });
  const fromAnswers = normalizedFromAnswers.payload;

  const contactChannel = toNullableString(rawPayload.contact_channel) ?? fromAnswers.contact_channel ?? null;
  const contactValue =
    toNullableString(rawPayload.contact_value) ??
    fromAnswers.contact_value ??
    toNullableString(rawPayload.respondentEmail) ??
    toNullableString(rawPayload.respondent_email) ??
    null;
  const targetUrl = toNullableString(rawPayload.target_url) ?? fromAnswers.target_url ?? null;
  const conditionDefinition =
    toNullableString(rawPayload.condition_definition) ?? fromAnswers.condition_definition ?? null;
  const requestWindow = toFormDateString(rawPayload.request_window) ?? fromAnswers.request_window ?? null;
  const checkFrequency = toNullableString(rawPayload.check_frequency) ?? fromAnswers.check_frequency ?? null;
  const billingConsent = rawPayload.billing_consent === true || fromAnswers.billing_consent === true;
  const scopeConsent = rawPayload.scope_consent === true || fromAnswers.scope_consent === true;

  const formVersion = toOptionalString(rawPayload.formVersion) ?? fromAnswers.formVersion;
  const formVersionSnake = toOptionalString(rawPayload.form_version) ?? fromAnswers.form_version;
  const billingConsentText = toOptionalString(rawPayload.billing_consent_text) ?? fromAnswers.billing_consent_text;
  const scopeConsentText = toOptionalString(rawPayload.scope_consent_text) ?? fromAnswers.scope_consent_text;
  const consentTexts = parseConsentTexts(rawPayload.consent_texts) ?? fromAnswers.consent_texts;
  const respondentEmail =
    toNullableString(rawPayload.respondent_email) ??
    toNullableString(rawPayload.respondentEmail) ??
    fromAnswers.respondent_email ??
    null;
  const formId = toOptionalString(rawPayload.form_id) ?? toOptionalString(rawPayload.formId) ?? fromAnswers.form_id;

  return {
    payload: {
      contact_channel: contactChannel,
      contact_value: contactValue,
      target_url: targetUrl,
      condition_definition: conditionDefinition,
      request_window: requestWindow,
      check_frequency: checkFrequency,
      billing_consent: billingConsent,
      scope_consent: scopeConsent,
      ...(formVersionSnake && { form_version: formVersionSnake }),
      ...(formVersion && { formVersion }),
      ...(consentTexts && { consent_texts: consentTexts }),
      ...(billingConsentText && { billing_consent_text: billingConsentText }),
      ...(scopeConsentText && { scope_consent_text: scopeConsentText }),
      ...(respondentEmail ? { respondent_email: respondentEmail } : { respondent_email: null }),
      ...(formId && { form_id: formId }),
    },
    mappingWarnings: normalizedFromAnswers.mappingWarnings,
  };
}

function toOutput(row: FormSubmissionRow): FormSubmissionOutput {
  return {
    id: row.id,
    responseId: row.responseId,
    status: row.status,
    rawPayload: row.rawPayload,
    formVersion: row.formVersion,
    sourceIp: row.sourceIp,
    extractedFields: row.extractedFields,
    rejectionReason: row.rejectionReason,
    consentBillingOnConditionMet: row.consentBillingOnConditionMet,
    consentServiceScope: row.consentServiceScope,
    consentCapturedAt: row.consentCapturedAt?.toISOString() ?? null,
    consentTexts: parseConsentTexts(row.consentTexts),
    receivedAt: row.receivedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function createFormSubmission(input: CreateFormSubmissionInput): Promise<CreateFormSubmissionResult> {
  try {
    const result = await prisma.$transaction(async (tx): Promise<FormSubmissionRow> => {
      const created = await tx.formSubmission.create({
        data: {
          responseId: input.responseId,
          rawPayload: input.rawPayload as unknown as Prisma.InputJsonValue,
          sourceIp: input.sourceIp,
        },
        select: FORM_SUBMISSION_SELECT,
      });

      // rawPayload 검증/추출
      const normalized = await normalizeRawPayload({
        rawPayload: input.rawPayload,
        tx,
      });
      const parseResult = rawPayloadFieldsSchema.safeParse(normalized.payload);

      if (parseResult.success) {
        const payloadFormVersion = parseResult.data.formVersion ?? parseResult.data.form_version ?? null;
        const payloadConsentTexts =
          parseResult.data.consent_texts ??
          (parseResult.data.billing_consent_text && parseResult.data.scope_consent_text
            ? { billing: parseResult.data.billing_consent_text, scope: parseResult.data.scope_consent_text }
            : null);
        const consentEvidence = resolveConsentEvidence({
          formVersion: payloadFormVersion,
          payloadConsentTexts,
        });

        await tx.formSubmission.update({
          where: { id: created.id },
          data: {
            extractedFields: {
              ...(parseResult.data as unknown as Record<string, unknown>),
              ...(normalized.mappingWarnings.length > 0 ? { mapping_warnings: normalized.mappingWarnings } : {}),
            } as unknown as Prisma.InputJsonValue,
            formVersion: consentEvidence.formVersion,
            consentBillingOnConditionMet: parseResult.data.billing_consent,
            consentServiceScope: parseResult.data.scope_consent,
            consentCapturedAt: new Date(),
            consentTexts: consentEvidence.consentTexts as unknown as Prisma.InputJsonValue,
            ...(normalized.mappingWarnings.length > 0
              ? {
                  status: 'NEEDS_REVIEW',
                  rejectionReason: normalized.mappingWarnings.join('; '),
                }
              : {}),
          },
          select: { id: true },
        });
      } else {
        const reasons = [
          ...normalized.mappingWarnings,
          ...parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        ];
        const hasNonConsentError = parseResult.error.errors.some((e) => {
          const field = String(e.path[0] ?? '');
          return field !== 'billing_consent' && field !== 'scope_consent';
        });

        await tx.formSubmission.update({
          where: { id: created.id },
          data: {
            status: hasNonConsentError ? 'NEEDS_REVIEW' : 'REJECTED',
            rejectionReason: reasons.join('; '),
          },
          select: { id: true },
        });
      }

      return tx.formSubmission.findUniqueOrThrow({
        where: { id: created.id },
        select: FORM_SUBMISSION_SELECT,
      });
    });

    return { submission: toOutput(result), created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.formSubmission.findUnique({
        where: { responseId: input.responseId },
        select: FORM_SUBMISSION_SELECT,
      });

      if (!existing) {
        throw error;
      }

      return { submission: toOutput(existing), created: false };
    }
    throw error;
  }
}

export async function getFormSubmissionById(id: string): Promise<FormSubmissionOutput | null> {
  const submission = await prisma.formSubmission.findUnique({
    where: { id },
    select: FORM_SUBMISSION_SELECT,
  });

  if (!submission) {
    return null;
  }

  return toOutput(submission);
}

export async function getFormSubmissions(input: GetFormSubmissionsInput): Promise<GetFormSubmissionsResult> {
  const where: Prisma.FormSubmissionWhereInput = {};

  if (input.status) {
    where.status = input.status;
  }

  const submissions = await prisma.formSubmission.findMany({
    where,
    select: FORM_SUBMISSION_SELECT,
    orderBy: { receivedAt: 'desc' },
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = submissions.length > input.limit;
  const items = hasMore ? submissions.slice(0, input.limit) : submissions;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  let total: number | undefined;
  if (!input.cursor) {
    total = await prisma.formSubmission.count({ where });
  }

  return {
    submissions: items.map(toOutput),
    nextCursor,
    ...(total !== undefined && { total }),
  };
}
