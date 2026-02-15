import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkUserExists, getUsers, getUserDetail, updateUserPlan, updateUserRoles } from './usersService';

const {
  mockUserFindMany,
  mockUserFindUnique,
  mockUserCount,
  mockUserUpdate,
  mockRoleFindMany,
  mockPlanFindMany,
  mockPlanFindUnique,
  mockCreateAuditLog,
} = vi.hoisted(
  (): {
    mockUserFindMany: ReturnType<typeof vi.fn>;
    mockUserFindUnique: ReturnType<typeof vi.fn>;
    mockUserCount: ReturnType<typeof vi.fn>;
    mockUserUpdate: ReturnType<typeof vi.fn>;
    mockRoleFindMany: ReturnType<typeof vi.fn>;
    mockPlanFindMany: ReturnType<typeof vi.fn>;
    mockPlanFindUnique: ReturnType<typeof vi.fn>;
    mockCreateAuditLog: ReturnType<typeof vi.fn>;
  } => ({
    mockUserFindMany: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockUserCount: vi.fn(),
    mockUserUpdate: vi.fn(),
    mockRoleFindMany: vi.fn(),
    mockPlanFindMany: vi.fn(),
    mockPlanFindUnique: vi.fn(),
    mockCreateAuditLog: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findMany: mockUserFindMany,
      findUnique: mockUserFindUnique,
      count: mockUserCount,
      update: mockUserUpdate,
    },
    role: {
      findMany: mockRoleFindMany,
    },
    plan: {
      findMany: mockPlanFindMany,
      findUnique: mockPlanFindUnique,
    },
  },
}));

vi.mock('@/services/admin/auditLogsService', () => ({
  createAuditLog: mockCreateAuditLog,
}));

