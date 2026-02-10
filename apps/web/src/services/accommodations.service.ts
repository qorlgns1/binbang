import type { Accommodation, CheckLog } from '@/generated/prisma/client';
import { QuotaKey } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface CreateAccommodationInput {
  userId: string;
  name: string;
  platform: 'AIRBNB' | 'AGODA';
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
}

export interface UpdateAccommodationInput {
  name?: string;
  url?: string;
  checkIn?: Date;
  checkOut?: Date;
  adults?: number;
  isActive?: boolean;
}

export interface AccommodationWithLogs extends Accommodation {
  checkLogs: CheckLog[];
}

export interface QuotaCheckResult {
  allowed: boolean;
  max: number;
  current: number;
}

export interface GetLogsInput {
  accommodationId: string;
  cursor?: string;
  limit: number;
}

export interface GetLogsResult {
  logs: CheckLog[];
  nextCursor: string | null;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getAccommodationsByUserId(userId: string): Promise<Accommodation[]> {
  return prisma.accommodation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAccommodationById(id: string, userId: string): Promise<AccommodationWithLogs | null> {
  return prisma.accommodation.findFirst({
    where: { id, userId },
    include: {
      checkLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
}

export async function checkUserQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: {
        select: {
          quotas: {
            where: { key: QuotaKey.MAX_ACCOMMODATIONS },
            select: { value: true },
          },
        },
      },
      _count: { select: { accommodations: true } },
    },
  });

  const max = user?.plan?.quotas[0]?.value ?? 5;
  const current = user?._count.accommodations ?? 0;

  return {
    allowed: current < max,
    max,
    current,
  };
}

export async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  return prisma.accommodation.create({
    data: {
      userId: input.userId,
      name: input.name,
      platform: input.platform,
      url: input.url,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
    },
  });
}

export async function updateAccommodation(
  id: string,
  userId: string,
  input: UpdateAccommodationInput,
): Promise<Accommodation | null> {
  // 소유권 확인
  const existing = await prisma.accommodation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return null;
  }

  return prisma.accommodation.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.checkIn !== undefined && { checkIn: input.checkIn }),
      ...(input.checkOut !== undefined && { checkOut: input.checkOut }),
      ...(input.adults !== undefined && { adults: input.adults }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteAccommodation(id: string, userId: string): Promise<boolean> {
  // 소유권 확인
  const existing = await prisma.accommodation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return false;
  }

  await prisma.accommodation.delete({
    where: { id },
  });

  return true;
}

