import { type FormSubmissionStatus, type Prisma, prisma } from '@workspace/db';
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

function isValidFutureDate(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

const rawPayloadFieldsSchema = z.object({
  contact_channel: z.enum(['카카오톡', '이메일']),
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
      const parseResult = rawPayloadFieldsSchema.safeParse(input.rawPayload);

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
            extractedFields: parseResult.data as unknown as Prisma.InputJsonValue,
            formVersion: consentEvidence.formVersion,
            consentBillingOnConditionMet: parseResult.data.billing_consent,
            consentServiceScope: parseResult.data.scope_consent,
            consentCapturedAt: new Date(),
            consentTexts: consentEvidence.consentTexts as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
      } else {
        const reasons = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        await tx.formSubmission.update({
          where: { id: created.id },
          data: {
            status: 'REJECTED',
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
