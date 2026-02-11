import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCase, getCaseById, getCases, isValidTransition, transitionCaseStatus } from './cases.service';

// ============================================================================
// Mock setup
// ============================================================================

const {
  mockCaseCreate,
  mockCaseFindUnique,
  mockCaseFindUniqueOrThrow,
  mockCaseFindMany,
  mockCaseUpdate,
  mockCaseCount,
  mockSubmissionFindUnique,
  mockSubmissionUpdate,
  mockStatusLogCreate,
  mockTransaction,
} = vi.hoisted(
  (): {
    mockCaseCreate: ReturnType<typeof vi.fn>;
    mockCaseFindUnique: ReturnType<typeof vi.fn>;
    mockCaseFindUniqueOrThrow: ReturnType<typeof vi.fn>;
    mockCaseFindMany: ReturnType<typeof vi.fn>;
    mockCaseUpdate: ReturnType<typeof vi.fn>;
    mockCaseCount: ReturnType<typeof vi.fn>;
    mockSubmissionFindUnique: ReturnType<typeof vi.fn>;
    mockSubmissionUpdate: ReturnType<typeof vi.fn>;
    mockStatusLogCreate: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
  } => ({
    mockCaseCreate: vi.fn(),
    mockCaseFindUnique: vi.fn(),
    mockCaseFindUniqueOrThrow: vi.fn(),
    mockCaseFindMany: vi.fn(),
    mockCaseUpdate: vi.fn(),
    mockCaseCount: vi.fn(),
    mockSubmissionFindUnique: vi.fn(),
    mockSubmissionUpdate: vi.fn(),
    mockStatusLogCreate: vi.fn(),
    mockTransaction: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    case: {
      create: mockCaseCreate,
      findUnique: mockCaseFindUnique,
      findUniqueOrThrow: mockCaseFindUniqueOrThrow,
      findMany: mockCaseFindMany,
      update: mockCaseUpdate,
      count: mockCaseCount,
    },
    formSubmission: {
      findUnique: mockSubmissionFindUnique,
      update: mockSubmissionUpdate,
    },
    caseStatusLog: {
      create: mockStatusLogCreate,
    },
    $transaction: mockTransaction,
  },
}));

// ============================================================================
// Helpers
// ============================================================================

const NOW = new Date('2026-02-11T10:00:00.000Z');

function makeCaseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'case-1',
    submissionId: 'sub-1',
    status: 'RECEIVED',
    assignedTo: null,
    statusChangedAt: NOW,
    statusChangedBy: 'admin-1',
    note: null,
    ambiguityResult: null,
    clarificationResolvedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeCaseDetailRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ...makeCaseRow(),
    submission: {
      id: 'sub-1',
      responseId: 'resp-abc',
      status: 'PROCESSED',
      rawPayload: { contact_channel: '카카오톡' },
      extractedFields: {
        contact_channel: '카카오톡',
        condition_definition: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
      },
      rejectionReason: null,
      receivedAt: NOW,
    },
    statusLogs: [
      {
        id: 'log-1',
        fromStatus: 'RECEIVED',
        toStatus: 'RECEIVED',
        changedById: 'admin-1',
        reason: 'Case created from form submission',
        createdAt: NOW,
      },
    ],
    ...overrides,
  };
}

