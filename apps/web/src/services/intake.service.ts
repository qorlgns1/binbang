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

export interface FormSubmissionOutput {
  id: string;
  responseId: string;
  status: FormSubmissionStatus;
  rawPayload: unknown;
  formVersion: string | null;
  sourceIp: string | null;
  extractedFields: unknown;
  rejectionReason: string | null;
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
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
});

function isUniqueConstraintError(error: unknown): boolean {
  return error != null && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002';
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
    receivedAt: row.receivedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

async function validateAndExtractFields(submissionId: string, rawPayload: Record<string, unknown>): Promise<void> {
  const result = rawPayloadFieldsSchema.safeParse(rawPayload);

  if (result.success) {
    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: { extractedFields: result.data as unknown as Prisma.InputJsonValue },
      select: { id: true },
    });
  } else {
    const reasons = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        rejectionReason: reasons.join('; '),
      },
      select: { id: true },
    });
  }
}

export async function createFormSubmission(input: CreateFormSubmissionInput): Promise<CreateFormSubmissionResult> {
  try {
    const created = await prisma.formSubmission.create({
      data: {
        responseId: input.responseId,
        rawPayload: input.rawPayload as unknown as Prisma.InputJsonValue,
        sourceIp: input.sourceIp,
      },
      select: FORM_SUBMISSION_SELECT,
    });

    // 신규 생성 후 rawPayload 검증/추출
    await validateAndExtractFields(created.id, input.rawPayload);

    // 검증 결과가 반영된 최신 상태 조회
    const updated = await prisma.formSubmission.findUnique({
      where: { id: created.id },
      select: FORM_SUBMISSION_SELECT,
    });

    return { submission: toOutput(updated ?? created), created: true };
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
