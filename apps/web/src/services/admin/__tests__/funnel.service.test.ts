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

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    formSubmissionRepo: {
      count: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
    };
    caseRepo: {
      count: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
    };
    billingEventRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    formSubmissionRepo: {
      count: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    },
    caseRepo: {
      count: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    },
    billingEventRepo: {
      findOne: vi.fn(),
    },
    getDataSource: vi.fn(),
  }),
);

const callMock = <TReturn>(fn: unknown, ...args: unknown[]): TReturn =>
  (fn as (...args: unknown[]) => TReturn)(...args);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../../../test-utils/mock-db.ts');

  const formSubmissionRepo = createMockRepository();
  formSubmissionRepo.count.mockImplementation((...args) => callMock(mockFormSubmissionCount, ...args));
  formSubmissionRepo.find.mockImplementation((...args) => callMock(mockFormSubmissionFindMany, ...args));
  formSubmissionRepo.findOne.mockImplementation((...args) => callMock(mockFormSubmissionFindFirst, ...args));

  const caseRepo = createMockRepository();
  caseRepo.count.mockImplementation((...args) => callMock(mockCaseCount, ...args));
  caseRepo.find.mockImplementation((...args) => callMock(mockCaseFindMany, ...args));
  caseRepo.findOne.mockImplementation((...args) => callMock(mockCaseFindFirst, ...args));

  const billingEventRepo = createMockRepository();
  billingEventRepo.findOne.mockImplementation((...args) => callMock(mockBillingEventFindFirst, ...args));

  const dataSource = createMockDataSource({
    repositories: [
      [actual.FormSubmission, formSubmissionRepo],
      [actual.Case, caseRepo],
      [actual.BillingEvent, billingEventRepo],
    ],
    queryImplementation: async (sql: string) => {
      if (sql.includes('SELECT DISTINCT "caseId"')) {
        return callMock(mockBillingEventFindMany, { distinct: ['caseId'] });
      }
      return callMock(mockBillingEventFindMany, { select: { createdAt: true } });
    },
  });

  dbMock.dataSource = dataSource;
  dbMock.formSubmissionRepo = formSubmissionRepo;
  dbMock.caseRepo = caseRepo;
  dbMock.billingEventRepo = billingEventRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

function setRangeMetricMocks(): void {
  mockFormSubmissionCount.mockImplementation(({ where }: { where: { status?: string } }) =>
    where.status === 'PROCESSED' ? 6 : 7,
  );
  mockCaseCount.mockResolvedValue(2);
  mockBillingEventFindMany.mockImplementation(
    ({ select, distinct }: { select?: Record<string, boolean>; distinct?: string[] }) =>
      select?.createdAt
        ? [{ caseId: 'case-1', createdAt: new Date('2026-02-02T00:00:00.000Z') }]
        : distinct
          ? [{ caseId: 'case-1' }]
          : [],
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
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
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
        to: '2026-02-07T03:21:00.000Z',
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
