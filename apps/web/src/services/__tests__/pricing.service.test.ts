import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_QUOTE_KRW,
  MIN_QUOTE_KRW,
  PRICING_POLICY_VERSION,
  computePriceQuote,
  finalizeRoundedAmount,
  getCasePriceQuoteHistory,
  previewCasePriceQuote,
  saveCasePriceQuote,
  type PricingInputSnapshot,
} from '../pricing.service';

const { mockCaseFindUnique, mockPriceQuoteUpdateMany, mockPriceQuoteCreate, mockPriceQuoteFindMany, mockTransaction } =
  vi.hoisted(
    (): {
      mockCaseFindUnique: ReturnType<typeof vi.fn>;
      mockPriceQuoteUpdateMany: ReturnType<typeof vi.fn>;
      mockPriceQuoteCreate: ReturnType<typeof vi.fn>;
      mockPriceQuoteFindMany: ReturnType<typeof vi.fn>;
      mockTransaction: ReturnType<typeof vi.fn>;
    } => ({
      mockCaseFindUnique: vi.fn(),
      mockPriceQuoteUpdateMany: vi.fn(),
      mockPriceQuoteCreate: vi.fn(),
      mockPriceQuoteFindMany: vi.fn(),
      mockTransaction: vi.fn(),
    }),
  );

vi.mock('@workspace/db', () => ({
  prisma: {
    case: {
      findUnique: mockCaseFindUnique,
    },
    priceQuote: {
      updateMany: mockPriceQuoteUpdateMany,
      create: mockPriceQuoteCreate,
      findMany: mockPriceQuoteFindMany,
    },
    $transaction: mockTransaction,
  },
}));

function buildInput(overrides: Partial<PricingInputSnapshot> = {}): PricingInputSnapshot {
  return {
    platform: 'AGODA',
    durationBucket: 'BETWEEN_24H_72H',
    difficulty: 'M',
    urgencyBucket: 'D2_D3',
    frequencyBucket: 'F15M',
    ...overrides,
  };
}

function buildQuoteRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-02-15T02:10:00.000Z');
  return {
    id: 'pq-1',
    caseId: 'case-1',
    pricingPolicyVersion: PRICING_POLICY_VERSION,
    computedAmountKrw: 41000,
    roundedAmountKrw: 41000,
    changeReason: 'initial quote',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function setupTransactionMock(): void {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      case: {
        findUnique: mockCaseFindUnique,
      },
      priceQuote: {
        updateMany: mockPriceQuoteUpdateMany,
        create: mockPriceQuoteCreate,
      },
    };
    return fn(tx);
  });
}

