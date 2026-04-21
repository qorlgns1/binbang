import { beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshPublicAvailabilitySnapshots } from './publicAvailabilitySnapshots';

const { mockQueryRaw, mockPublicPropertyUpsert, mockSnapshotUpsert } = vi.hoisted(
  (): {
    mockQueryRaw: ReturnType<typeof vi.fn>;
    mockPublicPropertyUpsert: ReturnType<typeof vi.fn>;
    mockSnapshotUpsert: ReturnType<typeof vi.fn>;
  } => ({
    mockQueryRaw: vi.fn(),
    mockPublicPropertyUpsert: vi.fn(),
    mockSnapshotUpsert: vi.fn(),
  }),
);

interface PublicAvailabilitySnapshotsDbMock {
  dataSource: unknown;
  accommodationRepo: {
    find: ReturnType<typeof vi.fn>;
  };
  propertyRepo: {
    findOne: ReturnType<typeof vi.fn>;
  };
  snapshotRepo: {
    findOne: ReturnType<typeof vi.fn>;
  };
  getDataSource: ReturnType<typeof vi.fn>;
}

const dbMock = vi.hoisted(
  (): PublicAvailabilitySnapshotsDbMock => ({
    dataSource: null,
    accommodationRepo: {
      find: vi.fn(),
    },
    propertyRepo: {
      findOne: vi.fn(),
    },
    snapshotRepo: {
      findOne: vi.fn(),
    },
    getDataSource: vi.fn(),
  }),
);

const callMock = <TReturn>(fn: unknown, ...args: unknown[]): TReturn =>
  (fn as (...args: unknown[]) => TReturn)(...args);

function makeAggregateRow(
  overrides: Partial<{
    accommodationId: string;
    sampleSize: number;
    priceCount: number;
    priceSum: bigint;
    minPriceAmount: number | null;
    maxPriceAmount: number | null;
    availableCount: number;
    unavailableCount: number;
    errorCount: number;
  }> = {},
) {
  return {
    accommodationId: 'acc_1',
    sampleSize: 1,
    priceCount: 1,
    priceSum: BigInt(100000),
    minPriceAmount: 100000,
    maxPriceAmount: 100000,
    availableCount: 1,
    unavailableCount: 0,
    errorCount: 0,
    ...overrides,
  };
}

