import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkUserExists, getUserDetail, getUsers, updateUserPlan, updateUserRoles } from './users.service';

const { mockCreateAuditLog } = vi.hoisted(() => ({
  mockCreateAuditLog: vi.fn(),
}));

type AdminUserListRow = {
  id: string;
  _count?: {
    accommodations?: number;
  };
} & Record<string, unknown>;

const callMock = <TReturn>(fn: unknown, ...args: unknown[]): TReturn =>
  (fn as (...args: unknown[]) => TReturn)(...args);

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    userRepo: {
      createQueryBuilder: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    userListQb: {
      andWhere: ReturnType<typeof vi.fn>;
      getMany: ReturnType<typeof vi.fn>;
      setParameter: ReturnType<typeof vi.fn>;
    };
    userCountQb: {
      andWhere: ReturnType<typeof vi.fn>;
      getCount: ReturnType<typeof vi.fn>;
      setParameter: ReturnType<typeof vi.fn>;
    };
    roleSelectQb: {
      getMany: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
    };
    accommodationCountQb: {
      getRawMany: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
    };
    accommodationRepo: {
      count: ReturnType<typeof vi.fn>;
      createQueryBuilder: ReturnType<typeof vi.fn>;
    };
    roleRepo: {
      createQueryBuilder: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
    };
    planRepo: {
      find: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
    userFindMany: ReturnType<typeof vi.fn>;
    userFindUnique: ReturnType<typeof vi.fn>;
    userCount: ReturnType<typeof vi.fn>;
    userUpdate: ReturnType<typeof vi.fn>;
    roleFindMany: ReturnType<typeof vi.fn>;
    planFindMany: ReturnType<typeof vi.fn>;
    planFindUnique: ReturnType<typeof vi.fn>;
    lastUserRows: AdminUserListRow[];
  } => ({
    dataSource: null,
    userRepo: {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    },
    userListQb: {
      andWhere: vi.fn(),
      getMany: vi.fn(),
      setParameter: vi.fn(),
    },
    userCountQb: {
      andWhere: vi.fn(),
      getCount: vi.fn(),
      setParameter: vi.fn(),
    },
    roleSelectQb: {
      getMany: vi.fn(),
      where: vi.fn(),
    },
    accommodationCountQb: {
      getRawMany: vi.fn(),
      where: vi.fn(),
    },
    accommodationRepo: {
      count: vi.fn(),
      createQueryBuilder: vi.fn(),
    },
    roleRepo: {
      createQueryBuilder: vi.fn(),
      find: vi.fn(),
    },
    planRepo: {
      find: vi.fn(),
      findOne: vi.fn(),
    },
    getDataSource: vi.fn(),
    userFindMany: vi.fn(),
    userFindUnique: vi.fn(),
    userCount: vi.fn(),
    userUpdate: vi.fn(),
    roleFindMany: vi.fn(),
    planFindMany: vi.fn(),
    planFindUnique: vi.fn(),
    lastUserRows: [],
  }),
);

