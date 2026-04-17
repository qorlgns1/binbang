import {
  type Accommodation,
  type CheckLog,
  Accommodation as AccommodationEntity,
  AgodaConsentLog,
  CheckLog as CheckLogEntity,
  In,
  PlanQuota,
  QuotaKey,
  User,
  getDataSource,
} from '@workspace/db';

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

export interface CreateAgodaApiAccommodationInput {
  userId: string;
  userEmail: string;
  platformId: string; // Agoda hotelId
  name: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  rooms: number;
  currency: string;
  locale: string;
}

export interface UpdateAccommodationInput {
  name?: string;
  url?: string;
  checkIn?: Date;
  checkOut?: Date;
  adults?: number;
  isActive?: boolean;
  priceDropThreshold?: number | null;
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
  const ds = await getDataSource();
  const rows = await ds.getRepository(AccommodationEntity).find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });

  // 각 숙소의 최신 에러 로그 가져오기 (check errors)
  if (rows.length === 0) return rows;

  const accommodationIds = rows.map((r) => r.id);

  const checkErrors = await ds.query<{ accommodationId: string; errorMessage: string; createdAt: Date }[]>(
    `SELECT * FROM (
      SELECT cl."accommodationId", cl."errorMessage", cl."createdAt",
             ROW_NUMBER() OVER (PARTITION BY cl."accommodationId" ORDER BY cl."createdAt" DESC) AS rn
      FROM "CheckLog" cl
      WHERE cl."accommodationId" IN (${accommodationIds.map((_, i) => `:${i + 1}`).join(', ')})
        AND cl."status" = 'ERROR' AND cl."errorMessage" IS NOT NULL
    ) WHERE rn = 1`,
    accommodationIds,
  );

  let pollErrors: { accommodationId: string; error: string; polledAt: Date }[] = [];
  try {
    pollErrors = await ds.query<{ accommodationId: string; error: string; polledAt: Date }[]>(
      `SELECT * FROM (
        SELECT pr."accommodationId",
               pr."error" AS "error",
               pr."polledAt",
               ROW_NUMBER() OVER (PARTITION BY pr."accommodationId" ORDER BY pr."polledAt" DESC) AS rn
        FROM "agoda_poll_runs" pr
        WHERE pr."accommodationId" IN (${accommodationIds.map((_, i) => `:${i + 1}`).join(', ')})
          AND pr."status" = 'failed' AND pr."error" IS NOT NULL
      ) WHERE rn = 1`,
      accommodationIds,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ORA-00942') || error.message.includes('ERR_BUFFER_OUT_OF_BOUNDS'))
    ) {
      console.warn('[accommodations] poll error lookup skipped due to Oracle query issue');
      pollErrors = [];
    } else {
      throw error;
    }
  }

  const checkErrorMap = new Map(checkErrors.map((e) => [e.accommodationId, e]));
  const pollErrorMap = new Map(pollErrors.map((e) => [e.accommodationId, e]));

  return rows.map((row) => {
    const checkErr = checkErrorMap.get(row.id);
    const pollErr = pollErrorMap.get(row.id);

    const latestError =
      checkErr && pollErr
        ? new Date(checkErr.createdAt) >= new Date(pollErr.polledAt)
          ? { message: checkErr.errorMessage, at: new Date(checkErr.createdAt) }
          : { message: pollErr.error, at: new Date(pollErr.polledAt) }
        : checkErr
          ? { message: checkErr.errorMessage, at: new Date(checkErr.createdAt) }
          : pollErr
            ? { message: pollErr.error, at: new Date(pollErr.polledAt) }
            : null;

    return Object.assign(row, {
      lastErrorMessage: latestError?.message ?? null,
      lastErrorAt: latestError?.at ?? null,
    });
  });
}

export async function getAccommodationById(id: string, userId: string): Promise<AccommodationWithLogs | null> {
  const ds = await getDataSource();
  const accommodation = await ds.getRepository(AccommodationEntity).findOne({
    where: { id, userId },
  });

  if (!accommodation) return null;

  const checkLogs = await ds.getRepository(CheckLogEntity).find({
    where: { accommodationId: id },
    order: { createdAt: 'DESC' },
    take: 50,
  });

  return Object.assign(accommodation, { checkLogs });
}