describe('admin/users.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('getUsers', (): void => {
    it('returns users with nextCursor when more than limit', async (): Promise<void> => {
      const users = [
        {
          id: 'u1',
          name: 'A',
          email: 'a@b.co',
          image: null,
          roles: [{ name: 'USER' }],
          plan: { name: 'Free' },
          createdAt: new Date(),
          _count: { accommodations: 1 },
        },
        {
          id: 'u2',
          name: 'B',
          email: 'b@b.co',
          image: null,
          roles: [{ name: 'ADMIN' }],
          plan: null,
          createdAt: new Date(),
          _count: { accommodations: 0 },
        },
      ];
      mockUserFindMany.mockResolvedValue(users);
      mockUserCount.mockResolvedValue(2);

      const result = await getUsers({ limit: 1 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toMatchObject({ id: 'u1', name: 'A' });
      expect(result.nextCursor).toBe('u1');
      expect(result.total).toBe(2);
    });

    it('applies role filter when provided', async (): Promise<void> => {
      mockUserFindMany.mockResolvedValue([]);
      mockUserCount.mockResolvedValue(0);

      await getUsers({ limit: 10, role: 'ADMIN' });

      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roles: { some: { name: 'ADMIN' } } }),
        }),
      );
    });

    it('applies search filter when provided', async (): Promise<void> => {
      mockUserFindMany.mockResolvedValue([]);
      mockUserCount.mockResolvedValue(0);

      await getUsers({ limit: 10, search: 'alice' });

      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'alice', mode: 'insensitive' } },
              { email: { contains: 'alice', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('getUserDetail', (): void => {
    it('returns null when user not found', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await getUserDetail('user-none');

      expect(result).toBeNull();
      expect(mockRoleFindMany).not.toHaveBeenCalled();
      expect(mockPlanFindMany).not.toHaveBeenCalled();
    });

    it('returns user with allRoles and allPlans when found', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'a@b.co',
        image: null,
        roles: [{ id: 'r1', name: 'USER' }],
        plan: { id: 'p1', name: 'Free' },
        createdAt: new Date('2025-01-01'),
        _count: { accommodations: 2 },
      });
      mockRoleFindMany.mockResolvedValue([
        { id: 'r1', name: 'USER' },
        { id: 'r2', name: 'ADMIN' },
      ]);
      mockPlanFindMany.mockResolvedValue([
        { id: 'p1', name: 'Free' },
        { id: 'p2', name: 'Pro' },
      ]);

      const result = await getUserDetail('u1');

      expect(result).not.toBeNull();
      expect(result?.user).toMatchObject({
        id: 'u1',
        name: 'Alice',
        email: 'a@b.co',
        _count: { accommodations: 2 },
      });
      expect(result?.allRoles).toHaveLength(2);
      expect(result?.allPlans).toHaveLength(2);
    });
  });

  describe('updateUserRoles', (): void => {
    it('throws when user not found', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(
        updateUserRoles({
          userId: 'user-none',
          roles: ['USER'],
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('User not found');

      expect(mockUserUpdate).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it('updates roles and creates audit log', async (): Promise<void> => {
      mockUserFindUnique
        .mockResolvedValueOnce({
          roles: [{ name: 'USER' }],
        })
        .mockResolvedValueOnce({
          id: 'u1',
          name: 'Alice',
          email: 'a@b.co',
          image: null,
          roles: [{ name: 'ADMIN' }],
          plan: { name: 'Free' },
          createdAt: new Date(),
          _count: { accommodations: 0 },
        });
      mockUserUpdate.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'a@b.co',
        image: null,
        roles: [{ name: 'ADMIN' }],
        plan: { name: 'Free' },
        createdAt: new Date(),
        _count: { accommodations: 0 },
      });
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await updateUserRoles({
        userId: 'u1',
        roles: ['ADMIN'],
        changedById: 'admin-1',
      });

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: {
            roles: { set: [{ name: 'ADMIN' }] },
          },
        }),
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        actorId: 'admin-1',
        targetId: 'u1',
        entityType: 'User',
        action: 'role.assign',
        oldValue: ['USER'],
        newValue: ['ADMIN'],
      });
      expect(result.roles).toEqual(['ADMIN']);
    });
  });

  describe('updateUserPlan', (): void => {
    it('throws when plan not found', async (): Promise<void> => {
      mockPlanFindUnique.mockResolvedValue(null);

      await expect(
        updateUserPlan({
          userId: 'u1',
          planName: 'NonExistent',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Plan not found');

      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('throws when user not found', async (): Promise<void> => {
      mockPlanFindUnique.mockResolvedValue({ id: 'p1' });
      mockUserFindUnique.mockReset();
      mockUserFindUnique.mockResolvedValue(null);

      await expect(
        updateUserPlan({
          userId: 'user-none',
          planName: 'Pro',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('User not found');

      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('updates plan and creates audit log', async (): Promise<void> => {
      mockPlanFindUnique.mockResolvedValue({ id: 'p2' });
      mockUserFindUnique
        .mockResolvedValueOnce({
          plan: { name: 'Free' },
        })
        .mockResolvedValueOnce({
          id: 'u1',
          name: 'Alice',
          email: 'a@b.co',
          image: null,
          roles: [{ name: 'USER' }],
          plan: { name: 'Pro' },
          createdAt: new Date(),
          _count: { accommodations: 0 },
        });
      mockUserUpdate.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'a@b.co',
        image: null,
        roles: [{ name: 'USER' }],
        plan: { name: 'Pro' },
        createdAt: new Date(),
        _count: { accommodations: 0 },
      });
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await updateUserPlan({
        userId: 'u1',
        planName: 'Pro',
        changedById: 'admin-1',
      });

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { planId: 'p2' },
        }),
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        actorId: 'admin-1',
        targetId: 'u1',
        entityType: 'User',
        action: 'plan.change',
        oldValue: 'Free',
        newValue: 'Pro',
      });
      expect(result.planName).toBe('Pro');
    });
  });

  describe('checkUserExists', (): void => {
    it('returns true when user exists', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue({ id: 'u1' });

      const result = await checkUserExists('u1');

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await checkUserExists('user-none');

      expect(result).toBe(false);
    });
  });
});
