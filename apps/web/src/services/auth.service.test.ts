import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkEmailExists,
  createUserWithCredentials,
  getSessionAndUserByToken,
  saveKakaoTokens,
  verifyCredentials,
} from './auth.service';

const { mockBcryptHash, mockBcryptCompare } = vi.hoisted(
  (): {
    mockBcryptHash: ReturnType<typeof vi.fn>;
    mockBcryptCompare: ReturnType<typeof vi.fn>;
  } => ({
    mockBcryptHash: vi.fn(),
    mockBcryptCompare: vi.fn(),
  }),
);

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    userRepo: {
      create: ReturnType<typeof vi.fn>;
      findOne: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    planRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    roleRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    accountRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    dataSourceQuery: ReturnType<typeof vi.fn>;
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    userRepo: {
      create: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    },
    planRepo: {
      findOne: vi.fn(),
    },
    roleRepo: {
      findOne: vi.fn(),
    },
    accountRepo: {
      findOne: vi.fn(),
    },
    dataSourceQuery: vi.fn(),
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const userRepo = createMockRepository();
  userRepo.save.mockImplementation(async (entity: Record<string, unknown>) => entity);

  const planRepo = createMockRepository();
  const roleRepo = createMockRepository();
  const accountRepo = createMockRepository();
  const dataSource = createMockDataSource({
    repositories: [
      [actual.Account, accountRepo],
      [actual.User, userRepo],
      [actual.Plan, planRepo],
      [actual.Role, roleRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  dbMock.userRepo = userRepo;
  dbMock.planRepo = planRepo;
  dbMock.roleRepo = roleRepo;
  dbMock.accountRepo = accountRepo;
  dbMock.dataSourceQuery = dataSource.query;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: (...args: unknown[]) => (mockBcryptHash as (...a: unknown[]) => unknown)(...args),
    compare: (...args: unknown[]) => (mockBcryptCompare as (...a: unknown[]) => unknown)(...args),
  },
}));

describe('auth.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.dataSourceQuery.mockResolvedValue([]);
  });

  describe('createUserWithCredentials', (): void => {
    it('hashes password and creates user', async (): Promise<void> => {
      mockBcryptHash.mockResolvedValue('hashed');
      dbMock.planRepo.findOne.mockResolvedValue({ id: 'plan-free', name: 'FREE' });
      dbMock.roleRepo.findOne.mockResolvedValue({ id: 'role-user', name: 'USER' });
      dbMock.userRepo.create.mockImplementation((data: Record<string, unknown>) => ({
        id: 'user-1',
        ...data,
      }));

      const result = await createUserWithCredentials({
        email: 'a@b.co',
        password: 'secret',
        name: 'Alice',
      });

      expect(mockBcryptHash).toHaveBeenCalledWith('secret', 12);
      expect(dbMock.userRepo.create).toHaveBeenCalledWith({
        email: 'a@b.co',
        password: 'hashed',
        name: 'Alice',
        emailVerified: expect.any(Date),
        planId: 'plan-free',
        roles: [{ id: 'role-user', name: 'USER' }],
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
      });
    });
  });

  describe('verifyCredentials', (): void => {
    it('returns user when password matches', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
        password: 'hashed',
      });
      mockBcryptCompare.mockResolvedValue(true);

      const result = await verifyCredentials({
        email: 'a@b.co',
        password: 'secret',
      });

      expect(dbMock.userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.co' },
        select: { id: true, email: true, name: true, password: true },
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith('secret', 'hashed');
      expect(result).toEqual({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
      });
    });

    it('returns null when user not found', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue(null);

      const result = await verifyCredentials({
        email: 'none@b.co',
        password: 'secret',
      });

      expect(result).toBeNull();
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null when user has no password', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
        password: null,
      });

      const result = await verifyCredentials({
        email: 'a@b.co',
        password: 'secret',
      });

      expect(result).toBeNull();
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null when password does not match', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
        password: 'hashed',
      });
      mockBcryptCompare.mockResolvedValue(false);

      const result = await verifyCredentials({
        email: 'a@b.co',
        password: 'wrong',
      });

      expect(result).toBeNull();
    });
  });

  describe('checkEmailExists', (): void => {
    it('returns true when user exists', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({ id: 'user-1' });

      const result = await checkEmailExists('a@b.co');

      expect(dbMock.userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.co' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue(null);

      const result = await checkEmailExists('none@b.co');

      expect(result).toBe(false);
    });
  });

  describe('saveKakaoTokens', (): void => {
    it('does not clear an existing refresh token when Kakao omits it', async (): Promise<void> => {
      await saveKakaoTokens('user-1', {
        accessToken: 'access-token',
        expiresAt: 1_735_689_600,
      });

      expect(dbMock.userRepo.update).toHaveBeenCalledTimes(1);
      expect(dbMock.userRepo.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        expect.objectContaining({
          kakaoAccessToken: 'access-token',
          kakaoTokenExpiry: new Date(1_735_689_600 * 1000),
        }),
      );

      const updateData = dbMock.userRepo.update.mock.calls[0][1] as Record<string, unknown>;
      expect(updateData).not.toHaveProperty('kakaoRefreshToken');
    });
  });

  describe('getSessionAndUserByToken', (): void => {
    it('loads session and user data without relation joins', async (): Promise<void> => {
      const expires = new Date('2026-04-30T00:00:00.000Z');
      dbMock.userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.co',
        emailVerified: null,
        name: 'Alice',
        image: null,
        planId: 'plan-free',
      });
      dbMock.dataSourceQuery
        .mockResolvedValueOnce([
          {
            id: 'session-1',
            sessionToken: 'token-1',
            userId: 'user-1',
            expires: expires.toISOString(),
          },
        ])
        .mockResolvedValueOnce([{ name: 'ADMIN' }, { name: 'USER' }]);
      dbMock.planRepo.findOne.mockResolvedValue({ name: 'FREE' });

      const result = await getSessionAndUserByToken('token-1');

      expect(dbMock.dataSourceQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM "Session"'), ['token-1']);
      expect(dbMock.userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          planId: true,
        },
      });
      expect(dbMock.dataSourceQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM "Role"'), ['user-1']);
      expect(dbMock.planRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-free' },
        select: { name: true },
      });
      expect(result).toEqual({
        session: {
          id: 'session-1',
          sessionToken: 'token-1',
          userId: 'user-1',
          expires,
        },
        user: {
          id: 'user-1',
          email: 'a@b.co',
          emailVerified: null,
          name: 'Alice',
          image: null,
          roles: [{ name: 'ADMIN' }, { name: 'USER' }],
          plan: { name: 'FREE' },
        },
      });
    });
  });
});