export async function checkUserQuota(userId: string): Promise<QuotaCheckResult> {
  const ds = await getDataSource();

  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: { planId: true },
  });

  const max = user?.planId
    ? ((
        await ds.getRepository(PlanQuota).findOne({
          where: { planId: user.planId, key: QuotaKey.MAX_ACCOMMODATIONS },
          select: { value: true },
        })
      )?.value ?? 5)
    : 5;

  const current = await ds.getRepository(AccommodationEntity).count({ where: { userId } });

  return { allowed: current < max, max, current };
}

export async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  const ds = await getDataSource();
  const repo = ds.getRepository(AccommodationEntity);
  const accommodation = repo.create({
    userId: input.userId,
    name: input.name,
    platform: input.platform,
    url: input.url,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    isActive: true,
  });
  await repo.save(accommodation);
  return accommodation;
}

export async function createAgodaApiAccommodation(input: CreateAgodaApiAccommodationInput): Promise<Accommodation> {
  const ds = await getDataSource();

  const accommodation = await ds.transaction(async (manager) => {
    const repo = manager.getRepository(AccommodationEntity);
    const created = repo.create({
      userId: input.userId,
      name: input.name,
      platform: 'AGODA',
      platformId: input.platformId,
      url: null,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      children: input.children,
      rooms: input.rooms,
      currency: input.currency,
      locale: input.locale,
      isActive: true,
    });
    await repo.save(created);

    // 알림 등록 시 수신동의(opt_in)를 consent log에 기록한다.
    const consentRepo = manager.getRepository(AgodaConsentLog);
    const consent = consentRepo.create({
      userId: input.userId,
      accommodationId: created.id,
      email: input.userEmail.trim().toLowerCase(),
      type: 'opt_in',
    });
    await consentRepo.save(consent);

    return created;
  });

  return accommodation;
}

export async function updateAccommodation(
  id: string,
  userId: string,
  input: UpdateAccommodationInput,
): Promise<Accommodation | null> {
  const ds = await getDataSource();
  const repo = ds.getRepository(AccommodationEntity);

  const existing = await repo.findOne({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;

  const updateData: Partial<AccommodationEntity> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.url !== undefined) updateData.url = input.url;
  if (input.checkIn !== undefined) updateData.checkIn = input.checkIn;
  if (input.checkOut !== undefined) updateData.checkOut = input.checkOut;
  if (input.adults !== undefined) updateData.adults = input.adults;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.priceDropThreshold !== undefined) updateData.priceDropThreshold = input.priceDropThreshold;

  await repo.update({ id }, updateData);
  return repo.findOne({ where: { id } });
}

export async function deleteAccommodation(id: string, userId: string): Promise<boolean> {
  const ds = await getDataSource();
  const repo = ds.getRepository(AccommodationEntity);

  const existing = await repo.findOne({ where: { id, userId }, select: { id: true } });
  if (!existing) return false;

  await repo.delete({ id });
  return true;
}

export async function deleteAccommodations(ids: string[], userId: string): Promise<number> {
  const ds = await getDataSource();
  const result = await ds.getRepository(AccommodationEntity).delete({ id: In(ids), userId });
  return result.affected ?? 0;
}

