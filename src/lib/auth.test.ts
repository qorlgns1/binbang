import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * auth.ts 의 핵심 동작 테스트
 *
 * 주요 검증 포인트:
 * 1. getSessionAndUser가 roles와 plan을 포함하여 반환하는지
 * 2. session callback이 roles와 planName을 세션에 추가하는지
 */

// Mock Prisma
const mockPrismaUser = {
  id: 'user-1',
  name: '테스트 유저',
  email: 'test@example.com',
  emailVerified: new Date(),
  image: null,
  roles: [{ name: 'USER' }, { name: 'ADMIN' }],
  plan: { name: 'PRO' },
};

const mockPrismaSession = {
  id: 'session-1',
  sessionToken: 'test-token',
  userId: 'user-1',
  expires: new Date(Date.now() + 86400000),
  user: mockPrismaUser,
};

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({
    createUser: vi.fn(),
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByAccount: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    linkAccount: vi.fn(),
    unlinkAccount: vi.fn(),
    createSession: vi.fn(),
    getSessionAndUser: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    createVerificationToken: vi.fn(),
    useVerificationToken: vi.fn(),
  })),
}));

describe('auth adapter overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionAndUser', () => {
    it('세션 조회 시 roles와 plan이 포함되어야 함', async () => {
      const prisma = await import('@/lib/prisma');
      vi.mocked(prisma.default.session.findUnique).mockResolvedValue(mockPrismaSession as never);

      // authOptions를 동적으로 import하여 adapter 테스트
      const { authOptions } = await import('@/lib/auth');

      const result = await authOptions.adapter?.getSessionAndUser?.('test-token');

      expect(result).not.toBeNull();
      expect(result?.user).toHaveProperty('roles');
      expect(result?.user).toHaveProperty('plan');
      expect(result?.user.roles).toEqual([{ name: 'USER' }, { name: 'ADMIN' }]);
      expect(result?.user.plan).toEqual({ name: 'PRO' });
    });

    it('세션이 없으면 null 반환', async () => {
      const prisma = await import('@/lib/prisma');
      vi.mocked(prisma.default.session.findUnique).mockResolvedValue(null);

      const { authOptions } = await import('@/lib/auth');
      const result = await authOptions.adapter?.getSessionAndUser?.('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('유저 조회 시 roles와 plan이 포함되어야 함', async () => {
      const prisma = await import('@/lib/prisma');
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue(mockPrismaUser as never);

      const { authOptions } = await import('@/lib/auth');
      const result = await authOptions.adapter?.getUser?.('user-1');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('plan');
    });
  });
});

describe('session callback', () => {
  it('session.user에 roles 배열과 planName이 추가되어야 함', async () => {
    const { authOptions } = await import('@/lib/auth');

    const mockSession = {
      user: { id: '', name: 'Test', email: 'test@example.com', image: null, roles: [] as string[], planName: null },
      expires: new Date().toISOString(),
    };

    const mockUser = {
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      emailVerified: new Date(),
      image: null,
      roles: [{ name: 'USER' }, { name: 'ADMIN' }],
      plan: { name: 'PRO' },
    };

    // session callback 실행
    const result = await authOptions.callbacks?.session?.({
      session: mockSession,
      user: mockUser as never,
      token: {} as never,
      trigger: 'update',
      newSession: undefined,
    });

    expect(result?.user).toHaveProperty('id', 'user-1');
    expect(result?.user).toHaveProperty('roles');
    expect((result?.user as { roles: string[] }).roles).toEqual(['USER', 'ADMIN']);
    expect(result?.user).toHaveProperty('planName', 'PRO');
  });

  it('roles가 없는 유저는 빈 배열로 처리', async () => {
    const { authOptions } = await import('@/lib/auth');

    const mockSession = {
      user: { id: '', name: 'Test', email: 'test@example.com', image: null, roles: [] as string[], planName: null },
      expires: new Date().toISOString(),
    };

    const mockUser = {
      id: 'user-2',
      name: 'Test',
      email: 'test@example.com',
      emailVerified: new Date(),
      image: null,
      roles: undefined, // roles 없음
      plan: null,
    };

    const result = await authOptions.callbacks?.session?.({
      session: mockSession,
      user: mockUser as never,
      token: {} as never,
      trigger: 'update',
      newSession: undefined,
    });

    expect((result?.user as { roles: string[] }).roles).toEqual([]);
    expect((result?.user as { planName: string | null }).planName).toBeNull();
  });
});

describe('RBAC integration', () => {
  it('ADMIN 역할이 있는 유저는 isAdmin 체크 통과', async () => {
    const { isAdmin } = await import('@/lib/rbac');

    expect(isAdmin(['USER', 'ADMIN'])).toBe(true);
    expect(isAdmin(['ADMIN'])).toBe(true);
  });

  it('ADMIN 역할이 없는 유저는 isAdmin 체크 실패', async () => {
    const { isAdmin } = await import('@/lib/rbac');

    expect(isAdmin(['USER'])).toBe(false);
    expect(isAdmin([])).toBe(false);
  });
});
