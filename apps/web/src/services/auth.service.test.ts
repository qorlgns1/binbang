import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkEmailExists, createUserWithCredentials, verifyCredentials } from './auth.service';

const { mockUserCreate, mockUserFindUnique, mockBcryptHash, mockBcryptCompare } = vi.hoisted(
  (): {
    mockUserCreate: ReturnType<typeof vi.fn>;
    mockUserFindUnique: ReturnType<typeof vi.fn>;
    mockBcryptHash: ReturnType<typeof vi.fn>;
    mockBcryptCompare: ReturnType<typeof vi.fn>;
  } => ({
    mockUserCreate: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockBcryptHash: vi.fn(),
    mockBcryptCompare: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    user: {
      create: mockUserCreate,
      findUnique: mockUserFindUnique,
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: (...args: unknown[]) => (mockBcryptHash as (...a: unknown[]) => unknown)(...args),
    compare: (...args: unknown[]) => (mockBcryptCompare as (...a: unknown[]) => unknown)(...args),
  },
}));

describe('auth.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('createUserWithCredentials', (): void => {
    it('hashes password and creates user', async (): Promise<void> => {
      mockBcryptHash.mockResolvedValue('hashed');
      mockUserCreate.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
      });

      const result = await createUserWithCredentials({
        email: 'a@b.co',
        password: 'secret',
        name: 'Alice',
      });

      expect(mockBcryptHash).toHaveBeenCalledWith('secret', 12);
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            email: 'a@b.co',
            password: 'hashed',
            name: 'Alice',
            emailVerified: expect.any(Date),
          },
        }),
      );
      expect(result).toEqual({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
      });
    });
  });

  describe('verifyCredentials', (): void => {
    it('returns user when password matches', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue({
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

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.co' },
        select: expect.any(Object),
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith('secret', 'hashed');
      expect(result).toEqual({
        id: 'user-1',
        email: 'a@b.co',
        name: 'Alice',
      });
    });

    it('returns null when user not found', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await verifyCredentials({
        email: 'none@b.co',
        password: 'secret',
      });

      expect(result).toBeNull();
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('returns null when user has no password', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue({
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
      mockUserFindUnique.mockResolvedValue({
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
      mockUserFindUnique.mockResolvedValue({ id: 'user-1' });

      const result = await checkEmailExists('a@b.co');

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.co' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async (): Promise<void> => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await checkEmailExists('none@b.co');

      expect(result).toBe(false);
    });
  });
});
