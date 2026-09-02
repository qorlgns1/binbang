import { createHmac } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { issueEmailOtp, verifyEmailOtp } from './email-otp.service';

const TEST_SECRET = 'test-email-otp-secret';
const EMAIL = 'Tester@Example.com';
const NORMALIZED_EMAIL = 'tester@example.com';

function expectedTokenHash(code: string): string {
  return createHmac('sha256', TEST_SECRET).update(`${NORMALIZED_EMAIL}:${code}`).digest('base64url');
}

interface RepoMock {
  find: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    tokenRepo: RepoMock;
    userRepo: RepoMock;
    planRepo: RepoMock;
    roleRepo: RepoMock;
    sessionRepo: RepoMock;
    getDataSource: ReturnType<typeof vi.fn>;
  } => {
    const emptyRepo = (): RepoMock => ({
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    });

    return {
      dataSource: null,
      tokenRepo: emptyRepo(),
      userRepo: emptyRepo(),
      planRepo: emptyRepo(),
      roleRepo: emptyRepo(),
      sessionRepo: emptyRepo(),
      getDataSource: vi.fn(),
    };
  },
);

const redisMock = vi.hoisted(() => ({
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  getRedisClient: vi.fn(),
  ensureRedisConnected: vi.fn(),
}));

const emailMock = vi.hoisted(() => ({ sendAgodaAlertEmail: vi.fn() }));

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const tokenRepo = createMockRepository();
  const userRepo = createMockRepository();
  const planRepo = createMockRepository();
  const roleRepo = createMockRepository();
  const sessionRepo = createMockRepository();

  const dataSource = createMockDataSource({
    repositories: [
      [actual.VerificationToken, tokenRepo],
      [actual.User, userRepo],
      [actual.Plan, planRepo],
      [actual.Role, roleRepo],
      [actual.Session, sessionRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  Object.assign(dbMock, { tokenRepo, userRepo, planRepo, roleRepo, sessionRepo });
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return { ...actual, getDataSource: dbMock.getDataSource };
});

vi.mock('@/lib/redis', () => ({
  getRedisClient: (...args: unknown[]) => redisMock.getRedisClient(...args),
  ensureRedisConnected: (...args: unknown[]) => redisMock.ensureRedisConnected(...args),
}));

vi.mock('@/services/agoda-email.service', () => ({
  sendAgodaAlertEmail: (...args: unknown[]) => emailMock.sendAgodaAlertEmail(...args),
}));

vi.mock('@/lib/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

describe('email-otp.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
    delete process.env.BINBANG_UNSUBSCRIBE_SECRET;

    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
    emailMock.sendAgodaAlertEmail.mockResolvedValue({ provider: 'console', messageId: 'm1' });

    redisMock.getRedisClient.mockReturnValue(redisMock);
    redisMock.ensureRedisConnected.mockResolvedValue(true);
    redisMock.incr.mockResolvedValue(1);
    redisMock.expire.mockResolvedValue(1);
    redisMock.ttl.mockResolvedValue(3600);
    redisMock.del.mockResolvedValue(1);
    // 토큰 소비는 이제 delete 결과(affected)를 확인한다.
    dbMock.tokenRepo.delete.mockResolvedValue({ affected: 1 });
  });

  describe('issueEmailOtp', (): void => {
    it('평문 코드를 저장하지 않고 해시로 저장한다', async (): Promise<void> => {
      const result = await issueEmailOtp({ email: EMAIL });

      expect(result).toEqual({ status: 'sent' });

      const saved = dbMock.tokenRepo.create.mock.calls[0][0] as {
        identifier: string;
        token: string;
        expires: Date;
      };

      // 메일로 나간 코드를 회수해서 저장값과 대조한다.
      const sentText = emailMock.sendAgodaAlertEmail.mock.calls[0][0].text as string;
      const code = /(\d{6})/.exec(sentText)?.[1] as string;

      expect(code).toMatch(/^\d{6}$/);
      expect(saved.token).not.toContain(code);
      expect(saved.token).toBe(expectedTokenHash(code));
      expect(saved.identifier).toBe(`email-otp:${NORMALIZED_EMAIL}`);
      expect(saved.expires.getTime()).toBeGreaterThan(Date.now());
    });

    it('이전 코드를 지우고 새로 발급한다', async (): Promise<void> => {
      await issueEmailOtp({ email: EMAIL });

      expect(dbMock.tokenRepo.delete).toHaveBeenCalledWith({ identifier: `email-otp:${NORMALIZED_EMAIL}` });
      expect(dbMock.tokenRepo.save).toHaveBeenCalledTimes(1);
    });

    it('이메일 발송 한도를 넘으면 rate_limited를 돌려주고 메일을 보내지 않는다', async (): Promise<void> => {
      redisMock.incr.mockResolvedValue(6); // SEND_LIMIT_PER_EMAIL_PER_HOUR = 5
      redisMock.ttl.mockResolvedValue(1200);

      const result = await issueEmailOtp({ email: EMAIL });

      expect(result).toEqual({ status: 'rate_limited', retryAfterSeconds: 1200 });
      expect(emailMock.sendAgodaAlertEmail).not.toHaveBeenCalled();
      expect(dbMock.tokenRepo.save).not.toHaveBeenCalled();
    });

    it('Redis가 없어도 코드 발급은 계속된다', async (): Promise<void> => {
      redisMock.getRedisClient.mockReturnValue(null);

      const result = await issueEmailOtp({ email: EMAIL });

      expect(result).toEqual({ status: 'sent' });
      expect(emailMock.sendAgodaAlertEmail).toHaveBeenCalledTimes(1);
    });

    it('locale에 따라 제목을 분기한다', async (): Promise<void> => {
      await issueEmailOtp({ email: EMAIL, locale: 'en' });
      expect(emailMock.sendAgodaAlertEmail.mock.calls[0][0].subject).toContain('Binbang');

      vi.clearAllMocks();
      emailMock.sendAgodaAlertEmail.mockResolvedValue({ provider: 'console', messageId: 'm1' });
      redisMock.getRedisClient.mockReturnValue(redisMock);
      redisMock.ensureRedisConnected.mockResolvedValue(true);
      redisMock.incr.mockResolvedValue(1);

      await issueEmailOtp({ email: EMAIL, locale: 'ko' });
      expect(emailMock.sendAgodaAlertEmail.mock.calls[0][0].subject).toContain('빈방');
    });
  });

  describe('verifyEmailOtp', (): void => {
    const CODE = '123456';

    function storeValidToken(): void {
      dbMock.tokenRepo.findOne.mockResolvedValue({
        identifier: `email-otp:${NORMALIZED_EMAIL}`,
        token: expectedTokenHash(CODE),
        expires: new Date(Date.now() + 60_000),
      });
    }

    it('저장된 코드가 없으면 invalid', async (): Promise<void> => {
      dbMock.tokenRepo.findOne.mockResolvedValue(null);

      await expect(verifyEmailOtp({ email: EMAIL, code: CODE })).resolves.toEqual({ status: 'invalid' });
    });

    it('만료된 코드는 expired로 처리하고 삭제한다', async (): Promise<void> => {
      dbMock.tokenRepo.findOne.mockResolvedValue({
        identifier: `email-otp:${NORMALIZED_EMAIL}`,
        token: expectedTokenHash(CODE),
        expires: new Date(Date.now() - 1_000),
      });

      await expect(verifyEmailOtp({ email: EMAIL, code: CODE })).resolves.toEqual({ status: 'expired' });
      expect(dbMock.tokenRepo.delete).toHaveBeenCalledWith({ identifier: `email-otp:${NORMALIZED_EMAIL}` });
    });

    it('코드가 다르면 invalid이고 토큰을 소비하지 않는다', async (): Promise<void> => {
      storeValidToken();

      await expect(verifyEmailOtp({ email: EMAIL, code: '999999' })).resolves.toEqual({ status: 'invalid' });
      expect(dbMock.tokenRepo.delete).not.toHaveBeenCalled();
    });

    it('시도 횟수를 초과하면 토큰을 폐기한다', async (): Promise<void> => {
      redisMock.incr.mockResolvedValue(6); // MAX_VERIFY_ATTEMPTS = 5

      await expect(verifyEmailOtp({ email: EMAIL, code: CODE })).resolves.toEqual({ status: 'too_many_attempts' });
      expect(dbMock.tokenRepo.delete).toHaveBeenCalledWith({ identifier: `email-otp:${NORMALIZED_EMAIL}` });
      expect(dbMock.tokenRepo.findOne).not.toHaveBeenCalled();
    });

    it('계정이 없으면 생성하고 세션을 발급한다', async (): Promise<void> => {
      storeValidToken();
      dbMock.userRepo.findOne.mockResolvedValue(null);
      dbMock.planRepo.findOne.mockResolvedValue({ id: 'plan-free' });
      dbMock.roleRepo.findOne.mockResolvedValue({ id: 'role-user', name: 'USER' });
      dbMock.userRepo.create.mockImplementation((data: Record<string, unknown>) => ({ id: 'user-new', ...data }));

      const result = await verifyEmailOtp({ email: EMAIL, code: CODE });

      expect(result).toMatchObject({ status: 'verified', userId: 'user-new', isNewUser: true });

      const createdUser = dbMock.userRepo.create.mock.calls[0][0] as Record<string, unknown>;
      expect(createdUser.email).toBe(NORMALIZED_EMAIL);
      expect(createdUser.emailVerified).toBeInstanceOf(Date);
      expect(createdUser.planId).toBe('plan-free');

      // 코드는 1회용이다. identifier + token 으로 원자적으로 소비한다.
      expect(dbMock.tokenRepo.delete).toHaveBeenCalledWith({
        identifier: `email-otp:${NORMALIZED_EMAIL}`,
        token: expectedTokenHash(CODE),
      });
      expect(dbMock.sessionRepo.create).toHaveBeenCalledTimes(1);
    });

    it('계정이 있으면 재사용하고 새로 만들지 않는다', async (): Promise<void> => {
      storeValidToken();
      dbMock.userRepo.findOne.mockResolvedValue({ id: 'user-existing', emailVerified: new Date() });

      const result = await verifyEmailOtp({ email: EMAIL, code: CODE });

      expect(result).toMatchObject({ status: 'verified', userId: 'user-existing', isNewUser: false });
      expect(dbMock.userRepo.create).not.toHaveBeenCalled();
      expect(dbMock.userRepo.update).not.toHaveBeenCalled();
    });

    it('토큰을 identifier+token 으로 원자적으로 소비한다', async (): Promise<void> => {
      storeValidToken();
      dbMock.userRepo.findOne.mockResolvedValue({ id: 'user-1', emailVerified: new Date() });

      await verifyEmailOtp({ email: EMAIL, code: CODE });

      expect(dbMock.tokenRepo.delete).toHaveBeenCalledWith({
        identifier: `email-otp:${NORMALIZED_EMAIL}`,
        token: expectedTokenHash(CODE),
      });
    });

    it('동시 요청에서 진 쪽은 세션을 받지 못한다', async (): Promise<void> => {
      storeValidToken();
      // 다른 요청이 먼저 소비해 삭제된 행이 없다.
      dbMock.tokenRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(verifyEmailOtp({ email: EMAIL, code: CODE })).resolves.toEqual({ status: 'invalid' });
      expect(dbMock.sessionRepo.create).not.toHaveBeenCalled();
      expect(dbMock.userRepo.create).not.toHaveBeenCalled();
    });

    it('미검증 계정은 검증 시각을 채운다', async (): Promise<void> => {
      storeValidToken();
      dbMock.userRepo.findOne.mockResolvedValue({ id: 'user-unverified', emailVerified: null });

      await verifyEmailOtp({ email: EMAIL, code: CODE });

      expect(dbMock.userRepo.update).toHaveBeenCalledWith(
        { id: 'user-unverified' },
        expect.objectContaining({ emailVerified: expect.any(Date) }),
      );
    });
  });
});