vi.mock('@/services/admin/audit-logs.service', () => ({
  createAuditLog: mockCreateAuditLog,
}));

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockQueryBuilder, createMockRepository } = await import(
    '../../../../../test-utils/mock-db.ts'
  );

  const buildLegacyWhere = (qb: {
    andWhere: ReturnType<typeof vi.fn>;
    setParameter: ReturnType<typeof vi.fn>;
  }): Record<string, unknown> => {
    const where: Record<string, unknown> = {};
    const roleName = qb.setParameter.mock.calls.find((call) => call[0] === 'roleName')?.[1];
    const searchParams = qb.andWhere.mock.calls.find((call) => {
      const params = call[1];
      return typeof params === 'object' && params !== null && 'search' in params;
    })?.[1];
    const searchParam =
      typeof searchParams === 'object' && searchParams !== null && 'search' in searchParams
        ? searchParams.search
        : undefined;

    if (roleName) {
      where.roles = { some: { name: roleName } };
    }
    if (searchParam) {
      const normalized = String(searchParam).replace(/^%|%$/g, '').toLowerCase();
      where.OR = [
        { name: { contains: normalized, mode: 'insensitive' } },
        { email: { contains: normalized, mode: 'insensitive' } },
      ];
    }
    return where;
  };

  const userListQb = createMockQueryBuilder();
  userListQb.getMany.mockImplementation(async () => {
    const rows = await callMock<AdminUserListRow[]>(dbMock.userFindMany, { where: buildLegacyWhere(userListQb) });
    dbMock.lastUserRows = rows;
    return rows;
  });

  const userCountQb = createMockQueryBuilder();
  userCountQb.getCount.mockImplementation(() => callMock(dbMock.userCount, { where: buildLegacyWhere(userCountQb) }));

  const roleSelectQb = createMockQueryBuilder();
  roleSelectQb.getMany.mockImplementation(() => {
    const names = roleSelectQb.where.mock.calls.at(-1)?.[1]?.names ?? [];
    return names.map((name: string) => ({ id: `role-${name.toLowerCase()}`, name }));
  });

  const accommodationCountQb = createMockQueryBuilder();
  accommodationCountQb.getRawMany.mockImplementation(() => {
    const userIds = accommodationCountQb.where.mock.calls.at(-1)?.[1]?.userIds ?? [];
    return userIds.map((userId: string) => {
      const match = dbMock.lastUserRows.find((row) => row.id === userId);
      const count = Number((match?._count as { accommodations?: number } | undefined)?.accommodations ?? 0);
      return { userId, cnt: String(count) };
    });
  });

  const userRepo = createMockRepository();
  userRepo.findOne.mockImplementation((...args) => callMock(dbMock.userFindUnique, ...args));
  userRepo.update.mockImplementation((where, data) => callMock(dbMock.userUpdate, { where, data }));
  userRepo.save.mockImplementation(async (entity: Record<string, unknown>) => {
    await callMock(dbMock.userUpdate, {
      where: { id: entity.id },
      data: {
        roles: { set: ((entity.roles as Array<{ name: string }> | undefined) ?? []).map((r) => ({ name: r.name })) },
      },
    });
    return entity;
  });
  userRepo.createQueryBuilder.mockImplementation((alias: string) => {
    if (alias === 'u' && userRepo.createQueryBuilder.mock.calls.length === 1) return userListQb;
    return userCountQb;
  });

  const accommodationRepo = createMockRepository();
  accommodationRepo.count.mockImplementation(({ where }: { where: { userId: string } }) => {
    const row = dbMock.lastUserRows.find((user) => user.id === where.userId);
    return Number((row?._count as { accommodations?: number } | undefined)?.accommodations ?? 0);
  });
  accommodationRepo.createQueryBuilder.mockImplementation(() => accommodationCountQb);

  const roleRepo = createMockRepository();
  roleRepo.find.mockImplementation((...args) => callMock(dbMock.roleFindMany, ...args));
  roleRepo.createQueryBuilder.mockImplementation(() => roleSelectQb);

  const planRepo = createMockRepository();
  planRepo.find.mockImplementation((...args) => callMock(dbMock.planFindMany, ...args));
  planRepo.findOne.mockImplementation((...args) => callMock(dbMock.planFindUnique, ...args));

  const dataSource = createMockDataSource({
    repositories: [
      [actual.User, userRepo],
      [actual.Accommodation, accommodationRepo],
      [actual.Role, roleRepo],
      [actual.Plan, planRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  dbMock.userRepo = userRepo;
  dbMock.userListQb = userListQb;
  dbMock.userCountQb = userCountQb;
  dbMock.roleSelectQb = roleSelectQb;
  dbMock.accommodationCountQb = accommodationCountQb;
  dbMock.accommodationRepo = accommodationRepo;
  dbMock.roleRepo = roleRepo;
  dbMock.planRepo = planRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('admin/users.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.lastUserRows = [];
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
      dbMock.userFindMany.mockResolvedValue(users);
      dbMock.userCount.mockResolvedValue(2);

      const result = await getUsers({ limit: 1 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toMatchObject({ id: 'u1', name: 'A' });
      expect(result.nextCursor).toBe('u1');
      expect(result.total).toBe(2);
    });

    it('applies role filter when provided', async (): Promise<void> => {
      dbMock.userFindMany.mockResolvedValue([]);
      dbMock.userCount.mockResolvedValue(0);

      await getUsers({ limit: 10, role: 'ADMIN' });

      expect(dbMock.userFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roles: { some: { name: 'ADMIN' } } }),
        }),
      );
    });

    it('applies search filter when provided', async (): Promise<void> => {
      dbMock.userFindMany.mockResolvedValue([]);
      dbMock.userCount.mockResolvedValue(0);

      await getUsers({ limit: 10, search: 'alice' });

      expect(dbMock.userFindMany).toHaveBeenCalledWith(
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
      dbMock.userFindUnique.mockResolvedValue(null);

      const result = await getUserDetail('user-none');

      expect(result).toBeNull();
      expect(dbMock.roleFindMany).not.toHaveBeenCalled();
      expect(dbMock.planFindMany).not.toHaveBeenCalled();
    });

    it('returns user with allRoles and allPlans when found', async (): Promise<void> => {
      dbMock.userFindUnique.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'a@b.co',
        image: null,
        roles: [{ id: 'r1', name: 'USER' }],
        plan: { id: 'p1', name: 'Free' },
        createdAt: new Date('2025-01-01'),
        _count: { accommodations: 2 },
      });
      dbMock.lastUserRows = [
        {
          id: 'u1',
          _count: { accommodations: 2 },
        },
      ];
      dbMock.roleFindMany.mockResolvedValue([
        { id: 'r1', name: 'USER' },
        { id: 'r2', name: 'ADMIN' },
      ]);
      dbMock.planFindMany.mockResolvedValue([
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
      dbMock.userFindUnique.mockResolvedValue(null);

      await expect(
        updateUserRoles({
          userId: 'user-none',
          roles: ['USER'],
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('User not found');

      expect(dbMock.userUpdate).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it('updates roles and creates audit log', async (): Promise<void> => {
      dbMock.userFindUnique
        .mockResolvedValueOnce({
          id: 'u1',
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
      dbMock.lastUserRows = [{ id: 'u1', _count: { accommodations: 0 } }];
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await updateUserRoles({
        userId: 'u1',
        roles: ['ADMIN'],
        changedById: 'admin-1',
      });

      expect(dbMock.userUpdate).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          roles: { set: [{ name: 'ADMIN' }] },
        },
      });
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
      dbMock.planFindUnique.mockResolvedValue(null);

      await expect(
        updateUserPlan({
          userId: 'u1',
          planName: 'NonExistent',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('Plan not found');

      expect(dbMock.userFindUnique).not.toHaveBeenCalled();
      expect(dbMock.userUpdate).not.toHaveBeenCalled();
    });

    it('throws when user not found', async (): Promise<void> => {
      dbMock.planFindUnique.mockResolvedValue({ id: 'p1' });
      dbMock.userFindUnique.mockResolvedValue(null);

      await expect(
        updateUserPlan({
          userId: 'user-none',
          planName: 'Pro',
          changedById: 'admin-1',
        }),
      ).rejects.toThrow('User not found');

      expect(dbMock.userUpdate).not.toHaveBeenCalled();
    });

    it('updates plan and creates audit log', async (): Promise<void> => {
      dbMock.planFindUnique.mockResolvedValue({ id: 'p2' });
      dbMock.userFindUnique
        .mockResolvedValueOnce({
          id: 'u1',
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
      dbMock.lastUserRows = [{ id: 'u1', _count: { accommodations: 0 } }];
      mockCreateAuditLog.mockResolvedValue(undefined);

      const result = await updateUserPlan({
        userId: 'u1',
        planName: 'Pro',
        changedById: 'admin-1',
      });

      expect(dbMock.userUpdate).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { planId: 'p2' },
      });
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
      dbMock.userFindUnique.mockResolvedValue({ id: 'u1' });

      const result = await checkUserExists('u1');

      expect(dbMock.userFindUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async (): Promise<void> => {
      dbMock.userFindUnique.mockResolvedValue(null);

      const result = await checkUserExists('user-none');

      expect(result).toBe(false);
    });
  });
});
