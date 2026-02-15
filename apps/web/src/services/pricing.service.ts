import { type Prisma, prisma } from '@workspace/db';

export const PRICING_POLICY_VERSION = 'v1';
export const ROUNDING_UNIT_KRW = 1000;
export const MIN_QUOTE_KRW = 10000;
export const MAX_QUOTE_KRW = 500000;

export const PRICING_PLATFORMS = ['AIRBNB', 'AGODA', 'OTHER'] as const;
export const DURATION_BUCKETS = ['LE_24H', 'BETWEEN_24H_72H', 'BETWEEN_72H_7D', 'GT_7D'] as const;
export const DIFFICULTY_LEVELS = ['L', 'M', 'H'] as const;
export const URGENCY_BUCKETS = ['D0_D1', 'D2_D3', 'D4_PLUS'] as const;
export const FREQUENCY_BUCKETS = ['F15M', 'F30M', 'F60M_PLUS'] as const;

export type PricingPlatform = (typeof PRICING_PLATFORMS)[number];
export type DurationBucket = (typeof DURATION_BUCKETS)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type UrgencyBucket = (typeof URGENCY_BUCKETS)[number];
export type FrequencyBucket = (typeof FREQUENCY_BUCKETS)[number];

export interface PricingInputSnapshot {
  platform: PricingPlatform;
  durationBucket: DurationBucket;
  difficulty: DifficultyLevel;
  urgencyBucket: UrgencyBucket;
  frequencyBucket: FrequencyBucket;
}

export interface PricingWeightSnapshot {
  baseFee: number;
  duration: number;
  difficulty: number;
  urgency: number;
  frequency: number;
}

export interface PriceQuoteComputation {
  pricingPolicyVersion: typeof PRICING_POLICY_VERSION;
  inputsSnapshot: PricingInputSnapshot;
  weightsSnapshot: PricingWeightSnapshot;
  computedAmountKrw: number;
  roundedAmountKrw: number;
}

export interface PreviewCasePriceQuoteInput {
  caseId: string;
  inputsSnapshot: PricingInputSnapshot;
}

export interface PreviewCasePriceQuoteOutput extends PriceQuoteComputation {
  caseId: string;
}

export interface SaveCasePriceQuoteInput {
  caseId: string;
  createdBy: string;
  changeReason: string;
  inputsSnapshot: PricingInputSnapshot;
}

