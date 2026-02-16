import { beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshPublicAvailabilitySnapshots } from './publicAvailabilitySnapshots';

const { mockQueryRaw, mockTransaction, mockPublicPropertyUpsert, mockSnapshotUpsert } = vi.hoisted(
  (): {
    mockQueryRaw: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
    mockPublicPropertyUpsert: ReturnType<typeof vi.fn>;
    mockSnapshotUpsert: ReturnType<typeof vi.fn>;
  } => ({
    mockQueryRaw: vi.fn(),
    mockTransaction: vi.fn(),
    mockPublicPropertyUpsert: vi.fn(),
    mockSnapshotUpsert: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    publicProperty: {
      upsert: mockPublicPropertyUpsert,
    },
    publicAvailabilitySnapshot: {
      upsert: mockSnapshotUpsert,
    },
  },
}));

describe('publicAvailabilitySnapshots', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockPublicPropertyUpsert.mockResolvedValue({ id: 'pub_1' });
    mockSnapshotUpsert.mockResolvedValue({ id: 'snap_1' });
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) => Promise.all(queries));
  });

  it('aggregates accommodations by platform property key and upserts one snapshot per public property', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      {
        accommodationId: 'acc_1',
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
        sampleSize: 3,
        priceCount: 3,
        priceSum: BigInt(300000),
        minPriceAmount: 90000,
        maxPriceAmount: 110000,
        availableCount: 2,
        unavailableCount: 1,
        errorCount: 0,
      },
      {
        accommodationId: 'acc_2',
        platform: 'AIRBNB',
        platformId: '12345',
        url: 'https://www.airbnb.com/rooms/12345?source=search',
        name: '사용자 지정 이름 2',
        platformName: 'Gangnam Stay Deluxe',
        platformImage: null,
        platformDescription: null,
        addressCountry: 'KR',
        addressRegion: 'Seoul',
        addressLocality: 'Gangnam-gu',
        ratingValue: 4.8,
        reviewCount: 220,
        latitude: 37.5,
        longitude: 127.0,
        lastPriceCurrency: 'KRW',
        sampleSize: 2,
        priceCount: 1,
        priceSum: BigInt(70000),
        minPriceAmount: 70000,
        maxPriceAmount: 70000,
        availableCount: 1,
        unavailableCount: 0,
        errorCount: 1,
      },
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

    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });

  it('skips rows that cannot derive a public property key', async (): Promise<void> => {
    mockQueryRaw.mockResolvedValue([
      {
        accommodationId: 'acc_1',
        platform: 'AGODA',
        platformId: null,
        url: 'not-a-valid-url',
        name: 'No Key',
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
        sampleSize: 1,
        priceCount: 1,
        priceSum: BigInt(100000),
        minPriceAmount: 100000,
        maxPriceAmount: 100000,
        availableCount: 1,
        unavailableCount: 0,
        errorCount: 0,
      },
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
    expect(mockTransaction).not.toHaveBeenCalled();
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
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('batches upserts into groups of 100', async (): Promise<void> => {
    const rows = Array.from({ length: 150 }, (_, i) => ({
      accommodationId: `acc_${i}`,
      platform: 'AIRBNB',
      platformId: `pid_${i}`,
      url: `https://www.airbnb.com/rooms/${i}`,
      name: `Property ${i}`,
      platformName: `Platform Name ${i}`,
      platformImage: null,
      platformDescription: null,
      addressCountry: 'KR',
      addressRegion: 'Seoul',
      addressLocality: 'Gangnam-gu',
      ratingValue: 4.5,
      reviewCount: 100,
      latitude: 37.5,
      longitude: 127.0,
      lastPriceCurrency: 'KRW',
      sampleSize: 10,
      priceCount: 5,
      priceSum: BigInt(500000),
      minPriceAmount: 80000,
      maxPriceAmount: 120000,
      availableCount: 6,
      unavailableCount: 3,
      errorCount: 1,
    }));

    mockQueryRaw.mockResolvedValue(rows);
    mockPublicPropertyUpsert.mockImplementation(
      async (args: { where: { platform_platformPropertyKey: { platformPropertyKey: string } } }) => ({
        id: `pub_${args.where.platform_platformPropertyKey.platformPropertyKey}`,
      }),
    );

    const result = await refreshPublicAvailabilitySnapshots({
      now: new Date('2026-02-15T12:00:00.000Z'),
    });

    expect(result.upsertedProperties).toBe(150);
    expect(result.upsertedSnapshots).toBe(150);
    // 150 properties → 2 batches (100 + 50) × 2 phases (property + snapshot) = 4 transactions
    expect(mockTransaction).toHaveBeenCalledTimes(4);
  });
});