export async function getAccommodationLogs(input: GetLogsInput): Promise<GetLogsResult> {
  const logs = await prisma.checkLog.findMany({
    where: { accommodationId: input.accommodationId },
    orderBy: { createdAt: 'desc' },
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = logs.length > input.limit;
  const items = hasMore ? logs.slice(0, input.limit) : logs;

  return {
    logs: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function verifyAccommodationOwnership(id: string, userId: string): Promise<boolean> {
  const accommodation = await prisma.accommodation.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  return accommodation !== null;
}

// ============================================================================
// Price History
// ============================================================================

const MAX_PRICE_RECORDS = 5000;
const MOVING_AVG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export interface GetPriceHistoryInput {
  accommodationId: string;
  userId: string;
  from?: string;
  to?: string;
}

export interface PriceDataPoint {
  createdAt: string;
  priceAmount: number;
  priceCurrency: string;
  pricePerNight: number | null;
  movingAvg: number | null;
  isLegacy: boolean;
}

export interface PriceStats {
  min: number;
  minDate: string;
  max: number;
  maxDate: string;
  avg: number;
  current: number | null;
  currentCurrency: string;
  count: number;
  perNight: {
    min: number;
    minDate: string;
    max: number;
    maxDate: string;
    avg: number;
    current: number | null;
  } | null;
}

export interface PriceHistoryResponse {
  prices: PriceDataPoint[];
  stats: PriceStats | null;
}

export async function getAccommodationPriceHistory(input: GetPriceHistoryInput): Promise<PriceHistoryResponse | null> {
  const accommodation = await prisma.accommodation.findFirst({
    where: { id: input.accommodationId, userId: input.userId },
    select: { id: true, checkIn: true, checkOut: true },
  });

  if (!accommodation) {
    return null;
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (input.from) {
    const fromDate = new Date(input.from);
    if (!Number.isNaN(fromDate.getTime())) dateFilter.gte = fromDate;
  }
  if (input.to) {
    const toDate = new Date(input.to);
    if (!Number.isNaN(toDate.getTime())) dateFilter.lte = toDate;
  }

  // 현재 일정과 일치하는 로그 + 레거시(일정 미기록) 로그만 조회
  const logs = await prisma.checkLog.findMany({
    where: {
      accommodationId: input.accommodationId,
      priceAmount: { not: null },
      OR: [{ checkIn: accommodation.checkIn, checkOut: accommodation.checkOut }, { checkIn: null }],
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    select: {
      createdAt: true,
      priceAmount: true,
      priceCurrency: true,
      pricePerNight: true,
      checkIn: true,
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_PRICE_RECORDS,
  });

  if (logs.length === 0) {
    return { prices: [], stats: null };
  }

  // 최신순 → 시간순 정렬
  logs.reverse();

  // 이동평균 계산 + 데이터 포인트 생성
  const prices: PriceDataPoint[] = logs.map((log, idx): PriceDataPoint => {
    const currentTime = log.createdAt.getTime();
    const windowStart = currentTime - MOVING_AVG_WINDOW_MS;

    let sum = 0;
    let count = 0;
    for (let j = idx; j >= 0; j--) {
      if (logs[j].createdAt.getTime() < windowStart) break;
      sum += logs[j].priceAmount as number;
      count++;
    }

    return {
      createdAt: log.createdAt.toISOString(),
      priceAmount: log.priceAmount as number,
      priceCurrency: log.priceCurrency ?? 'KRW',
      pricePerNight: log.pricePerNight,
      movingAvg: count >= 2 ? Math.round(sum / count) : null,
      isLegacy: log.checkIn === null,
    };
  });

  // 전체 가격 통계
  let min = Infinity;
  let minDate = '';
  let max = -Infinity;
  let maxDate = '';
  let sum = 0;

  for (const p of prices) {
    if (p.priceAmount < min) {
      min = p.priceAmount;
      minDate = p.createdAt;
    }
    if (p.priceAmount > max) {
      max = p.priceAmount;
      maxDate = p.createdAt;
    }
    sum += p.priceAmount;
  }

  // 박당 가격 통계
  const perNightPrices = prices.filter((p): boolean => p.pricePerNight != null);
  let perNight: PriceStats['perNight'] = null;

  if (perNightPrices.length > 0) {
    let pnMin = Infinity;
    let pnMinDate = '';
    let pnMax = -Infinity;
    let pnMaxDate = '';
    let pnSum = 0;

    for (const p of perNightPrices) {
      const pn = p.pricePerNight as number;
      if (pn < pnMin) {
        pnMin = pn;
        pnMinDate = p.createdAt;
      }
      if (pn > pnMax) {
        pnMax = pn;
        pnMaxDate = p.createdAt;
      }
      pnSum += pn;
    }

    const lastPerNight = perNightPrices[perNightPrices.length - 1];

    perNight = {
      min: pnMin,
      minDate: pnMinDate,
      max: pnMax,
      maxDate: pnMaxDate,
      avg: Math.round(pnSum / perNightPrices.length),
      current: lastPerNight.pricePerNight,
    };
  }

  const lastLog = logs[logs.length - 1];

  return {
    prices,
    stats: {
      min,
      minDate,
      max,
      maxDate,
      avg: Math.round(sum / prices.length),
      current: lastLog.priceAmount,
      currentCurrency: lastLog.priceCurrency ?? 'KRW',
      count: prices.length,
      perNight,
    },
  };
}