function makeAccommodation(
  overrides: Partial<{
    id: string;
    platform: string;
    platformId: string | null;
    url: string | null;
    name: string;
    platformName: string | null;
    platformImage: string | null;
    platformDescription: string | null;
    addressCountry: string | null;
    addressRegion: string | null;
    addressLocality: string | null;
    ratingValue: number | null;
    reviewCount: number | null;
    latitude: number | null;
    longitude: number | null;
    lastPriceCurrency: string | null;
  }> = {},
) {
  return {
    id: 'acc_1',
    platform: 'AGODA',
    platformId: null,
    url: 'https://example.com/properties/acc_1',
    name: 'Property',
    platformName: null,
    platformImage: null,
    platformDescription: null,
    addressCountry: null,
    addressRegion: null,
    addressLocality: null,
    ratingValue: null,
    reviewCount: null,
    latitude: null,
    longitude: null,
    lastPriceCurrency: null,
    ...overrides,
  };
}

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('./test-utils/mockDb');

  const accommodationRepo = createMockRepository();
  accommodationRepo.find.mockResolvedValue([]);

  const propertyRepo = createMockRepository();
  propertyRepo.findOne.mockResolvedValue(null);
  propertyRepo.save.mockImplementation(async (entity: Record<string, unknown>) => {
    const created = await callMock<Record<string, unknown>>(mockPublicPropertyUpsert, {
      where: {
        platform_platformPropertyKey: {
          platform: entity.platform,
          platformPropertyKey: entity.platformPropertyKey,
        },
      },
      create: entity,
      update: entity,
    });
    if (created && typeof created === 'object') Object.assign(entity, created);
    return entity;
  });
  propertyRepo.update.mockImplementation((where, data) => callMock(mockPublicPropertyUpsert, { where, update: data }));

  const snapshotRepo = createMockRepository();
  snapshotRepo.findOne.mockResolvedValue(null);
  snapshotRepo.save.mockImplementation(async (entity: Record<string, unknown>) => {
    await callMock(mockSnapshotUpsert, {
      where: {
        publicPropertyId_snapshotDate: {
          publicPropertyId: entity.publicPropertyId,
          snapshotDate: entity.snapshotDate,
        },
      },
      create: entity,
      update: entity,
    });
    return entity;
  });
  snapshotRepo.update.mockImplementation((where, data) => callMock(mockSnapshotUpsert, { where, update: data }));

  const dataSource = createMockDataSource({
    repositories: [
      [actual.Accommodation, accommodationRepo],
      [actual.PublicProperty, propertyRepo],
      [actual.PublicAvailabilitySnapshot, snapshotRepo],
    ],
    queryImplementation: (sql: string, params?: unknown[]) => callMock(mockQueryRaw, sql, params),
  });

  dbMock.dataSource = dataSource;
  dbMock.accommodationRepo = accommodationRepo;
  dbMock.propertyRepo = propertyRepo;
  dbMock.snapshotRepo = snapshotRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('publicAvailabilitySnapshots', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.accommodationRepo.find.mockResolvedValue([]);
    dbMock.propertyRepo.findOne.mockResolvedValue(null);
    dbMock.snapshotRepo.findOne.mockResolvedValue(null);
    mockPublicPropertyUpsert.mockResolvedValue({ id: 'pub_1' });
    mockSnapshotUpsert.mockResolvedValue({ id: 'snap_1' });
  });

  it('aggregates accommodations by platform property key and keeps CLOB columns out of the aggregate SQL', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      makeAggregateRow({
        accommodationId: 'acc_1',
        sampleSize: 3,
        priceCount: 3,
        priceSum: BigInt(300000),
        minPriceAmount: 90000,
        maxPriceAmount: 110000,
        availableCount: 2,
        unavailableCount: 1,
        errorCount: 0,
      }),
      makeAggregateRow({
        accommodationId: 'acc_2',
        sampleSize: 2,
        priceCount: 1,
        priceSum: BigInt(70000),
        minPriceAmount: 70000,
        maxPriceAmount: 70000,
        availableCount: 1,
        unavailableCount: 0,
        errorCount: 1,
      }),
    ]);
    dbMock.accommodationRepo.find.mockResolvedValue([
      makeAccommodation({
        id: 'acc_1',
        platform: 'AIRBNB',
        platformId: '12345',
        url: 'https://www.airbnb.com/rooms/12345',
        name: '사용자 지정 이름 1',
        platformName: 'Gangnam Stay',
        platformImage: 'https://img/1.jpg',
        platformDescription: 'desc-1',
        addressCountry: 'KR',
        addressRegion: 'Seoul',
        addressLocality: 'Gangnam-gu',
        ratingValue: 4.6,
        reviewCount: 140,
        latitude: 37.5,
        longitude: 127.0,
        lastPriceCurrency: 'KRW',
      }),
      makeAccommodation({
        id: 'acc_2',
        platform: 'AIRBNB',
        platformId: '12345',
        url: 'https://www.airbnb.com/rooms/12345?source=search',
        name: '사용자 지정 이름 2',
        platformName: 'Gangnam Stay Deluxe',
        addressCountry: 'KR',
        addressRegion: 'Seoul',
        addressLocality: 'Gangnam-gu',
        ratingValue: 4.8,
        reviewCount: 220,
        latitude: 37.5,
        longitude: 127.0,
        lastPriceCurrency: 'KRW',
      }),
    ]);

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
      windowDays: 30,
    });

    expect(result).toEqual({
      snapshotDate: '2026-02-15T00:00:00.000Z',
      windowStartAt: '2026-01-17T00:00:00.000Z',
      windowEndAt: '2026-02-15T23:59:59.999Z',
      scannedAccommodations: 2,
      upsertedProperties: 1,
      upsertedSnapshots: 1,
      skippedWithoutKey: 0,
      queryTimeMs: expect.any(Number),
      aggregationTimeMs: expect.any(Number),
      upsertTimeMs: expect.any(Number),
    });

    const [sql] = mockQueryRaw.mock.calls[0] as [string];
    expect(sql).toContain('cl."accommodationId"      AS "accommodationId"');
    expect(sql).toContain('GROUP BY cl."accommodationId"');
    expect(sql).not.toContain('a."url"');
    expect(sql).not.toContain('a."platformImage"');
    expect(sql).not.toContain('a."platformDescription"');

    expect(mockPublicPropertyUpsert).toHaveBeenCalledTimes(1);
    expect(mockPublicPropertyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          platform_platformPropertyKey: {
            platform: 'AIRBNB',
            platformPropertyKey: 'id:12345',
          },
        },
      }),
    );

    expect(mockSnapshotUpsert).toHaveBeenCalledTimes(1);
    expect(mockSnapshotUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sampleSize: 5,
          availableCount: 3,
          unavailableCount: 1,
          errorCount: 1,
          avgPriceAmount: 92500,
          minPriceAmount: 70000,
          maxPriceAmount: 110000,
          currency: 'KRW',
          openRate: 0.6,
        }),
      }),
    );
  });

  it('falls back to a normalized URL key when platformId is missing', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      makeAggregateRow({
        accommodationId: 'acc_url',
        sampleSize: 2,
        priceCount: 2,
        priceSum: BigInt(220000),
        minPriceAmount: 100000,
        maxPriceAmount: 120000,
        availableCount: 2,
      }),
    ]);
    dbMock.accommodationRepo.find.mockResolvedValue([
      makeAccommodation({
        id: 'acc_url',
        platform: 'AGODA',
        platformId: null,
        url: 'https://www.agoda.com/ko-kr/gangnam-stay/hotel/seoul-kr.html?cid=1',
        name: 'Gangnam Stay',
        platformName: 'Gangnam Stay',
        lastPriceCurrency: 'KRW',
      }),
    ]);

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
    });

    expect(result.upsertedProperties).toBe(1);
    expect(mockPublicPropertyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          platform_platformPropertyKey: {
            platform: 'AGODA',
            platformPropertyKey: 'url:agoda.com/ko-kr/gangnam-stay/hotel/seoul-kr.html',
          },
        },
      }),
    );
  });

  it('skips rows when accommodation metadata is missing', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      makeAggregateRow({
        accommodationId: 'acc_missing',
      }),
    ]);
    dbMock.accommodationRepo.find.mockResolvedValue([]);

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
    });

    expect(result.skippedWithoutKey).toBe(1);
    expect(result.upsertedProperties).toBe(0);
    expect(result.upsertedSnapshots).toBe(0);
    expect(mockPublicPropertyUpsert).not.toHaveBeenCalled();
    expect(mockSnapshotUpsert).not.toHaveBeenCalled();
  });

  it('skips rows that cannot derive a public property key from URL fallback', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      makeAggregateRow({
        accommodationId: 'acc_invalid_url',
      }),
    ]);
    dbMock.accommodationRepo.find.mockResolvedValue([
      makeAccommodation({
        id: 'acc_invalid_url',
        platform: 'AGODA',
        platformId: null,
        url: 'not-a-valid-url',
        name: 'No Key',
      }),
    ]);

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
      windowDays: 30,
    });

    expect(result.skippedWithoutKey).toBe(1);
    expect(result.upsertedProperties).toBe(0);
    expect(result.upsertedSnapshots).toBe(0);
    expect(mockPublicPropertyUpsert).not.toHaveBeenCalled();
    expect(mockSnapshotUpsert).not.toHaveBeenCalled();
  });

  it('returns zeros with timing metrics when no rows found', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
    });

    expect(result.scannedAccommodations).toBe(0);
    expect(result.upsertedProperties).toBe(0);
    expect(result.upsertedSnapshots).toBe(0);
    expect(result.skippedWithoutKey).toBe(0);
    expect(result.queryTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.aggregationTimeMs).toBe(0);
    expect(result.upsertTimeMs).toBe(0);
    expect(dbMock.accommodationRepo.find).not.toHaveBeenCalled();
  });

  it('chunks accommodation metadata fetches at 500 IDs and upserts snapshots in batches of 100', async (): Promise<void> => {
    const rows = Array.from({ length: 501 }, (_, i) =>
      makeAggregateRow({
        accommodationId: `acc_${i}`,
        sampleSize: 10,
        priceCount: 5,
        priceSum: BigInt(500000),
        minPriceAmount: 80000,
        maxPriceAmount: 120000,
        availableCount: 6,
        unavailableCount: 3,
        errorCount: 1,
      }),
    );
    const accommodations = Array.from({ length: 501 }, (_, i) =>
      makeAccommodation({
        id: `acc_${i}`,
        platform: 'AIRBNB',
        platformId: `pid_${i}`,
        url: `https://www.airbnb.com/rooms/${i}`,
        name: `Property ${i}`,
        platformName: `Platform Name ${i}`,
        addressCountry: 'KR',
        addressRegion: 'Seoul',
        addressLocality: 'Gangnam-gu',
        ratingValue: 4.5,
        reviewCount: 100,
        latitude: 37.5,
        longitude: 127.0,
        lastPriceCurrency: 'KRW',
      }),
    );

    mockQueryRaw.mockResolvedValue(rows);
    dbMock.accommodationRepo.find
      .mockResolvedValueOnce(accommodations.slice(0, 500))
      .mockResolvedValueOnce(accommodations.slice(500));
    mockPublicPropertyUpsert.mockImplementation(
      async (args: { where: { platform_platformPropertyKey: { platformPropertyKey: string } } }) => ({
        id: `pub_${args.where.platform_platformPropertyKey.platformPropertyKey}`,
      }),
    );

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
    });

    expect(result.upsertedProperties).toBe(501);
    expect(result.upsertedSnapshots).toBe(501);
    expect(dbMock.accommodationRepo.find).toHaveBeenCalledTimes(2);
    expect(mockPublicPropertyUpsert).toHaveBeenCalledTimes(501);
    expect(mockSnapshotUpsert).toHaveBeenCalledTimes(501);
  });
});
