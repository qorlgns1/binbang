import { type CaseStatus, type Prisma, prisma } from '@workspace/db';

import { type AmbiguityResult, analyzeCondition } from './condition-parser.service';

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

export interface ConfirmPaymentInput {
  caseId: string;
  confirmedById: string;
  note?: string;
}

export interface LinkAccommodationInput {
  caseId: string;
  accommodationId: string;
  changedById: string;
}

export interface CaseOutput {
  id: string;
  submissionId: string;
  status: CaseStatus;
  assignedTo: string | null;
  statusChangedAt: string;
  statusChangedBy: string | null;
  note: string | null;
  ambiguityResult: AmbiguityResult | null;
  clarificationResolvedAt: string | null;
  paymentConfirmedAt: string | null;
  paymentConfirmedBy: string | null;
  accommodationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionMetEventOutput {
  id: string;
  checkLogId: string;
  evidenceSnapshot: unknown;
  screenshotBase64: string | null;
  capturedAt: string;
  createdAt: string;
}

export interface CaseNotificationOutput {
  id: string;
  channel: string;
  status: string;
  payload: unknown;
  sentAt: string | null;
  failReason: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export interface BillingEventOutput {
  id: string;
  type: string;
  amountKrw: number;
  description: string | null;
  createdAt: string;
}

export interface CaseDetailOutput extends CaseOutput {
  submission: {
    id: string;
    responseId: string;
    status: string;
    rawPayload: unknown;
    extractedFields: unknown;
    rejectionReason: string | null;
    consentBillingOnConditionMet: boolean | null;
    consentServiceScope: boolean | null;
    consentCapturedAt: string | null;
    consentTexts: { billing: string; scope: string } | null;
    receivedAt: string;
  };
  statusLogs: CaseStatusLogOutput[];
  conditionMetEvents: ConditionMetEventOutput[];
  notifications: CaseNotificationOutput[];
  billingEvent: BillingEventOutput | null;
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
  REVIEWING: ['NEEDS_CLARIFICATION', 'WAITING_PAYMENT', 'REJECTED'],
  NEEDS_CLARIFICATION: ['REVIEWING'],
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
  ambiguityResult: true,
  clarificationResolvedAt: true,
  paymentConfirmedAt: true,
  paymentConfirmedBy: true,
  accommodationId: true,
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
      consentBillingOnConditionMet: true,
      consentServiceScope: true,
      consentCapturedAt: true,
      consentTexts: true,
      receivedAt: true,
    },
  },
  statusLogs: {
    select: CASE_STATUS_LOG_SELECT,
    orderBy: { createdAt: 'desc' as const },
  },
  conditionMetEvents: {
    select: {
      id: true,
      checkLogId: true,
      evidenceSnapshot: true,
      screenshotBase64: true,
      capturedAt: true,
      createdAt: true,
    },
    orderBy: { capturedAt: 'desc' as const },
  },
  notifications: {
    select: {
      id: true,
      channel: true,
      status: true,
      payload: true,
      sentAt: true,
      failReason: true,
      retryCount: true,
      maxRetries: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  billingEvent: {
    select: {
      id: true,
      type: true,
      amountKrw: true,
      description: true,
      createdAt: true,
    },
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
  ambiguityResult: unknown;
  clarificationResolvedAt: Date | null;
  paymentConfirmedAt: Date | null;
  paymentConfirmedBy: string | null;
  accommodationId: string | null;
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
    ambiguityResult: (row.ambiguityResult as AmbiguityResult) ?? null,
    clarificationResolvedAt: row.clarificationResolvedAt?.toISOString() ?? null,
    paymentConfirmedAt: row.paymentConfirmedAt?.toISOString() ?? null,
    paymentConfirmedBy: row.paymentConfirmedBy,
    accommodationId: row.accommodationId,
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
    consentBillingOnConditionMet: boolean | null;
    consentServiceScope: boolean | null;
    consentCapturedAt: Date | null;
    consentTexts: unknown;
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
  conditionMetEvents: {
    id: string;
    checkLogId: string;
    evidenceSnapshot: unknown;
    screenshotBase64: string | null;
    capturedAt: Date;
    createdAt: Date;
  }[];
  notifications: {
    id: string;
    channel: string;
    status: string;
    payload: unknown;
    sentAt: Date | null;
    failReason: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
  }[];
  billingEvent: {
    id: string;
    type: string;
    amountKrw: number;
    description: string | null;
    createdAt: Date;
  } | null;
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
      consentBillingOnConditionMet: row.submission.consentBillingOnConditionMet,
      consentServiceScope: row.submission.consentServiceScope,
      consentCapturedAt: row.submission.consentCapturedAt?.toISOString() ?? null,
      consentTexts: (row.submission.consentTexts as { billing: string; scope: string }) ?? null,
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
    conditionMetEvents: row.conditionMetEvents.map(
      (evt): ConditionMetEventOutput => ({
        id: evt.id,
        checkLogId: evt.checkLogId,
        evidenceSnapshot: evt.evidenceSnapshot,
        screenshotBase64: evt.screenshotBase64,
        capturedAt: evt.capturedAt.toISOString(),
        createdAt: evt.createdAt.toISOString(),
      }),
    ),
    notifications: row.notifications.map(
      (n): CaseNotificationOutput => ({
        id: n.id,
        channel: n.channel,
        status: n.status,
        payload: n.payload,
        sentAt: n.sentAt?.toISOString() ?? null,
        failReason: n.failReason,
        retryCount: n.retryCount,
        maxRetries: n.maxRetries,
        createdAt: n.createdAt.toISOString(),
      }),
    ),
    billingEvent: row.billingEvent
      ? {
          id: row.billingEvent.id,
          type: row.billingEvent.type,
          amountKrw: row.billingEvent.amountKrw,
          description: row.billingEvent.description,
          createdAt: row.billingEvent.createdAt.toISOString(),
        }
      : null,
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

    const extracted = submission.extractedFields as Record<string, unknown>;
    const conditionText = typeof extracted.condition_definition === 'string' ? extracted.condition_definition : '';
    const ambiguity = analyzeCondition(conditionText);

    await tx.formSubmission.update({
      where: { id: input.submissionId },
      data: { status: 'PROCESSED' },
      select: { id: true },
    });

    const created = await tx.case.create({
      data: {
        submissionId: input.submissionId,
        statusChangedBy: input.changedById,
        ambiguityResult: ambiguity as unknown as Prisma.InputJsonValue,
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
      select: {
        id: true,
        status: true,
        ambiguityResult: true,
        clarificationResolvedAt: true,
        paymentConfirmedAt: true,
        accommodationId: true,
        _count: { select: { conditionMetEvents: true } },
      },
    });

    if (!current) {
      throw new Error('Case not found');
    }

    if (!isValidTransition(current.status, input.toStatus)) {
      throw new Error(`Invalid transition: ${current.status} → ${input.toStatus}`);
    }

    // Guard: REVIEWING → WAITING_PAYMENT requires resolved ambiguity
    if (current.status === 'REVIEWING' && input.toStatus === 'WAITING_PAYMENT') {
      const ambiguity = current.ambiguityResult as AmbiguityResult | null;
      if (ambiguity && ambiguity.severity !== 'GREEN' && !current.clarificationResolvedAt) {
        throw new Error('Ambiguity must be resolved before payment');
      }
    }

    // Guard: WAITING_PAYMENT → ACTIVE_MONITORING requires payment confirmation + accommodation link
    if (current.status === 'WAITING_PAYMENT' && input.toStatus === 'ACTIVE_MONITORING') {
      if (!current.paymentConfirmedAt) {
        throw new Error('Payment must be confirmed before monitoring start');
      }
      if (!current.accommodationId) {
        throw new Error('Accommodation must be linked before monitoring start');
      }
    }

    // Guard: ACTIVE_MONITORING → CONDITION_MET requires at least one evidence
    if (current.status === 'ACTIVE_MONITORING' && input.toStatus === 'CONDITION_MET') {
      if (current._count.conditionMetEvents === 0) {
        throw new Error('At least one condition met evidence is required');
      }
    }

    const updateData: Record<string, unknown> = {
      status: input.toStatus,
      statusChangedAt: new Date(),
      statusChangedBy: input.changedById,
    };

    // Set clarificationResolvedAt when resolving clarification
    if (current.status === 'NEEDS_CLARIFICATION' && input.toStatus === 'REVIEWING') {
      updateData.clarificationResolvedAt = new Date();
    }

    await tx.case.update({
      where: { id: input.caseId },
      data: updateData,
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

export async function confirmPayment(input: ConfirmPaymentInput): Promise<CaseDetailOutput> {
  const result = await prisma.$transaction(async (tx): Promise<CaseDetailRow> => {
    const current = await tx.case.findUnique({
      where: { id: input.caseId },
      select: { id: true, status: true, paymentConfirmedAt: true },
    });

    if (!current) {
      throw new Error('Case not found');
    }

    if (current.status !== 'WAITING_PAYMENT') {
      throw new Error(`Payment confirmation requires WAITING_PAYMENT status, current: ${current.status}`);
    }

    if (current.paymentConfirmedAt) {
      throw new Error('Payment already confirmed');
    }

    await tx.case.update({
      where: { id: input.caseId },
      data: {
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: input.confirmedById,
      },
      select: { id: true },
    });

    await tx.caseStatusLog.create({
      data: {
        caseId: input.caseId,
        fromStatus: 'WAITING_PAYMENT',
        toStatus: 'WAITING_PAYMENT',
        changedById: input.confirmedById,
        reason: input.note ?? '결제 확인',
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

export async function linkAccommodation(input: LinkAccommodationInput): Promise<CaseDetailOutput> {
  const result = await prisma.$transaction(async (tx): Promise<CaseDetailRow> => {
    const current = await tx.case.findUnique({
      where: { id: input.caseId },
      select: { id: true, status: true, accommodationId: true },
    });

    if (!current) {
      throw new Error('Case not found');
    }

    if (current.status !== 'WAITING_PAYMENT') {
      throw new Error(`Accommodation link requires WAITING_PAYMENT status, current: ${current.status}`);
    }

    const accommodation = await tx.accommodation.findUnique({
      where: { id: input.accommodationId },
      select: { id: true },
    });

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    await tx.case.update({
      where: { id: input.caseId },
      data: { accommodationId: input.accommodationId },
      select: { id: true },
    });

    await tx.caseStatusLog.create({
      data: {
        caseId: input.caseId,
        fromStatus: 'WAITING_PAYMENT',
        toStatus: 'WAITING_PAYMENT',
        changedById: input.changedById,
        reason: `숙소 연결: ${input.accommodationId}`,
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
