import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkUserQuota,
  createAccommodation,
  deleteAccommodation,
  getAccommodationById,
  getAccommodationsByUserId,
  getAccommodationLogs,
  updateAccommodation,
  verifyAccommodationOwnership,
} from './accommodations.service';

const dbMock = vi.hoisted(
  (): {
    dataSource: {
      query: ReturnType<typeof vi.fn>;
    };
    accommodationRepo: {
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    userRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    planQuotaRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    checkLogRepo: {
      createQueryBuilder: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
      queryBuilder: {
        getMany: ReturnType<typeof vi.fn>;
      };
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: {
      query: vi.fn(),
    },
    accommodationRepo: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    },
    userRepo: {
      findOne: vi.fn(),
    },
    planQuotaRepo: {
      findOne: vi.fn(),
    },
    checkLogRepo: {
      createQueryBuilder: vi.fn(),
      find: vi.fn(),
      queryBuilder: {
        getMany: vi.fn(),
      },
    },
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const accommodationRepo = createMockRepository();
  const userRepo = createMockRepository();
  const planQuotaRepo = createMockRepository();
  const checkLogRepo = createMockRepository();
  const dataSource = createMockDataSource({
    repositories: [
      [actual.Accommodation, accommodationRepo],
      [actual.User, userRepo],
      [actual.PlanQuota, planQuotaRepo],
      [actual.CheckLog, checkLogRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  dbMock.accommodationRepo = accommodationRepo;
  dbMock.userRepo = userRepo;
  dbMock.planQuotaRepo = planQuotaRepo;
  dbMock.checkLogRepo = checkLogRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('accommodations.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.dataSource.query.mockResolvedValue([]);
  });

  describe('getAccommodationsByUserId', (): void => {
    it('returns accommodations for userId', async (): Promise<void> => {
      const userId = 'user-1';
      const list = [
        {
          id: 'acc-1',
          userId,
          name: 'Stay',
          platform: 'AIRBNB' as const,
          url: 'https://airbnb.com/rooms/1',
          checkIn: new Date(),
          checkOut: new Date(),
          adults: 2,
          rooms: 1,
          isActive: true,
          lastCheck: null,
          lastStatus: null,
          lastPrice: null,
          lastPriceAmount: null,
          lastPriceCurrency: null,
          platformId: null,
          platformName: null,
          platformImage: null,
          platformDescription: null,
          addressCountry: null,
          addressRegion: null,
          addressLocality: null,
          postalCode: null,
          streetAddress: null,
          ratingValue: null,
          reviewCount: null,
          latitude: null,
          longitude: null,
          platformMetadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      dbMock.accommodationRepo.find.mockResolvedValue(list);

      const result = await getAccommodationsByUserId(userId);

      expect(dbMock.accommodationRepo.find).toHaveBeenCalledWith({ where: { userId }, order: { createdAt: 'DESC' } });
      expect(dbMock.dataSource.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        expect.objectContaining({
          ...list[0],
          lastErrorMessage: null,
          lastErrorAt: null,
        }),
      ]);
    });
  });

  describe('getAccommodationById', (): void => {
    it('returns null when not found', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue(null);

      const result = await getAccommodationById('acc-1', 'user-1');

      expect(dbMock.accommodationRepo.findOne).toHaveBeenCalledWith({ where: { id: 'acc-1', userId: 'user-1' } });
      expect(result).toBeNull();
    });

    it('returns accommodation with checkLogs when found', async (): Promise<void> => {
      const checkLogs: unknown[] = [];
      const acc = {
        id: 'acc-1',
        userId: 'user-1',
        name: 'Stay',
        platform: 'AGODA' as const,
        url: 'https://agoda.com/1',
        checkIn: new Date(),
        checkOut: new Date(),
        adults: 2,
        rooms: 1,
        isActive: true,
        lastCheck: null,
        lastStatus: null,
        lastPrice: null,
        lastPriceAmount: null,
        lastPriceCurrency: null,
        platformId: null,
        platformName: null,
        platformImage: null,
        platformDescription: null,
        addressCountry: null,
        addressRegion: null,
        addressLocality: null,
        postalCode: null,
        streetAddress: null,
        ratingValue: null,
        reviewCount: null,
        latitude: null,
        longitude: null,
        platformMetadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.accommodationRepo.findOne.mockResolvedValue(acc);
      dbMock.checkLogRepo.find.mockResolvedValue(checkLogs);

      const result = await getAccommodationById('acc-1', 'user-1');

      expect(dbMock.checkLogRepo.find).toHaveBeenCalledWith({
        where: { accommodationId: 'acc-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual({ ...acc, checkLogs });
    });
  });

  describe('checkUserQuota', (): void => {
    it('allows when current < max', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({ planId: 'plan_1' });
      dbMock.planQuotaRepo.findOne.mockResolvedValue({ value: 10 });
      dbMock.accommodationRepo.count.mockResolvedValue(3);

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: true, max: 10, current: 3 });
    });

    it('denies when current >= max', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({ planId: 'plan_1' });
      dbMock.planQuotaRepo.findOne.mockResolvedValue({ value: 5 });
      dbMock.accommodationRepo.count.mockResolvedValue(5);

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: false, max: 5, current: 5 });
    });

    it('uses default max 5 when user/plan missing', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue(null);
      dbMock.accommodationRepo.count.mockResolvedValue(0);

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: true, max: 5, current: 0 });
      expect(dbMock.planQuotaRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('createAccommodation', (): void => {
    it('creates and returns accommodation', async (): Promise<void> => {
      const input = {
        userId: 'user-1',
        name: 'My Stay',
        platform: 'AIRBNB' as const,
        url: 'https://airbnb.com/rooms/1',
        checkIn: new Date('2025-06-01'),
        checkOut: new Date('2025-06-03'),
        adults: 2,
      };
      const created = {
        ...input,
        id: 'acc-new',
        rooms: 1,
        isActive: true,
        lastCheck: null,
        lastStatus: null,
        lastPrice: null,
        lastPriceAmount: null,
        lastPriceCurrency: null,
        platformId: null,
        platformName: null,
        platformImage: null,
        platformDescription: null,
        addressCountry: null,
        addressRegion: null,
        addressLocality: null,
        postalCode: null,
        streetAddress: null,
        ratingValue: null,
        reviewCount: null,
        latitude: null,
        longitude: null,
        platformMetadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.accommodationRepo.create.mockReturnValue(created);

      const result = await createAccommodation(input);

      expect(dbMock.accommodationRepo.create).toHaveBeenCalledWith({
        userId: input.userId,
        name: input.name,
        platform: input.platform,
        url: input.url,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        adults: input.adults,
        isActive: true,
      });
      expect(dbMock.accommodationRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('updateAccommodation', (): void => {
    it('returns null when accommodation not found for user', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue(null);

      const result = await updateAccommodation('acc-1', 'user-1', { name: 'New Name' });

      expect(result).toBeNull();
      expect(dbMock.accommodationRepo.update).not.toHaveBeenCalled();
    });

    it('updates and returns accommodation when found', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValueOnce({ id: 'acc-1' });
      const updated = {
        id: 'acc-1',
        userId: 'user-1',
        name: 'New Name',
        platform: 'AIRBNB' as const,
        url: 'https://airbnb.com/rooms/1',
        checkIn: new Date(),
        checkOut: new Date(),
        adults: 2,
        rooms: 1,
        isActive: true,
        lastCheck: null,
        lastStatus: null,
        lastPrice: null,
        lastPriceAmount: null,
        lastPriceCurrency: null,
        platformId: null,
        platformName: null,
        platformImage: null,
        platformDescription: null,
        addressCountry: null,
        addressRegion: null,
        addressLocality: null,
        postalCode: null,
        streetAddress: null,
        ratingValue: null,
        reviewCount: null,
        latitude: null,
        longitude: null,
        platformMetadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dbMock.accommodationRepo.findOne.mockResolvedValueOnce(updated);

      const result = await updateAccommodation('acc-1', 'user-1', { name: 'New Name' });

      expect(dbMock.accommodationRepo.update).toHaveBeenCalledWith({ id: 'acc-1' }, { name: 'New Name' });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteAccommodation', (): void => {
    it('returns false when accommodation not found for user', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue(null);

      const result = await deleteAccommodation('acc-1', 'user-1');

      expect(result).toBe(false);
      expect(dbMock.accommodationRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes and returns true when found', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue({ id: 'acc-1' });
      dbMock.accommodationRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await deleteAccommodation('acc-1', 'user-1');

      expect(dbMock.accommodationRepo.delete).toHaveBeenCalledWith({ id: 'acc-1' });
      expect(result).toBe(true);
    });
  });

  describe('getAccommodationLogs', (): void => {
    it('returns logs and nextCursor when more than limit', async (): Promise<void> => {
      const createdAt = new Date('2026-04-15T00:00:00.000Z');
      const logs = Array.from({ length: 11 }, (_, i) => ({
        id: `log-${i}`,
        accommodationId: 'acc-1',
        userId: 'user-1',
        status: 'AVAILABLE' as const,
        price: '₩100,000',
        priceAmount: 100_000,
        priceCurrency: 'KRW',
        errorMessage: null,
        notificationSent: false,
        checkIn: new Date(),
        checkOut: new Date(),
        pricePerNight: 50_000,
        cycleId: null,
        durationMs: 1000,
        retryCount: 0,
        previousStatus: null,
        createdAt: createdAt.toISOString(),
      }));
      dbMock.dataSource.query.mockResolvedValue(logs);

      const result = await getAccommodationLogs({
        accommodationId: 'acc-1',
        limit: 10,
      });

      expect(dbMock.dataSource.query).toHaveBeenCalledWith(expect.stringContaining('FROM "CheckLog" cl'), ['acc-1']);
      expect(result.logs).toHaveLength(10);
      expect(result.nextCursor).toBe('log-9');
    });

    it('returns nextCursor null when no more', async (): Promise<void> => {
      dbMock.dataSource.query.mockResolvedValue([
        {
          id: 'log-1',
          accommodationId: 'acc-1',
          userId: 'user-1',
          status: 'AVAILABLE' as const,
          price: null,
          priceAmount: null,
          priceCurrency: null,
          errorMessage: null,
          notificationSent: false,
          checkIn: new Date(),
          checkOut: new Date(),
          pricePerNight: null,
          cycleId: null,
          durationMs: 0,
          retryCount: 0,
          previousStatus: null,
          createdAt: '2026-04-15T00:00:00.000Z',
        },
      ]);

      const result = await getAccommodationLogs({
        accommodationId: 'acc-1',
        limit: 10,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('verifyAccommodationOwnership', (): void => {
    it('returns true when accommodation exists for user', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue({ id: 'acc-1' });

      const result = await verifyAccommodationOwnership('acc-1', 'user-1');

      expect(result).toBe(true);
    });

    it('returns false when not found', async (): Promise<void> => {
      dbMock.accommodationRepo.findOne.mockResolvedValue(null);

      const result = await verifyAccommodationOwnership('acc-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
