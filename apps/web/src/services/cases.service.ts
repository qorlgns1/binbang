import { type CaseStatus, type Prisma, prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface CreateCaseInput {
  submissionId: string;
  changedById: string;
}

export interface TransitionCaseStatusInput {
  caseId: string;
  toStatus: CaseStatus;
  changedById: string;
  reason?: string;
}

export interface CaseOutput {
  id: string;
  submissionId: string;
  status: CaseStatus;
  assignedTo: string | null;
  statusChangedAt: string;
  statusChangedBy: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDetailOutput extends CaseOutput {
  submission: {
    id: string;
    responseId: string;
    status: string;
    rawPayload: unknown;
    extractedFields: unknown;
    rejectionReason: string | null;
    receivedAt: string;
  };
  statusLogs: CaseStatusLogOutput[];
}

export interface CaseStatusLogOutput {
  id: string;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  changedById: string;
  reason: string | null;
  createdAt: string;
}

export interface GetCasesInput {
  cursor?: string;
  limit: number;
  status?: CaseStatus;
}

export interface GetCasesResult {
  cases: CaseOutput[];
  nextCursor: string | null;
  total?: number;
}

// ============================================================================
// State Machine
// ============================================================================

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  RECEIVED: ['REVIEWING'],
  REVIEWING: ['WAITING_PAYMENT', 'REJECTED'],
  WAITING_PAYMENT: ['ACTIVE_MONITORING', 'CANCELLED'],
  ACTIVE_MONITORING: ['CONDITION_MET', 'EXPIRED', 'CANCELLED'],
  CONDITION_MET: ['BILLED'],
  BILLED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Shared select
// ============================================================================

const CASE_SELECT = {
  id: true,
  submissionId: true,
  status: true,
  assignedTo: true,
  statusChangedAt: true,
  statusChangedBy: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

const CASE_STATUS_LOG_SELECT = {
  id: true,
  fromStatus: true,
  toStatus: true,
  changedById: true,
  reason: true,
  createdAt: true,
} as const;

const CASE_DETAIL_SELECT = {
  ...CASE_SELECT,
  submission: {
    select: {
      id: true,
      responseId: true,
      status: true,
      rawPayload: true,
      extractedFields: true,
      rejectionReason: true,
      receivedAt: true,
    },
  },
  statusLogs: {
    select: CASE_STATUS_LOG_SELECT,
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

// ============================================================================
// Helpers
// ============================================================================

interface CaseRow {
  id: string;
  submissionId: string;
  status: CaseStatus;
  assignedTo: string | null;
  statusChangedAt: Date;
  statusChangedBy: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toCaseOutput(row: CaseRow): CaseOutput {
  return {
    id: row.id,
    submissionId: row.submissionId,
    status: row.status,
    assignedTo: row.assignedTo,
    statusChangedAt: row.statusChangedAt.toISOString(),
    statusChangedBy: row.statusChangedBy,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

interface CaseDetailRow extends CaseRow {
  submission: {
    id: string;
    responseId: string;
    status: string;
    rawPayload: unknown;
    extractedFields: unknown;
    rejectionReason: string | null;
    receivedAt: Date;
  };
  statusLogs: {
    id: string;
    fromStatus: CaseStatus;
    toStatus: CaseStatus;
    changedById: string;
    reason: string | null;
    createdAt: Date;
  }[];
}

function toCaseDetailOutput(row: CaseDetailRow): CaseDetailOutput {
  return {
    ...toCaseOutput(row),
    submission: {
      id: row.submission.id,
      responseId: row.submission.responseId,
      status: row.submission.status,
      rawPayload: row.submission.rawPayload,
      extractedFields: row.submission.extractedFields,
      rejectionReason: row.submission.rejectionReason,
      receivedAt: row.submission.receivedAt.toISOString(),
    },
    statusLogs: row.statusLogs.map(
      (log): CaseStatusLogOutput => ({
        id: log.id,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        changedById: log.changedById,
        reason: log.reason,
        createdAt: log.createdAt.toISOString(),
      }),
    ),
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function createCase(input: CreateCaseInput): Promise<CaseDetailOutput> {
  const result = await prisma.$transaction(async (tx): Promise<CaseDetailRow> => {
    const submission = await tx.formSubmission.findUnique({
      where: { id: input.submissionId },
      select: { id: true, status: true, extractedFields: true },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status === 'REJECTED') {
      throw new Error('Cannot create case from rejected submission');
    }

    if (submission.status === 'PROCESSED') {
      throw new Error('Submission already processed');
    }

    if (!submission.extractedFields) {
      throw new Error('Submission has no extracted fields');
    }

    await tx.formSubmission.update({
      where: { id: input.submissionId },
      data: { status: 'PROCESSED' },
      select: { id: true },
    });

    const created = await tx.case.create({
      data: {
        submissionId: input.submissionId,
        statusChangedBy: input.changedById,
      },
      select: CASE_DETAIL_SELECT,
    });

    await tx.caseStatusLog.create({
      data: {
        caseId: created.id,
        fromStatus: 'RECEIVED',
        toStatus: 'RECEIVED',
        changedById: input.changedById,
        reason: 'Case created from form submission',
      },
      select: { id: true },
    });

    return tx.case.findUniqueOrThrow({
      where: { id: created.id },
      select: CASE_DETAIL_SELECT,
    });
  });

  return toCaseDetailOutput(result);
}

export async function transitionCaseStatus(input: TransitionCaseStatusInput): Promise<CaseDetailOutput> {
  const result = await prisma.$transaction(async (tx): Promise<CaseDetailRow> => {
    const current = await tx.case.findUnique({
      where: { id: input.caseId },
      select: { id: true, status: true },
    });

    if (!current) {
      throw new Error('Case not found');
    }

    if (!isValidTransition(current.status, input.toStatus)) {
      throw new Error(`Invalid transition: ${current.status} → ${input.toStatus}`);
    }

    await tx.case.update({
      where: { id: input.caseId },
      data: {
        status: input.toStatus,
        statusChangedAt: new Date(),
        statusChangedBy: input.changedById,
      },
      select: { id: true },
    });

    await tx.caseStatusLog.create({
      data: {
        caseId: input.caseId,
        fromStatus: current.status,
        toStatus: input.toStatus,
        changedById: input.changedById,
        reason: input.reason,
      },
      select: { id: true },
    });

    return tx.case.findUniqueOrThrow({
      where: { id: input.caseId },
      select: CASE_DETAIL_SELECT,
    });
  });

  return toCaseDetailOutput(result);
}

export async function getCaseById(id: string): Promise<CaseDetailOutput | null> {
  const row = await prisma.case.findUnique({
    where: { id },
    select: CASE_DETAIL_SELECT,
  });

  if (!row) {
    return null;
  }

  return toCaseDetailOutput(row);
}

export async function getCases(input: GetCasesInput): Promise<GetCasesResult> {
  const where: Prisma.CaseWhereInput = {};

  if (input.status) {
    where.status = input.status;
  }

  const cases = await prisma.case.findMany({
    where,
    select: CASE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = cases.length > input.limit;
  const items = hasMore ? cases.slice(0, input.limit) : cases;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  let total: number | undefined;
  if (!input.cursor) {
    total = await prisma.case.count({ where });
  }

  return {
    cases: items.map(toCaseOutput),
    nextCursor,
    ...(total !== undefined && { total }),
  };
}