describe('pricing.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    setupTransactionMock();
    mockCaseFindUnique.mockResolvedValue({ id: 'case-1' });
    mockPriceQuoteUpdateMany.mockResolvedValue({ count: 1 });
    mockPriceQuoteCreate.mockResolvedValue(buildQuoteRow());
    mockPriceQuoteFindMany.mockResolvedValue([]);
  });

  describe('computePriceQuote', (): void => {
    it('returns deterministic output for identical inputs', (): void => {
      const input = buildInput();

      const first = computePriceQuote(input);
      const second = computePriceQuote(input);

      expect(first).toEqual(second);
      expect(first.pricingPolicyVersion).toBe(PRICING_POLICY_VERSION);
    });

    it('applies platform base fee mapping', (): void => {
      expect(computePriceQuote(buildInput({ platform: 'AIRBNB' })).weightsSnapshot.baseFee).toBe(19000);
      expect(computePriceQuote(buildInput({ platform: 'AGODA' })).weightsSnapshot.baseFee).toBe(17000);
      expect(computePriceQuote(buildInput({ platform: 'OTHER' })).weightsSnapshot.baseFee).toBe(19000);
    });

    it('applies duration bucket weight mapping', (): void => {
      expect(computePriceQuote(buildInput({ durationBucket: 'LE_24H' })).weightsSnapshot.duration).toBe(0);
      expect(computePriceQuote(buildInput({ durationBucket: 'GT_7D' })).weightsSnapshot.duration).toBe(20000);
    });

    it('applies difficulty and urgency weight mapping', (): void => {
      expect(computePriceQuote(buildInput({ difficulty: 'H' })).weightsSnapshot.difficulty).toBe(15000);
      expect(computePriceQuote(buildInput({ urgencyBucket: 'D2_D3' })).weightsSnapshot.urgency).toBe(7000);
    });

    it('applies frequency weight mapping including negative adjustment', (): void => {
      expect(computePriceQuote(buildInput({ frequencyBucket: 'F15M' })).weightsSnapshot.frequency).toBe(5000);
      expect(computePriceQuote(buildInput({ frequencyBucket: 'F60M_PLUS' })).weightsSnapshot.frequency).toBe(-2000);
    });
  });

  describe('finalizeRoundedAmount', (): void => {
    it('rounds computed amount to nearest 1,000 KRW', (): void => {
      expect(finalizeRoundedAmount(34499)).toBe(34000);
      expect(finalizeRoundedAmount(34500)).toBe(35000);
    });

    it('applies minimum clamp to 10,000 KRW', (): void => {
      expect(finalizeRoundedAmount(7000)).toBe(MIN_QUOTE_KRW);
    });

    it('applies maximum clamp to 500,000 KRW', (): void => {
      expect(finalizeRoundedAmount(550000)).toBe(MAX_QUOTE_KRW);
    });
  });

  describe('previewCasePriceQuote', (): void => {
    it('throws when case does not exist', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(null);

      await expect(
        previewCasePriceQuote({
          caseId: 'missing-case',
          inputsSnapshot: buildInput(),
        }),
      ).rejects.toThrow('Case not found');
    });

    it('returns preview payload with policy version and amounts', async (): Promise<void> => {
      const result = await previewCasePriceQuote({
        caseId: 'case-1',
        inputsSnapshot: buildInput(),
      });

      expect(result.caseId).toBe('case-1');
      expect(result.pricingPolicyVersion).toBe(PRICING_POLICY_VERSION);
      expect(result.computedAmountKrw).toBe(41000);
      expect(result.roundedAmountKrw).toBe(41000);
    });
  });

  describe('saveCasePriceQuote', (): void => {
    it('throws when changeReason is empty', async (): Promise<void> => {
      await expect(
        saveCasePriceQuote({
          caseId: 'case-1',
          createdBy: 'admin-1',
          changeReason: '   ',
          inputsSnapshot: buildInput(),
        }),
      ).rejects.toThrow('`changeReason` is required');
    });

    it('throws when case does not exist in transaction', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(null);

      await expect(
        saveCasePriceQuote({
          caseId: 'missing-case',
          createdBy: 'admin-1',
          changeReason: 'initial quote',
          inputsSnapshot: buildInput(),
        }),
      ).rejects.toThrow('Case not found');
    });

    it('deactivates previous active quote before creating a new quote', async (): Promise<void> => {
      await saveCasePriceQuote({
        caseId: 'case-1',
        createdBy: 'admin-1',
        changeReason: 'difficulty up',
        inputsSnapshot: buildInput({ difficulty: 'H' }),
      });

      expect(mockPriceQuoteUpdateMany).toHaveBeenCalledWith({
        where: { caseId: 'case-1', isActive: true },
        data: { isActive: false },
      });
      expect(mockPriceQuoteCreate).toHaveBeenCalledOnce();
      expect(mockPriceQuoteUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(
        mockPriceQuoteCreate.mock.invocationCallOrder[0],
      );
    });

    it('stores snapshots and returns normalized output', async (): Promise<void> => {
      mockPriceQuoteCreate.mockResolvedValue(
        buildQuoteRow({
          id: 'pq-2',
          computedAmountKrw: 49000,
          roundedAmountKrw: 49000,
          changeReason: 'difficulty up',
          createdBy: 'admin-1',
        }),
      );

      const result = await saveCasePriceQuote({
        caseId: 'case-1',
        createdBy: 'admin-1',
        changeReason: ' difficulty up ',
        inputsSnapshot: buildInput({ difficulty: 'H' }),
      });

      expect(mockPriceQuoteCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            caseId: 'case-1',
            pricingPolicyVersion: PRICING_POLICY_VERSION,
            computedAmountKrw: 49000,
            roundedAmountKrw: 49000,
            changeReason: 'difficulty up',
            createdBy: 'admin-1',
          }),
        }),
      );
      expect(result.quoteId).toBe('pq-2');
      expect(result.caseId).toBe('case-1');
      expect(result.pricingPolicyVersion).toBe(PRICING_POLICY_VERSION);
      expect(result.isActive).toBe(true);
      expect(result.changeReason).toBe('difficulty up');
      expect(result.createdAt).toBe('2026-02-15T02:10:00.000Z');
      expect(result.updatedAt).toBe('2026-02-15T02:10:00.000Z');
    });
  });

  describe('getCasePriceQuoteHistory', (): void => {
    it('throws when case does not exist', async (): Promise<void> => {
      mockCaseFindUnique.mockResolvedValue(null);

      await expect(getCasePriceQuoteHistory('missing-case')).rejects.toThrow('Case not found');
    });

    it('returns latest-first quote history with changedBy and snapshots', async (): Promise<void> => {
      mockPriceQuoteFindMany.mockResolvedValue([
        {
          id: 'pq-2',
          caseId: 'case-1',
          pricingPolicyVersion: 'v0',
          inputsSnapshot: {
            platform: 'AGODA',
            durationBucket: 'BETWEEN_24H_72H',
            difficulty: 'H',
            urgencyBucket: 'D2_D3',
            frequencyBucket: 'F15M',
          },
          weightsSnapshot: {
            baseFee: 17000,
            duration: 5000,
            difficulty: 15000,
            urgency: 7000,
            frequency: 5000,
          },
          computedAmountKrw: 49000,
          roundedAmountKrw: 49000,
          changeReason: 'difficulty up',
          isActive: true,
          createdBy: 'admin-1',
          createdAt: new Date('2026-02-15T02:10:00.000Z'),
          updatedAt: new Date('2026-02-15T02:10:00.000Z'),
        },
      ]);

      const result = await getCasePriceQuoteHistory('case-1');

      expect(mockPriceQuoteFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { caseId: 'case-1' },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          quoteId: 'pq-2',
          caseId: 'case-1',
          pricingPolicyVersion: 'v0',
          roundedAmountKrw: 49000,
          changeReason: 'difficulty up',
          isActive: true,
          changedBy: 'admin-1',
        }),
      );
    });
  });
});