export interface SaveCasePriceQuoteOutput extends PreviewCasePriceQuoteOutput {
  quoteId: string;
  changeReason: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CasePriceQuoteHistoryItem extends PriceQuoteComputation {
  quoteId: string;
  caseId: string;
  changeReason: string;
  isActive: boolean;
  changedBy: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_FEE_BY_PLATFORM: Record<PricingPlatform, number> = {
  AIRBNB: 19000,
  AGODA: 17000,
  OTHER: 19000,
};

const DURATION_WEIGHT_BY_BUCKET: Record<DurationBucket, number> = {
  LE_24H: 0,
  BETWEEN_24H_72H: 5000,
  BETWEEN_72H_7D: 12000,
  GT_7D: 20000,
};

const DIFFICULTY_WEIGHT_BY_LEVEL: Record<DifficultyLevel, number> = {
  L: 0,
  M: 7000,
  H: 15000,
};

const URGENCY_WEIGHT_BY_BUCKET: Record<UrgencyBucket, number> = {
  D0_D1: 12000,
  D2_D3: 7000,
  D4_PLUS: 0,
};

const FREQUENCY_WEIGHT_BY_BUCKET: Record<FrequencyBucket, number> = {
  F15M: 5000,
  F30M: 0,
  F60M_PLUS: -2000,
};

const PRICE_QUOTE_SELECT = {
  id: true,
  caseId: true,
  pricingPolicyVersion: true,
  computedAmountKrw: true,
  roundedAmountKrw: true,
  changeReason: true,
  isActive: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PRICE_QUOTE_HISTORY_SELECT = {
  id: true,
  caseId: true,
  pricingPolicyVersion: true,
  inputsSnapshot: true,
  weightsSnapshot: true,
  computedAmountKrw: true,
  roundedAmountKrw: true,
  changeReason: true,
  isActive: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toPricingInputSnapshot(json: Prisma.JsonValue): PricingInputSnapshot {
  const snapshot = json as Partial<PricingInputSnapshot> | null;
  return {
    platform: snapshot?.platform ?? 'OTHER',
    durationBucket: snapshot?.durationBucket ?? 'LE_24H',
    difficulty: snapshot?.difficulty ?? 'L',
    urgencyBucket: snapshot?.urgencyBucket ?? 'D4_PLUS',
    frequencyBucket: snapshot?.frequencyBucket ?? 'F30M',
  };
}

function toPricingWeightSnapshot(json: Prisma.JsonValue): PricingWeightSnapshot {
  const snapshot = json as Partial<PricingWeightSnapshot> | null;
  return {
    baseFee: snapshot?.baseFee ?? 0,
    duration: snapshot?.duration ?? 0,
    difficulty: snapshot?.difficulty ?? 0,
    urgency: snapshot?.urgency ?? 0,
    frequency: snapshot?.frequency ?? 0,
  };
}

function roundToUnit(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function finalizeRoundedAmount(computedAmountKrw: number): number {
  return clamp(roundToUnit(computedAmountKrw, ROUNDING_UNIT_KRW), MIN_QUOTE_KRW, MAX_QUOTE_KRW);
}

function toInputJson(snapshot: PricingInputSnapshot): Prisma.InputJsonValue {
  return {
    platform: snapshot.platform,
    durationBucket: snapshot.durationBucket,
    difficulty: snapshot.difficulty,
    urgencyBucket: snapshot.urgencyBucket,
    frequencyBucket: snapshot.frequencyBucket,
  };
}

function toWeightJson(snapshot: PricingWeightSnapshot): Prisma.InputJsonValue {
  return {
    baseFee: snapshot.baseFee,
    duration: snapshot.duration,
    difficulty: snapshot.difficulty,
    urgency: snapshot.urgency,
    frequency: snapshot.frequency,
  };
}

export function computePriceQuote(inputsSnapshot: PricingInputSnapshot): PriceQuoteComputation {
  const weightsSnapshot: PricingWeightSnapshot = {
    baseFee: BASE_FEE_BY_PLATFORM[inputsSnapshot.platform],
    duration: DURATION_WEIGHT_BY_BUCKET[inputsSnapshot.durationBucket],
    difficulty: DIFFICULTY_WEIGHT_BY_LEVEL[inputsSnapshot.difficulty],
    urgency: URGENCY_WEIGHT_BY_BUCKET[inputsSnapshot.urgencyBucket],
    frequency: FREQUENCY_WEIGHT_BY_BUCKET[inputsSnapshot.frequencyBucket],
  };

  const computedAmountKrw =
    weightsSnapshot.baseFee +
    weightsSnapshot.duration +
    weightsSnapshot.difficulty +
    weightsSnapshot.urgency +
    weightsSnapshot.frequency;
  const roundedAmountKrw = finalizeRoundedAmount(computedAmountKrw);

  return {
    pricingPolicyVersion: PRICING_POLICY_VERSION,
    inputsSnapshot,
    weightsSnapshot,
    computedAmountKrw,
    roundedAmountKrw,
  };
}

export async function previewCasePriceQuote(input: PreviewCasePriceQuoteInput): Promise<PreviewCasePriceQuoteOutput> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: input.caseId },
    select: { id: true },
  });

  if (!caseRecord) {
    throw new Error('Case not found');
  }

  return {
    caseId: input.caseId,
    ...computePriceQuote(input.inputsSnapshot),
  };
}

export async function saveCasePriceQuote(input: SaveCasePriceQuoteInput): Promise<SaveCasePriceQuoteOutput> {
  const changeReason = input.changeReason.trim();
  if (changeReason.length === 0) {
    throw new Error('`changeReason` is required');
  }

  const computed = computePriceQuote(input.inputsSnapshot);

  const created = await prisma.$transaction(async (tx) => {
    const caseRecord = await tx.case.findUnique({
      where: { id: input.caseId },
      select: { id: true },
    });

    if (!caseRecord) {
      throw new Error('Case not found');
    }

    await tx.priceQuote.updateMany({
      where: {
        caseId: input.caseId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return tx.priceQuote.create({
      data: {
        caseId: input.caseId,
        pricingPolicyVersion: computed.pricingPolicyVersion,
        inputsSnapshot: toInputJson(computed.inputsSnapshot),
        weightsSnapshot: toWeightJson(computed.weightsSnapshot),
        computedAmountKrw: computed.computedAmountKrw,
        roundedAmountKrw: computed.roundedAmountKrw,
        changeReason,
        isActive: true,
        createdBy: input.createdBy,
      },
      select: PRICE_QUOTE_SELECT,
    });
  });

  return {
    quoteId: created.id,
    caseId: created.caseId,
    pricingPolicyVersion: computed.pricingPolicyVersion,
    inputsSnapshot: computed.inputsSnapshot,
    weightsSnapshot: computed.weightsSnapshot,
    computedAmountKrw: created.computedAmountKrw,
    roundedAmountKrw: created.roundedAmountKrw,
    changeReason: created.changeReason,
    isActive: created.isActive,
    createdBy: created.createdBy,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function getCasePriceQuoteHistory(caseId: string, limit = 50): Promise<CasePriceQuoteHistoryItem[]> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true },
  });

  if (!caseRecord) {
    throw new Error('Case not found');
  }

  const rows = await prisma.priceQuote.findMany({
    where: { caseId },
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 50),
    select: PRICE_QUOTE_HISTORY_SELECT,
  });

  return rows.map(
    (row): CasePriceQuoteHistoryItem => ({
      quoteId: row.id,
      caseId: row.caseId,
      pricingPolicyVersion: PRICING_POLICY_VERSION,
      inputsSnapshot: toPricingInputSnapshot(row.inputsSnapshot),
      weightsSnapshot: toPricingWeightSnapshot(row.weightsSnapshot),
      computedAmountKrw: row.computedAmountKrw,
      roundedAmountKrw: row.roundedAmountKrw,
      changeReason: row.changeReason,
      isActive: row.isActive,
      changedBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }),
  );
}
