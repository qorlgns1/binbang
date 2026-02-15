import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminFunnel, type FunnelRangePreset } from '../funnel.service';

const {
  mockFormSubmissionCount,
  mockFormSubmissionFindMany,
  mockFormSubmissionFindFirst,
  mockCaseCount,
  mockCaseFindMany,
  mockCaseFindFirst,
  mockBillingEventFindMany,
  mockBillingEventFindFirst,
} = vi.hoisted(
  (): {
    mockFormSubmissionCount: ReturnType<typeof vi.fn>;
    mockFormSubmissionFindMany: ReturnType<typeof vi.fn>;
    mockFormSubmissionFindFirst: ReturnType<typeof vi.fn>;
    mockCaseCount: ReturnType<typeof vi.fn>;
    mockCaseFindMany: ReturnType<typeof vi.fn>;
    mockCaseFindFirst: ReturnType<typeof vi.fn>;
    mockBillingEventFindMany: ReturnType<typeof vi.fn>;
    mockBillingEventFindFirst: ReturnType<typeof vi.fn>;
  } => ({
    mockFormSubmissionCount: vi.fn(),
    mockFormSubmissionFindMany: vi.fn(),
    mockFormSubmissionFindFirst: vi.fn(),
    mockCaseCount: vi.fn(),
    mockCaseFindMany: vi.fn(),
    mockCaseFindFirst: vi.fn(),
    mockBillingEventFindMany: vi.fn(),
    mockBillingEventFindFirst: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    formSubmission: {
      count: mockFormSubmissionCount,
      findMany: mockFormSubmissionFindMany,
      findFirst: mockFormSubmissionFindFirst,
    },
    case: {
      count: mockCaseCount,
      findMany: mockCaseFindMany,
      findFirst: mockCaseFindFirst,
    },
    billingEvent: {
      findMany: mockBillingEventFindMany,
      findFirst: mockBillingEventFindFirst,
    },
  },
}));

function setRangeMetricMocks(): void {
  mockFormSubmissionCount.mockImplementation(({ where }: { where: { status?: string } }) =>
    where.status === 'PROCESSED' ? 6 : 7,
  );
  mockCaseCount.mockResolvedValue(2);
  mockBillingEventFindMany.mockImplementation(({ select }: { select: Record<string, boolean> }) =>
    select.createdAt ? [{ caseId: 'case-1', createdAt: new Date('2026-02-02T00:00:00.000Z') }] : [{ caseId: 'case-1' }],
  );
  mockFormSubmissionFindMany.mockImplementation(({ where }: { where: { status?: string } }) =>
    where.status === 'PROCESSED'
      ? [
          { id: 's1', updatedAt: new Date('2026-02-13T01:00:00.000Z') },
          { id: 's2', updatedAt: new Date('2026-02-13T02:00:00.000Z') },
          { id: 's3', updatedAt: new Date('2026-02-13T03:00:00.000Z') },
          { id: 's4', updatedAt: new Date('2026-02-13T04:00:00.000Z') },
          { id: 's5', updatedAt: new Date('2026-02-13T05:00:00.000Z') },
          { id: 's6', updatedAt: new Date('2026-02-13T06:00:00.000Z') },
        ]
      : [
          { responseId: 'r1', createdAt: new Date('2026-02-11T01:00:00.000Z') },
          { responseId: 'r2', createdAt: new Date('2026-02-11T02:00:00.000Z') },
          { responseId: 'r3', createdAt: new Date('2026-02-11T03:00:00.000Z') },
          { responseId: 'r4', createdAt: new Date('2026-02-11T04:00:00.000Z') },
          { responseId: 'r5', createdAt: new Date('2026-02-11T05:00:00.000Z') },
          { responseId: 'r6', createdAt: new Date('2026-02-11T06:00:00.000Z') },
          { responseId: 'r7', createdAt: new Date('2026-02-13T00:00:00.000Z') },
        ],
  );
  mockCaseFindMany.mockResolvedValue([
    { id: 'c1', paymentConfirmedAt: new Date('2026-01-31T01:00:00.000Z') },
    { id: 'c2', paymentConfirmedAt: new Date('2026-02-01T01:00:00.000Z') },
  ]);
}

