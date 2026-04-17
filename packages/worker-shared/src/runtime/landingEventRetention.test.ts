import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anonymizeExpiredLandingEventPii, DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS } from './landingEventRetention';

const { mockLandingEventUpdateMany } = vi.hoisted(
  (): {
    mockLandingEventUpdateMany: ReturnType<typeof vi.fn>;
  } => ({
    mockLandingEventUpdateMany: vi.fn(),
  }),
);

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    qb: unknown;
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    qb: null,
    getDataSource: vi.fn(),
  }),
);

const callMock = <TReturn>(fn: unknown, ...args: unknown[]): TReturn =>
  (fn as (...args: unknown[]) => TReturn)(...args);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockQueryBuilder } = await import('./test-utils/mockDb');

  const qb = createMockQueryBuilder();
  qb.execute.mockImplementation(async () => {
    const whereParams = (qb.where.mock.calls.at(-1)?.[1] ?? {}) as { cutoff?: Date };
    const result = await callMock<{ count?: number }>(mockLandingEventUpdateMany, {
      where: {
        occurredAt: { lt: whereParams.cutoff },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
      data: { ipAddress: null, userAgent: null },
    });

    return { affected: result?.count ?? 0 };
  });

  const dataSource = createMockDataSource({ queryBuilder: qb });
  dbMock.dataSource = dataSource;
  dbMock.qb = qb;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('landingEventRetention', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    mockLandingEventUpdateMany.mockResolvedValue({ count: 4 });
  });

  it('anonymizes ip/userAgent older than default retention window', async (): Promise<void> => {
    const now = new Date('2026-02-15T12:00:00.000Z');

    const result = await anonymizeExpiredLandingEventPii({ now });

    expect(mockLandingEventUpdateMany).toHaveBeenCalledWith({
      where: {
        occurredAt: { lt: new Date('2026-01-16T12:00:00.000Z') },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
      data: {
        ipAddress: null,
        userAgent: null,
      },
    });
    expect(result).toEqual({
      retentionDays: DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS,
      cutoffAt: '2026-01-16T12:00:00.000Z',
      anonymizedCount: 4,
    });
  });

  it('uses explicit retentionDays when provided', async (): Promise<void> => {
    const now = new Date('2026-02-15T00:00:00.000Z');
    mockLandingEventUpdateMany.mockResolvedValue({ count: 1 });

    const result = await anonymizeExpiredLandingEventPii({ now, retentionDays: 14 });

    expect(mockLandingEventUpdateMany).toHaveBeenCalledWith({
      where: {
        occurredAt: { lt: new Date('2026-02-01T00:00:00.000Z') },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
      data: {
        ipAddress: null,
        userAgent: null,
      },
    });
    expect(result).toEqual({
      retentionDays: 14,
      cutoffAt: '2026-02-01T00:00:00.000Z',
      anonymizedCount: 1,
    });
  });
});
