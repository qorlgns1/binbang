import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionAndUserByToken, saveKakaoTokens } from './auth.service';

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
    sessionRepo: {
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
    sessionRepo: {
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
  const sessionRepo = createMockRepository();
  const dataSource = createMockDataSource({
    repositories: [
      [actual.Account, accountRepo],
      [actual.Session, sessionRepo],
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
  dbMock.sessionRepo = sessionRepo;
  dbMock.dataSourceQuery = dataSource.query;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('auth.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    dbMock.dataSourceQuery.mockResolvedValue([]);
    dbMock.sessionRepo.findOne.mockResolvedValue(null);
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
      dbMock.sessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        sessionToken: 'token-1',
        userId: 'user-1',
        expires,
      });
      dbMock.dataSourceQuery.mockResolvedValueOnce([{ name: 'ADMIN' }, { name: 'USER' }]);
      dbMock.planRepo.findOne.mockResolvedValue({ name: 'FREE' });

      const result = await getSessionAndUserByToken('token-1');

      expect(dbMock.sessionRepo.findOne).toHaveBeenCalledWith({
        where: { sessionToken: 'token-1' },
        select: { id: true, sessionToken: true, userId: true, expires: true },
      });
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
      expect(dbMock.dataSourceQuery).toHaveBeenCalledWith(expect.stringContaining('FROM "Role"'), ['user-1']);
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