function setupTransactionMock(): void {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      case: {
        create: mockCaseCreate,
        findUnique: mockCaseFindUnique,
        findUniqueOrThrow: mockCaseFindUniqueOrThrow,
        update: mockCaseUpdate,
      },
      formSubmission: {
        findUnique: mockSubmissionFindUnique,
        update: mockSubmissionUpdate,
      },
      caseStatusLog: {
        create: mockStatusLogCreate,
      },
    };
    return fn(tx);
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('cases.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    setupTransactionMock();
  });

  // ==========================================================================
  // isValidTransition
  // ==========================================================================

  describe('isValidTransition', (): void => {
    it('allows RECEIVED → REVIEWING', (): void => {
      expect(isValidTransition('RECEIVED', 'REVIEWING')).toBe(true);
    });

    it('allows REVIEWING → WAITING_PAYMENT', (): void => {
      expect(isValidTransition('REVIEWING', 'WAITING_PAYMENT')).toBe(true);
    });

    it('allows REVIEWING → REJECTED', (): void => {
      expect(isValidTransition('REVIEWING', 'REJECTED')).toBe(true);
    });

    it('allows ACTIVE_MONITORING → CONDITION_MET', (): void => {
      expect(isValidTransition('ACTIVE_MONITORING', 'CONDITION_MET')).toBe(true);
    });

    it('allows REVIEWING → NEEDS_CLARIFICATION', (): void => {
      expect(isValidTransition('REVIEWING', 'NEEDS_CLARIFICATION')).toBe(true);
    });

    it('allows NEEDS_CLARIFICATION → REVIEWING', (): void => {
      expect(isValidTransition('NEEDS_CLARIFICATION', 'REVIEWING')).toBe(true);
    });

    it('rejects RECEIVED → ACTIVE_MONITORING', (): void => {
      expect(isValidTransition('RECEIVED', 'ACTIVE_MONITORING')).toBe(false);
    });

    it('rejects terminal state CLOSED → anything', (): void => {
      expect(isValidTransition('CLOSED', 'RECEIVED')).toBe(false);
    });

    it('rejects terminal state REJECTED → anything', (): void => {
      expect(isValidTransition('REJECTED', 'REVIEWING')).toBe(false);
    });

    it('rejects terminal state CANCELLED → anything', (): void => {
      expect(isValidTransition('CANCELLED', 'RECEIVED')).toBe(false);
    });

    it('rejects terminal state EXPIRED → anything', (): void => {
      expect(isValidTransition('EXPIRED', 'RECEIVED')).toBe(false);
    });
  });

  // ==========================================================================
  // createCase
  // ==========================================================================

  describe('createCase', (): void => {
    it('creates a case from valid submission', async (): Promise<void> => {
      mockSubmissionFindUnique.mockResolvedValue({
        id: 'sub-1',
        status: 'RECEIVED',
        extractedFields: {
          contact_channel: '카카오톡',
          condition_definition: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
        },
      });
      mockSubmissionUpdate.mockResolvedValue({ id: 'sub-1' });
      mockCaseCreate.mockResolvedValue(makeCaseDetailRow());
      mockStatusLogCreate.mockResolvedValue({ id: 'log-1' });
      mockCaseFindUniqueOrThrow.mockResolvedValue(makeCaseDetailRow());

      const result = await createCase({
        submissionId: 'sub-1',
        changedById: 'admin-1',
      });

      expect(result.id).toBe('case-1');
      expect(result.status).toBe('RECEIVED');
      expect(result.submission.id).toBe('sub-1');
      expect(result.statusLogs).toHaveLength(1);
      expect(mockSubmissionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PROCESSED' },
        }),
      );
    });

    it('throws when submission not found', async (): Promise<void> => {
      mockSubmissionFindUnique.mockResolvedValue(null);

      await expect(createCase({ submissionId: 'non-existent', changedById: 'admin-1' })).rejects.toThrow(
        'Submission not found',
      );
    });

    it('throws when submission is REJECTED', async (): Promise<void> => {
      mockSubmissionFindUnique.mockResolvedValue({
        id: 'sub-1',
        status: 'REJECTED',
        extractedFields: null,
      });

      await expect(createCase({ submissionId: 'sub-1', changedById: 'admin-1' })).rejects.toThrow(
        'Cannot create case from rejected submission',
      );
    });

    it('throws when submission is already PROCESSED', async (): Promise<void> => {
      mockSubmissionFindUnique.mockResolvedValue({
        id: 'sub-1',
        status: 'PROCESSED',
        extractedFields: {
          contact_channel: '카카오톡',
          condition_definition: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
        },
      });

      await expect(createCase({ submissionId: 'sub-1', changedById: 'admin-1' })).rejects.toThrow(
        'Submission already processed',
      );
    });

    it('throws when submission has no extracted fields', async (): Promise<void> => {
      mockSubmissionFindUnique.mockResolvedValue({
        id: 'sub-1',
        status: 'RECEIVED',
        extractedFields: null,
      });

      await expect(createCase({ submissionId: 'sub-1', changedById: 'admin-1' })).rejects.toThrow(
        'Submission has no extracted fields',
      );
    });
  });

  // ==========================================================================
  // transitionCaseStatus
  // ==========================================================================

  describe('transitionCaseStatus', (): void => {
    it('transitions from RECEIVED to REVIEWING', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'RECEIVED',
        ambiguityResult: null,
        clarificationResolvedAt: null,
      });
      mockCaseUpdate.mockResolvedValue({ id: 'case-1' });
      mockStatusLogCreate.mockResolvedValue({ id: 'log-2' });
      mockCaseFindUniqueOrThrow.mockResolvedValue(makeCaseDetailRow({ status: 'REVIEWING' }));

      const result = await transitionCaseStatus({
        caseId: 'case-1',
        toStatus: 'REVIEWING',
        changedById: 'admin-1',
        reason: 'Starting review',
      });

      expect(result.status).toBe('REVIEWING');
      expect(mockCaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REVIEWING' }),
        }),
      );
      expect(mockStatusLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromStatus: 'RECEIVED',
            toStatus: 'REVIEWING',
            reason: 'Starting review',
          }),
        }),
      );
    });

    it('throws on invalid transition', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'RECEIVED',
        ambiguityResult: null,
        clarificationResolvedAt: null,
      });

      await expect(
        transitionCaseStatus({
          caseId: 'case-1',
          toStatus: 'ACTIVE_MONITORING',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Invalid transition: RECEIVED → ACTIVE_MONITORING');
    });

    it('throws when case not found', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(null);

      await expect(
        transitionCaseStatus({
          caseId: 'non-existent',
          toStatus: 'REVIEWING',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Case not found');
    });

    it('throws on terminal state transition', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'CLOSED',
        ambiguityResult: null,
        clarificationResolvedAt: null,
      });

      await expect(
        transitionCaseStatus({
          caseId: 'case-1',
          toStatus: 'RECEIVED',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Invalid transition: CLOSED → RECEIVED');
    });

    it('blocks REVIEWING → WAITING_PAYMENT when ambiguity not resolved', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'REVIEWING',
        ambiguityResult: { severity: 'AMBER', missingSlots: ['인원'], ambiguousTerms: [] },
        clarificationResolvedAt: null,
      });

      await expect(
        transitionCaseStatus({
          caseId: 'case-1',
          toStatus: 'WAITING_PAYMENT',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Ambiguity must be resolved before payment');
    });

    it('allows REVIEWING → WAITING_PAYMENT when ambiguity resolved', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'REVIEWING',
        ambiguityResult: { severity: 'AMBER', missingSlots: ['인원'], ambiguousTerms: [] },
        clarificationResolvedAt: NOW,
      });
      mockCaseUpdate.mockResolvedValue({ id: 'case-1' });
      mockStatusLogCreate.mockResolvedValue({ id: 'log-3' });
      mockCaseFindUniqueOrThrow.mockResolvedValue(makeCaseDetailRow({ status: 'WAITING_PAYMENT' }));

      const result = await transitionCaseStatus({
        caseId: 'case-1',
        toStatus: 'WAITING_PAYMENT',
        changedById: 'admin-1',
      });

      expect(result.status).toBe('WAITING_PAYMENT');
    });

    it('allows REVIEWING → WAITING_PAYMENT when severity is GREEN', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'REVIEWING',
        ambiguityResult: { severity: 'GREEN', missingSlots: [], ambiguousTerms: [] },
        clarificationResolvedAt: null,
      });
      mockCaseUpdate.mockResolvedValue({ id: 'case-1' });
      mockStatusLogCreate.mockResolvedValue({ id: 'log-4' });
      mockCaseFindUniqueOrThrow.mockResolvedValue(makeCaseDetailRow({ status: 'WAITING_PAYMENT' }));

      const result = await transitionCaseStatus({
        caseId: 'case-1',
        toStatus: 'WAITING_PAYMENT',
        changedById: 'admin-1',
      });

      expect(result.status).toBe('WAITING_PAYMENT');
    });

    it('sets clarificationResolvedAt when resolving clarification', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue({
        id: 'case-1',
        status: 'NEEDS_CLARIFICATION',
        ambiguityResult: { severity: 'AMBER', missingSlots: [], ambiguousTerms: ['적당한'] },
        clarificationResolvedAt: null,
      });
      mockCaseUpdate.mockResolvedValue({ id: 'case-1' });
      mockStatusLogCreate.mockResolvedValue({ id: 'log-5' });
      mockCaseFindUniqueOrThrow.mockResolvedValue(makeCaseDetailRow({ status: 'REVIEWING' }));

      await transitionCaseStatus({
        caseId: 'case-1',
        toStatus: 'REVIEWING',
        changedById: 'admin-1',
        reason: 'Clarification received',
      });

      expect(mockCaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REVIEWING',
            clarificationResolvedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // getCaseById
  // ==========================================================================

  describe('getCaseById', (): void => {
    it('returns null when not found', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(null);

      const result = await getCaseById('non-existent');
      expect(result).toBeNull();
    });

    it('returns case detail when found', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(makeCaseDetailRow());

      const result = await getCaseById('case-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('case-1');
      expect(result?.submission.id).toBe('sub-1');
      expect(result?.statusLogs).toHaveLength(1);
    });
  });

  // ==========================================================================
  // getCases
  // ==========================================================================

  describe('getCases', (): void => {
    it('returns paginated cases with total on first page', async (): Promise<void> => {
      const rows = [makeCaseRow({ id: 'case-1' }), makeCaseRow({ id: 'case-2' })];
      mockCaseFindMany.mockResolvedValue(rows);
      mockCaseCount.mockResolvedValue(2);

      const result = await getCases({ limit: 20 });

      expect(result.cases).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(result.total).toBe(2);
    });

    it('returns nextCursor when hasMore', async (): Promise<void> => {
      const rows = [makeCaseRow({ id: 'case-1' }), makeCaseRow({ id: 'case-2' }), makeCaseRow({ id: 'case-3' })];
      mockCaseFindMany.mockResolvedValue(rows);
      mockCaseCount.mockResolvedValue(5);

      const result = await getCases({ limit: 2 });

      expect(result.cases).toHaveLength(2);
      expect(result.nextCursor).toBe('case-2');
    });

    it('does not include total on cursor page', async (): Promise<void> => {
      mockCaseFindMany.mockResolvedValue([makeCaseRow()]);

      const result = await getCases({ limit: 20, cursor: 'case-0' });

      expect(result.total).toBeUndefined();
      expect(mockCaseCount).not.toHaveBeenCalled();
    });

    it('filters by status', async (): Promise<void> => {
      mockCaseFindMany.mockResolvedValue([]);
      mockCaseCount.mockResolvedValue(0);

      await getCases({ limit: 20, status: 'REVIEWING' as never });

      expect(mockCaseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'REVIEWING' },
        }),
      );
    });
  });
});
