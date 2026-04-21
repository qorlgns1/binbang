import {
  Accommodation,
  Case,
  CaseStatus,
  CaseStatusLog,
  ConditionMetEvent,
  FormSubmission,
  FormSubmissionStatus,
  type EntityManager,
  getDataSource,
} from '@workspace/db';
import { BadRequestError, ConflictError, NotFoundError } from '@workspace/shared/errors';

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

export interface CaseMessageOutput {
  id: string;
  templateKey: string;
  channel: string;
  content: string;
  sentById: string;
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
  messages: CaseMessageOutput[];
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
  [CaseStatus.RECEIVED]: [CaseStatus.REVIEWING],
  [CaseStatus.REVIEWING]: [CaseStatus.NEEDS_CLARIFICATION, CaseStatus.WAITING_PAYMENT, CaseStatus.REJECTED],
  [CaseStatus.NEEDS_CLARIFICATION]: [CaseStatus.REVIEWING],
  [CaseStatus.WAITING_PAYMENT]: [CaseStatus.ACTIVE_MONITORING, CaseStatus.CANCELLED],
  [CaseStatus.ACTIVE_MONITORING]: [CaseStatus.CONDITION_MET, CaseStatus.EXPIRED, CaseStatus.CANCELLED],
  [CaseStatus.CONDITION_MET]: [CaseStatus.BILLED],
  [CaseStatus.BILLED]: [CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [],
  [CaseStatus.REJECTED]: [],
  [CaseStatus.EXPIRED]: [],
  [CaseStatus.CANCELLED]: [],
};

export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

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
  messages: {
    id: string;
    templateKey: string;
    channel: string;
    content: string;
    sentById: string;
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
    messages: row.messages.map(
      (m): CaseMessageOutput => ({
        id: m.id,
        templateKey: m.templateKey,
        channel: m.channel,
        content: m.content,
        sentById: m.sentById,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  };
}

async function loadCaseDetail(manager: EntityManager, id: string): Promise<CaseDetailRow | null> {
  const entity = await manager.findOne(Case, {
    where: { id },
    relations: {
      submission: true,
      statusLogs: true,
      conditionMetEvents: true,
      notifications: true,
      billingEvent: true,
      messages: true,
    },
  });
  if (!entity) return null;

  entity.statusLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  entity.conditionMetEvents.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  entity.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  entity.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return entity as unknown as CaseDetailRow;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function createCase(input: CreateCaseInput): Promise<CaseDetailOutput> {
  const ds = await getDataSource();

  const result = await ds.transaction(async (manager): Promise<CaseDetailRow> => {
    const submission = await manager.findOne(FormSubmission, {
      where: { id: input.submissionId },
      select: { id: true, status: true, extractedFields: true },
    });

    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    if (submission.status === FormSubmissionStatus.REJECTED) {
      throw new ConflictError('Cannot create case from rejected submission');
    }

    if (submission.status === FormSubmissionStatus.PROCESSED) {
      throw new ConflictError('Submission already processed');
    }

    if (!submission.extractedFields) {
      throw new BadRequestError('Submission has no extracted fields');
    }

    const extracted = submission.extractedFields as Record<string, unknown>;
    const conditionText = typeof extracted.condition_definition === 'string' ? extracted.condition_definition : '';
    const ambiguity = analyzeCondition(conditionText);

    await manager
      .getRepository(FormSubmission)
      .update({ id: input.submissionId }, { status: FormSubmissionStatus.PROCESSED });

    const newCase = manager.getRepository(Case).create({
      submissionId: input.submissionId,
      statusChangedBy: input.changedById,
      ambiguityResult: ambiguity as object,
    });
    await manager.getRepository(Case).save(newCase);

    const statusLog = manager.getRepository(CaseStatusLog).create({
      caseId: newCase.id,
      fromStatus: CaseStatus.RECEIVED,
      toStatus: CaseStatus.RECEIVED,
      changedById: input.changedById,
      reason: 'Case created from form submission',
    });
    await manager.getRepository(CaseStatusLog).save(statusLog);

    const fullCase = await loadCaseDetail(manager, newCase.id);
    if (!fullCase) throw new Error('Case not found after creation');
    return fullCase;
  });

  return toCaseDetailOutput(result);
}

export async function transitionCaseStatus(input: TransitionCaseStatusInput): Promise<CaseDetailOutput> {
  const ds = await getDataSource();

  const result = await ds.transaction(async (manager): Promise<CaseDetailRow> => {
    const current = await manager.findOne(Case, {
      where: { id: input.caseId },
      select: {
        id: true,
        status: true,
        ambiguityResult: true,
        clarificationResolvedAt: true,
        paymentConfirmedAt: true,
        accommodationId: true,
      },
    });

    if (!current) {
      throw new NotFoundError('Case not found');
    }

    if (!isValidTransition(current.status, input.toStatus)) {
      throw new BadRequestError(`Invalid transition: ${current.status} → ${input.toStatus}`);
    }

    // Guard: REVIEWING → WAITING_PAYMENT requires resolved ambiguity
    if (current.status === CaseStatus.REVIEWING && input.toStatus === CaseStatus.WAITING_PAYMENT) {
      const ambiguity = current.ambiguityResult as AmbiguityResult | null;
      if (ambiguity && ambiguity.severity !== 'GREEN' && !current.clarificationResolvedAt) {
        throw new BadRequestError('Ambiguity must be resolved before payment');
      }
    }

    // Guard: WAITING_PAYMENT → ACTIVE_MONITORING requires payment confirmation + accommodation link
    if (current.status === CaseStatus.WAITING_PAYMENT && input.toStatus === CaseStatus.ACTIVE_MONITORING) {
      if (!current.paymentConfirmedAt) {
        throw new BadRequestError('Payment must be confirmed before monitoring start');
      }
      if (!current.accommodationId) {
        throw new BadRequestError('Accommodation must be linked before monitoring start');
      }
    }

    // Guard: ACTIVE_MONITORING → CONDITION_MET requires at least one evidence
    if (current.status === CaseStatus.ACTIVE_MONITORING && input.toStatus === CaseStatus.CONDITION_MET) {
      const count = await manager.count(ConditionMetEvent, { where: { caseId: input.caseId } });
      if (count === 0) {
        throw new BadRequestError('At least one condition met evidence is required');
      }
    }

    const updateData: Partial<Case> = {
      status: input.toStatus,
      statusChangedAt: new Date(),
      statusChangedBy: input.changedById,
    };

    // Set clarificationResolvedAt when resolving clarification
    if (current.status === CaseStatus.NEEDS_CLARIFICATION && input.toStatus === CaseStatus.REVIEWING) {
      updateData.clarificationResolvedAt = new Date();
    }

    await manager.getRepository(Case).update({ id: input.caseId }, updateData);

    const statusLog = manager.getRepository(CaseStatusLog).create({
      caseId: input.caseId,
      fromStatus: current.status,
      toStatus: input.toStatus,
      changedById: input.changedById,
      reason: input.reason,
    });
    await manager.getRepository(CaseStatusLog).save(statusLog);

    const fullCase = await loadCaseDetail(manager, input.caseId);
    if (!fullCase) throw new Error('Case not found after update');
    return fullCase;
  });

  return toCaseDetailOutput(result);
}

export async function confirmPayment(input: ConfirmPaymentInput): Promise<CaseDetailOutput> {
  const ds = await getDataSource();

  const result = await ds.transaction(async (manager): Promise<CaseDetailRow> => {
    const current = await manager.findOne(Case, {
      where: { id: input.caseId },
      select: { id: true, status: true, paymentConfirmedAt: true },
    });

    if (!current) {
      throw new NotFoundError('Case not found');
    }

    if (current.status !== CaseStatus.WAITING_PAYMENT) {
      throw new BadRequestError(`Payment confirmation requires WAITING_PAYMENT status, current: ${current.status}`);
    }

    if (current.paymentConfirmedAt) {
      throw new ConflictError('Payment already confirmed');
    }

    await manager.getRepository(Case).update(
      { id: input.caseId },
      {
        paymentConfirmedAt: new Date(),
        paymentConfirmedBy: input.confirmedById,
      },
    );

    const statusLog = manager.getRepository(CaseStatusLog).create({
      caseId: input.caseId,
      fromStatus: CaseStatus.WAITING_PAYMENT,
      toStatus: CaseStatus.WAITING_PAYMENT,
      changedById: input.confirmedById,
      reason: input.note ?? '결제 확인',
    });
    await manager.getRepository(CaseStatusLog).save(statusLog);

    const fullCase = await loadCaseDetail(manager, input.caseId);
    if (!fullCase) throw new Error('Case not found after update');
    return fullCase;
  });

  return toCaseDetailOutput(result);
}

export async function linkAccommodation(input: LinkAccommodationInput): Promise<CaseDetailOutput> {
  const ds = await getDataSource();

  const result = await ds.transaction(async (manager): Promise<CaseDetailRow> => {
    const current = await manager.findOne(Case, {
      where: { id: input.caseId },
      select: { id: true, status: true, accommodationId: true },
    });

    if (!current) {
      throw new NotFoundError('Case not found');
    }

    if (current.status !== CaseStatus.WAITING_PAYMENT) {
      throw new BadRequestError(`Accommodation link requires WAITING_PAYMENT status, current: ${current.status}`);
    }

    const accommodation = await manager.findOne(Accommodation, {
      where: { id: input.accommodationId },
      select: { id: true },
    });

    if (!accommodation) {
      throw new NotFoundError('Accommodation not found');
    }

    await manager.getRepository(Case).update({ id: input.caseId }, { accommodationId: input.accommodationId });

    const statusLog = manager.getRepository(CaseStatusLog).create({
      caseId: input.caseId,
      fromStatus: CaseStatus.WAITING_PAYMENT,
      toStatus: CaseStatus.WAITING_PAYMENT,
      changedById: input.changedById,
      reason: `숙소 연결: ${input.accommodationId}`,
    });
    await manager.getRepository(CaseStatusLog).save(statusLog);

    const fullCase = await loadCaseDetail(manager, input.caseId);
    if (!fullCase) throw new Error('Case not found after update');
    return fullCase;
  });

  return toCaseDetailOutput(result);
}

export async function getCaseById(id: string): Promise<CaseDetailOutput | null> {
  const ds = await getDataSource();
  const row = await loadCaseDetail(ds.manager, id);
  return row ? toCaseDetailOutput(row) : null;
}

export async function getCases(input: GetCasesInput): Promise<GetCasesResult> {
  const ds = await getDataSource();
  const repo = ds.getRepository(Case);

  const qb = repo.createQueryBuilder('c');

  if (input.status) {
    qb.where('c.status = :status', { status: input.status });
  }

  if (input.cursor) {
    const cursorItem = await repo.findOne({ where: { id: input.cursor }, select: { id: true, createdAt: true } });
    if (cursorItem) {
      qb.andWhere('(c.createdAt < :cursorDate OR (c.createdAt = :cursorDate AND c.id < :cursorId))', {
        cursorDate: cursorItem.createdAt,
        cursorId: input.cursor,
      });
    }
  }

  qb.orderBy('c.createdAt', 'DESC')
    .addOrderBy('c.id', 'DESC')
    .limit(input.limit + 1);

  const cases = await qb.getMany();

  const hasMore = cases.length > input.limit;
  const items = hasMore ? cases.slice(0, input.limit) : cases;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  let total: number | undefined;
  if (!input.cursor) {
    const countQb = repo.createQueryBuilder('c');
    if (input.status) {
      countQb.where('c.status = :status', { status: input.status });
    }
    total = await countQb.getCount();
  }

  return {
    cases: items.map((c) => toCaseOutput(c as unknown as CaseRow)),
    nextCursor,
    ...(total !== undefined && { total }),
  };
}