export async function getAccommodationLogs(input: GetLogsInput): Promise<GetLogsResult> {
  const ds = await getDataSource();
  let cursorDate: Date | string | null = null;

  if (input.cursor) {
    const cursorRows = (await ds.query(
      `SELECT cl."createdAt" AS "createdAt"
         FROM "CheckLog" cl
        WHERE cl."id" = :1
        FETCH FIRST 1 ROWS ONLY`,
      [input.cursor],
    )) as Array<{ createdAt?: Date | string | null }>;

    cursorDate = cursorRows[0]?.createdAt ?? null;
  }

  const parameters: unknown[] = [input.accommodationId];
  const whereClauses = ['cl."accommodationId" = :1'];

  if (cursorDate) {
    parameters.push(cursorDate, input.cursor);
    whereClauses.push('(cl."createdAt" < :2 OR (cl."createdAt" = :2 AND cl."id" < :3))');
  }

  const rawLogs = (await ds.query(
    `SELECT cl."id" AS "id",
            cl."accommodationId" AS "accommodationId",
            cl."userId" AS "userId",
            cl."status" AS "status",
            cl."price" AS "price",
            cl."priceAmount" AS "priceAmount",
            cl."priceCurrency" AS "priceCurrency",
            cl."errorMessage" AS "errorMessage",
            cl."notificationSent" AS "notificationSent",
            cl."checkIn" AS "checkIn",
            cl."checkOut" AS "checkOut",
            cl."pricePerNight" AS "pricePerNight",
            cl."cycleId" AS "cycleId",
            cl."durationMs" AS "durationMs",
            cl."retryCount" AS "retryCount",
            cl."previousStatus" AS "previousStatus",
            cl."createdAt" AS "createdAt"
       FROM "CheckLog" cl
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY cl."createdAt" DESC, cl."id" DESC
      FETCH NEXT ${input.limit + 1} ROWS ONLY`,
    parameters,
  )) as Array<Record<string, unknown>>;

  const logs = rawLogs.map(
    (row) =>
      ({
        id: String(row.id),
        accommodationId: String(row.accommodationId),
        userId: String(row.userId),
        status: row.status as CheckLog['status'],
        price: (row.price as string | null) ?? null,
        priceAmount: row.priceAmount == null ? null : Number(row.priceAmount),
        priceCurrency: (row.priceCurrency as string | null) ?? null,
        errorMessage: (row.errorMessage as string | null) ?? null,
        notificationSent: Number(row.notificationSent ?? 0) === 1,
        checkIn: row.checkIn ? new Date(String(row.checkIn)) : null,
        checkOut: row.checkOut ? new Date(String(row.checkOut)) : null,
        pricePerNight: row.pricePerNight == null ? null : Number(row.pricePerNight),
        cycleId: (row.cycleId as string | null) ?? null,
        durationMs: row.durationMs == null ? null : Number(row.durationMs),
        retryCount: row.retryCount == null ? 0 : Number(row.retryCount),
        previousStatus: (row.previousStatus as CheckLog['previousStatus']) ?? null,
        createdAt: new Date(String(row.createdAt)),
      }) as CheckLog,
  );

  const hasMore = logs.length > input.limit;
  const items = hasMore ? logs.slice(0, input.limit) : logs;

  return {
    logs: items,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

export async function pauseExpiredAccommodations(userId: string): Promise<number> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const ds = await getDataSource();
  const result = (await ds.query(
    `UPDATE "Accommodation"
     SET "isActive" = 0,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "userId" = :1
       AND "isActive" = 1
       AND "checkIn" < :2`,
    [userId, today],
  )) as { rowsAffected?: number } | undefined;

  return result?.rowsAffected ?? 0;
}

export async function verifyAccommodationOwnership(id: string, userId: string): Promise<boolean> {
  const ds = await getDataSource();
  const accommodation = await ds.getRepository(AccommodationEntity).findOne({
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

async function getAgodaApiPriceHistory(params: {
  accommodationId: string;
  checkIn: Date;
  checkOut: Date;
  dateFilter: { gte?: Date; lte?: Date };
}): Promise<PriceHistoryResponse> {
  const ds = await getDataSource();

  const parameters: unknown[] = [params.accommodationId];
  const whereClauses = ['s."accommodationId" = :1', 's."totalInclusive" IS NOT NULL'];

  if (params.dateFilter.gte) {
    parameters.push(params.dateFilter.gte);
    whereClauses.push(`s."createdAt" >= :${parameters.length}`);
  }

  if (params.dateFilter.lte) {
    parameters.push(params.dateFilter.lte);
    whereClauses.push(`s."createdAt" <= :${parameters.length}`);
  }

  const snapshots = (await ds.query(
    `SELECT s."pollRunId" AS "pollRunId",
            s."createdAt" AS "createdAt",
            s."totalInclusive" AS "totalInclusive",
            s."currency" AS "currency"
       FROM "agoda_room_snapshots" s
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY s."createdAt" ASC
      FETCH NEXT ${MAX_PRICE_RECORDS} ROWS ONLY`,
    parameters,
  )) as Array<{
    pollRunId: bigint | number | string;
    createdAt: Date | string;
    totalInclusive: number | string;
    currency: string | null;
  }>;

  if (snapshots.length === 0) return { prices: [], stats: null };

  // poll run당 최저가 스냅샷 하나만 사용
  const byPollRun = new Map<string, (typeof snapshots)[0]>();
  for (const snap of snapshots) {
    const key = String(snap.pollRunId);
    const existing = byPollRun.get(key);
    if (!existing || Number(snap.totalInclusive) < Number(existing.totalInclusive)) {
      byPollRun.set(key, snap);
    }
  }

  const pollData = [...byPollRun.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const nights = Math.round((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const prices: PriceDataPoint[] = pollData.map((snap, idx): PriceDataPoint => {
    const priceAmount = Number(snap.totalInclusive);
    const currentTime = new Date(snap.createdAt).getTime();
    const windowStart = currentTime - MOVING_AVG_WINDOW_MS;

    let sum = 0;
    let count = 0;
    for (let j = idx; j >= 0; j--) {
      if (new Date(pollData[j].createdAt).getTime() < windowStart) break;
      sum += Number(pollData[j].totalInclusive);
      count++;
    }

    return {
      createdAt: new Date(snap.createdAt).toISOString(),
      priceAmount,
      priceCurrency: snap.currency ?? 'USD',
      pricePerNight: nights > 0 ? Math.round(priceAmount / nights) : null,
      movingAvg: count >= 2 ? Math.round(sum / count) : null,
      isLegacy: false,
    };
  });

  return buildPriceStats(prices);
}

function buildPriceStats(prices: PriceDataPoint[]): PriceHistoryResponse {
  if (prices.length === 0) return { prices: [], stats: null };

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

  const last = prices[prices.length - 1];

  return {
    prices,
    stats: {
      min,
      minDate,
      max,
      maxDate,
      avg: Math.round(sum / prices.length),
      current: last.priceAmount,
      currentCurrency: last.priceCurrency,
      count: prices.length,
      perNight,
    },
  };
}

export async function getAccommodationPriceHistory(input: GetPriceHistoryInput): Promise<PriceHistoryResponse | null> {
  const ds = await getDataSource();
  const accommodation = await ds.getRepository(AccommodationEntity).findOne({
    where: { id: input.accommodationId, userId: input.userId },
    select: { id: true, checkIn: true, checkOut: true, platformId: true },
  });

  if (!accommodation) return null;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (input.from) {
    const fromDate = new Date(input.from);
    if (!Number.isNaN(fromDate.getTime())) dateFilter.gte = fromDate;
  }
  if (input.to) {
    const toDate = new Date(input.to);
    if (!Number.isNaN(toDate.getTime())) dateFilter.lte = toDate;
  }

  if (accommodation.platformId) {
    return getAgodaApiPriceHistory({
      accommodationId: accommodation.id,
      checkIn: accommodation.checkIn,
      checkOut: accommodation.checkOut,
      dateFilter,
    });
  }

  // 현재 일정과 일치하는 로그 + 레거시(일정 미기록) 로그만 조회
  let qb = ds
    .getRepository(CheckLogEntity)
    .createQueryBuilder('cl')
    .where('cl."accommodationId" = :id AND cl."priceAmount" IS NOT NULL', { id: input.accommodationId })
    .andWhere('(cl."checkIn" = :checkIn AND cl."checkOut" = :checkOut) OR cl."checkIn" IS NULL', {
      checkIn: accommodation.checkIn,
      checkOut: accommodation.checkOut,
    })
    .orderBy('cl."createdAt"', 'DESC')
    .take(MAX_PRICE_RECORDS);

  if (dateFilter.gte) qb = qb.andWhere('cl."createdAt" >= :gte', { gte: dateFilter.gte });
  if (dateFilter.lte) qb = qb.andWhere('cl."createdAt" <= :lte', { lte: dateFilter.lte });

  const logs = await qb.getMany();

  if (logs.length === 0) return { prices: [], stats: null };

  logs.reverse(); // 시간순으로

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

  return buildPriceStats(prices);
}
