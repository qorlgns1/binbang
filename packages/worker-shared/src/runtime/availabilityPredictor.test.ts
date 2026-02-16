import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generatePredictions } from './availabilityPredictor';

const { mockQueryRaw, mockTransaction, mockUpsert } = vi.hoisted(
  (): {
    mockQueryRaw: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
    mockUpsert: ReturnType<typeof vi.fn>;
  } => ({
    mockQueryRaw: vi.fn(),
    mockTransaction: vi.fn(),
    mockUpsert: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    publicAvailabilityPrediction: {
      upsert: mockUpsert,
    },
  },
}));

function makeSnapshot(
  publicPropertyId: string,
  dateStr: string,
  openRate: number,
  sampleSize = 10,
): { publicPropertyId: string; snapshotDate: Date; openRate: number; sampleSize: number } {
  return {
    publicPropertyId,
    snapshotDate: new Date(`${dateStr}T00:00:00.000Z`),
    openRate,
    sampleSize,
  };
}

describe('availabilityPredictor', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (ops: Promise<unknown>[]): Promise<unknown[]> => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    });
    mockUpsert.mockResolvedValue({});
  });

  it('skips properties with insufficient snapshots', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      makeSnapshot('prop_1', '2026-02-10', 0.5),
      makeSnapshot('prop_1', '2026-02-11', 0.6),
    ]);

    const result = await generatePredictions({
      now: new Date('2026-02-16T12:00:00.000Z'),
    });

    expect(result.processedProperties).toBe(1);
    expect(result.skippedInsufficientData).toBe(1);
    expect(result.predictionsCreated).toBe(0);
  });

  it('generates predictions for properties with sufficient data', async (): Promise<void> => {
    const rows = [
      makeSnapshot('prop_1', '2026-01-20', 0.3),
      makeSnapshot('prop_1', '2026-01-27', 0.3),
      makeSnapshot('prop_1', '2026-02-03', 0.3),
      makeSnapshot('prop_1', '2026-02-10', 0.3),
      makeSnapshot('prop_1', '2026-02-14', 0.8),
      makeSnapshot('prop_1', '2026-02-07', 0.7),
    ];
    mockQueryRaw.mockResolvedValue(rows);

    const result = await generatePredictions({
      now: new Date('2026-02-16T12:00:00.000Z'),
    });

    expect(result.processedProperties).toBe(1);
    expect(result.predictionsCreated).toBe(1);
    expect(result.skippedInsufficientData).toBe(0);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.create.publicPropertyId).toBe('prop_1');
    expect(upsertCall.create.algorithmVersion).toBe('v1.0');
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(upsertCall.create.confidence);
    expect(upsertCall.create.reasoning).toContain('snapshots');
  });

  it('returns zero predictions when no snapshots exist', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await generatePredictions({
      now: new Date('2026-02-16T12:00:00.000Z'),
    });

    expect(result.processedProperties).toBe(0);
    expect(result.predictionsCreated).toBe(0);
    expect(result.skippedInsufficientData).toBe(0);
  });

  it('respects the limit parameter', async (): Promise<void> => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => makeSnapshot('prop_1', `2026-02-0${i + 1}`, 0.5)),
      ...Array.from({ length: 5 }, (_, i) => makeSnapshot('prop_2', `2026-02-0${i + 1}`, 0.6)),
    ];
    mockQueryRaw.mockResolvedValue(rows);

    const result = await generatePredictions({
      now: new Date('2026-02-16T12:00:00.000Z'),
      limit: 1,
    });

    expect(result.processedProperties).toBe(1);
  });
});
