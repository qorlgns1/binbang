import { describe, expect, it, vi, beforeEach } from 'vitest';

import { expireOverdueCases } from './caseExpiration';

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@workspace/db', () => ({
  prisma: {
    case: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<void>) => mockTransaction(fn),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCaseRow(id: string, requestWindow: string | null) {
  return {
    id,
    submission: {
      extractedFields: requestWindow ? { request_window: requestWindow } : {},
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('caseExpiration', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        case: { update: mockUpdate.mockResolvedValue({ id: 'x' }) },
        caseStatusLog: { create: mockCreate.mockResolvedValue({ id: 'y' }) },
      };
      return fn(tx);
    });
  });

  it('expires cases whose request_window is in the past', async (): Promise<void> => {
    const now = new Date('2026-03-01T12:00:00Z');

    mockFindMany.mockResolvedValue([makeCaseRow('case-1', '2026-02-28'), makeCaseRow('case-2', '2026-01-15')]);

    const result = await expireOverdueCases({ now });

    expect(result.scannedCount).toBe(2);
    expect(result.expiredCount).toBe(2);
    expect(result.skippedNoWindow).toBe(0);

    expect(mockTransaction).toHaveBeenCalledTimes(2);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'case-1' },
        data: expect.objectContaining({
          status: 'EXPIRED',
          statusChangedBy: 'system:case-expiration',
        }),
      }),
    );
  });

  it('skips cases with a future request_window', async (): Promise<void> => {
    const now = new Date('2026-02-15T00:00:00Z');

    mockFindMany.mockResolvedValue([makeCaseRow('case-1', '2026-03-01')]);

    const result = await expireOverdueCases({ now });

    expect(result.scannedCount).toBe(1);
    expect(result.expiredCount).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('skips cases with no request_window', async (): Promise<void> => {
    const now = new Date('2026-03-01T12:00:00Z');

    mockFindMany.mockResolvedValue([makeCaseRow('case-no-window', null)]);

    const result = await expireOverdueCases({ now });

    expect(result.scannedCount).toBe(1);
    expect(result.expiredCount).toBe(0);
    expect(result.skippedNoWindow).toBe(1);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('skips cases with an invalid date format', async (): Promise<void> => {
    const now = new Date('2026-03-01T12:00:00Z');

    mockFindMany.mockResolvedValue([makeCaseRow('case-bad-date', 'not-a-date')]);

    const result = await expireOverdueCases({ now });

    expect(result.expiredCount).toBe(0);
    expect(result.skippedNoWindow).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('does not expire when request_window equals today (same UTC day)', async (): Promise<void> => {
    const now = new Date('2026-03-01T00:00:00Z');

    mockFindMany.mockResolvedValue([makeCaseRow('case-today', '2026-03-01')]);

    const result = await expireOverdueCases({ now });

    expect(result.expiredCount).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('returns zero counts when no active cases exist', async (): Promise<void> => {
    mockFindMany.mockResolvedValue([]);

    const result = await expireOverdueCases();

    expect(result.scannedCount).toBe(0);
    expect(result.expiredCount).toBe(0);
    expect(result.skippedNoWindow).toBe(0);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('handles mixed valid and invalid cases correctly', async (): Promise<void> => {
    const now = new Date('2026-03-15T12:00:00Z');

    mockFindMany.mockResolvedValue([
      makeCaseRow('expired-1', '2026-03-01'),
      makeCaseRow('future-1', '2026-04-01'),
      makeCaseRow('no-window', null),
      makeCaseRow('bad-format', '2026/03/01'),
      makeCaseRow('expired-2', '2026-02-01'),
    ]);

    const result = await expireOverdueCases({ now });

    expect(result.scannedCount).toBe(5);
    expect(result.expiredCount).toBe(2);
    expect(result.skippedNoWindow).toBe(1);
    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });
});