describe('admin/funnel.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockFormSubmissionCount.mockResolvedValue(0);
    mockCaseCount.mockResolvedValue(0);
    mockBillingEventFindMany.mockResolvedValue([]);
    mockFormSubmissionFindMany.mockResolvedValue([]);
    mockCaseFindMany.mockResolvedValue([]);
    mockFormSubmissionFindFirst.mockResolvedValue(null);
    mockCaseFindFirst.mockResolvedValue(null);
    mockBillingEventFindFirst.mockResolvedValue(null);
  });

  it('returns KPI aliases and conversion ratios from server-calculated values', async (): Promise<void> => {
    setRangeMetricMocks();

    const result = await getAdminFunnel({
      range: '30d',
      now: new Date('2026-02-13T12:00:00.000Z'),
    });

    expect(result.kpis).toEqual({
      submitted: 7,
      processed: 6,
      paymentConfirmed: 2,
      conditionMet: 1,
    });
    expect(result.conversion).toEqual({
      submittedToProcessed: 0.857,
      processedToPaymentConfirmed: 0.333,
      paymentConfirmedToConditionMet: 0.5,
      submittedToConditionMet: 0.143,
    });
  });

  it('resolves today range as UTC day boundary', async (): Promise<void> => {
    await getAdminFunnel({
      range: 'today',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-02-14T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('resolves 7d range with inclusive UTC window', async (): Promise<void> => {
    await getAdminFunnel({
      range: '7d',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-02-08T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('resolves 30d range with inclusive UTC window', async (): Promise<void> => {
    await getAdminFunnel({
      range: '30d',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-01-16T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('uses earliest metric timestamp as all-range start', async (): Promise<void> => {
    mockFormSubmissionFindFirst
      .mockResolvedValueOnce({ createdAt: new Date('2026-01-20T05:00:00.000Z') })
      .mockResolvedValueOnce({ updatedAt: new Date('2026-01-15T09:30:00.000Z') });
    mockCaseFindFirst.mockResolvedValue({ paymentConfirmedAt: new Date('2026-01-18T10:00:00.000Z') });
    mockBillingEventFindFirst.mockResolvedValue({ createdAt: new Date('2026-01-22T11:00:00.000Z') });

    await getAdminFunnel({
      range: 'all',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-01-15T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('falls back to current day when all-range has no historical data', async (): Promise<void> => {
    await getAdminFunnel({
      range: 'all',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-02-14T00:00:00.000Z'),
            lte: new Date('2026-02-14T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('applies distinct caseId rule to conditionMet aggregation', async (): Promise<void> => {
    await getAdminFunnel({
      range: '30d',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockBillingEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ['caseId'],
      }),
    );
  });

  it('normalizes explicit UTC ISO filter to full UTC day boundaries for non-all ranges', async (): Promise<void> => {
    await getAdminFunnel({
      range: '7d',
      from: '2026-02-01T12:34:56.000Z',
      to: '2026-02-07T03:21:00.000Z',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(mockFormSubmissionCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-02-01T00:00:00.000Z'),
            lte: new Date('2026-02-07T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('throws on invalid custom from date', async (): Promise<void> => {
    await expect(
      getAdminFunnel({
        range: '7d',
        from: 'invalid-from',
        to: '-02-07T03:21:00.000Z',
        now: new Date('2026-02-14T18:40:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid `from` datetime');
  });

  it('throws on unknown range preset', async (): Promise<void> => {
    await expect(
      getAdminFunnel({
        range: 'invalid' as FunnelRangePreset,
        now: new Date('2026-02-14T18:40:00.000Z'),
      }),
    ).rejects.toThrowError('Invalid range preset: invalid');
  });

  it('builds zero-filled UTC series even when there is no activity', async (): Promise<void> => {
    const result = await getAdminFunnel({
      range: 'today',
      now: new Date('2026-02-14T18:40:00.000Z'),
    });

    expect(result.series).toEqual([
      {
        date: '2026-02-14',
        submitted: 0,
        processed: 0,
        paymentConfirmed: 0,
        conditionMet: 0,
      },
    ]);
  });
});
