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

const { mockFindMany, mockFindFirst, mockFindUnique, mockCreate, mockUpdate, mockDelete, mockCheckLogFindMany } =
  vi.hoisted(
    (): {
      mockFindMany: ReturnType<typeof vi.fn>;
      mockFindFirst: ReturnType<typeof vi.fn>;
      mockFindUnique: ReturnType<typeof vi.fn>;
      mockCreate: ReturnType<typeof vi.fn>;
      mockUpdate: ReturnType<typeof vi.fn>;
      mockDelete: ReturnType<typeof vi.fn>;
      mockCheckLogFindMany: ReturnType<typeof vi.fn>;
    } => ({
      mockFindMany: vi.fn(),
      mockFindFirst: vi.fn(),
      mockFindUnique: vi.fn(),
      mockCreate: vi.fn(),
      mockUpdate: vi.fn(),
      mockDelete: vi.fn(),
      mockCheckLogFindMany: vi.fn(),
    }),
  );

vi.mock('@workspace/db', () => ({
  prisma: {
    accommodation: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
    user: {
      findUnique: mockFindUnique,
    },
    checkLog: {
      findMany: mockCheckLogFindMany,
    },
  },
  QuotaKey: { MAX_ACCOMMODATIONS: 'MAX_ACCOMMODATIONS' },
}));

describe('accommodations.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
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
      mockFindMany.mockResolvedValue(list);

      const result = await getAccommodationsByUserId(userId);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual(list);
    });
  });

  describe('getAccommodationById', (): void => {
    it('returns null when not found', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await getAccommodationById('acc-1', 'user-1');

      expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'acc-1', userId: 'user-1' } }));
      expect(result).toBeNull();
    });

    it('returns accommodation with checkLogs when found', async (): Promise<void> => {
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
        checkLogs: [],
      };
      mockFindFirst.mockResolvedValue(acc);

      const result = await getAccommodationById('acc-1', 'user-1');

      expect(result).toEqual(acc);
    });
  });

  describe('checkUserQuota', (): void => {
    it('allows when current < max', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue({
        plan: { quotas: [{ value: 10 }] },
        _count: { accommodations: 3 },
      });

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: true, max: 10, current: 3 });
    });

    it('denies when current >= max', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue({
        plan: { quotas: [{ value: 5 }] },
        _count: { accommodations: 5 },
      });

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: false, max: 5, current: 5 });
    });

    it('uses default max 5 when user/plan missing', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue(null);

      const result = await checkUserQuota('user-1');

      expect(result).toEqual({ allowed: true, max: 5, current: 0 });
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
      mockCreate.mockResolvedValue(created);

      const result = await createAccommodation(input);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: input.userId,
            name: input.name,
            platform: input.platform,
            url: input.url,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            adults: input.adults,
          },
        }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('updateAccommodation', (): void => {
    it('returns null when accommodation not found for user', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await updateAccommodation('acc-1', 'user-1', { name: 'New Name' });

      expect(result).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('updates and returns accommodation when found', async (): Promise<void> => {
      mockFindFirst.mockResolvedValueOnce({ id: 'acc-1' });
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
      mockUpdate.mockResolvedValue(updated);

      const result = await updateAccommodation('acc-1', 'user-1', { name: 'New Name' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'acc-1' },
          data: { name: 'New Name' },
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deleteAccommodation', (): void => {
    it('returns false when accommodation not found for user', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await deleteAccommodation('acc-1', 'user-1');

      expect(result).toBe(false);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes and returns true when found', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue({ id: 'acc-1' });
      mockDelete.mockResolvedValue({ id: 'acc-1' });

      const result = await deleteAccommodation('acc-1', 'user-1');

      expect(mockDelete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'acc-1' } }));
      expect(result).toBe(true);
    });
  });

  describe('getAccommodationLogs', (): void => {
    it('returns logs and nextCursor when more than limit', async (): Promise<void> => {
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
        createdAt: new Date(),
      }));
      mockCheckLogFindMany.mockResolvedValue(logs);

      const result = await getAccommodationLogs({
        accommodationId: 'acc-1',
        limit: 10,
      });

      expect(result.logs).toHaveLength(10);
      expect(result.nextCursor).toBe('log-9');
    });

    it('returns nextCursor null when no more', async (): Promise<void> => {
      mockCheckLogFindMany.mockResolvedValue([
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
          createdAt: new Date(),
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
      mockFindFirst.mockResolvedValue({ id: 'acc-1' });

      const result = await verifyAccommodationOwnership('acc-1', 'user-1');

      expect(result).toBe(true);
    });

    it('returns false when not found', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await verifyAccommodationOwnership('acc-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
