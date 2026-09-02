import type { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters';

import { Account, Plan, Role, Session, User, VerificationToken, getDataSource } from '@workspace/db';

/**
 * 이메일을 소문자로 정규화한다.
 *
 * Oracle varchar2 비교는 대소문자를 구분하므로, 저장과 조회에서 형태가 갈리면
 * 같은 사람에게 계정이 두 개 생긴다. 소셜 로그인 제공자가 대문자가 섞인 주소를
 * 주더라도 여기서 한 형태로 맞춘다.
 */
function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

// ============================================================================
// NextAuth Adapter / Callback 용 서비스 함수
// ============================================================================

export interface ExtendedAdapterUser extends AdapterUser {
  roles: { name: string }[];
  plan: { name: string } | null;
}

export interface ExtendedAdapterSession extends AdapterSession {
  id: string;
}

type AppDataSource = Awaited<ReturnType<typeof getDataSource>>;

function requireExtendedAdapterUser(user: ExtendedAdapterUser | null, context: string): ExtendedAdapterUser {
  if (!user) {
    throw new Error(`[web-auth] user not found during ${context}`);
  }

  return user;
}

async function getExtendedAdapterUserById(ds: AppDataSource, id: string): Promise<ExtendedAdapterUser | null> {
  const user = await ds.getRepository(User).findOne({
    where: { id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      image: true,
      planId: true,
    },
  });

  if (!user) {
    return null;
  }

  const roleRows = (await ds.query(
    `SELECT r."name" AS "name"
       FROM "Role" r
       INNER JOIN "UserRole" ur ON ur."roleId" = r."id"
      WHERE ur."userId" = :1
      ORDER BY r."name" ASC`,
    [id],
  )) as Array<{ name?: string | null }>;

  const plan = user.planId
    ? await ds.getRepository(Plan).findOne({
        where: { id: user.planId },
        select: { name: true },
      })
    : null;

  return {
    id: user.id,
    email: user.email ?? '',
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
    roles: roleRows.flatMap((row) => (row.name ? [{ name: row.name }] : [])),
    plan: plan ? { name: plan.name } : null,
  };
}

async function getSessionByToken(ds: AppDataSource, sessionToken: string): Promise<ExtendedAdapterSession | null> {
  const session = await ds.getRepository(Session).findOne({
    where: { sessionToken },
    select: { id: true, sessionToken: true, userId: true, expires: true },
  });

  if (!session) return null;

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: session.expires,
  };
}

export function createNextAuthAdapter(): Adapter {
  return {
    async createUser(data: Record<string, unknown>) {
      const ds = await getDataSource();
      const freePlan = await ds.getRepository(Plan).findOne({ where: { name: 'FREE' } });
      const userRole = await ds.getRepository(Role).findOne({ where: { name: 'USER' } });

      const repo = ds.getRepository(User);
      const user = repo.create({
        email: normalizeEmail(data.email as string | null),
        emailVerified: (data.emailVerified as Date | null) ?? null,
        name: (data.name as string | null) ?? null,
        image: (data.image as string | null) ?? null,
        planId: freePlan?.id ?? null,
        roles: userRole ? [userRole] : [],
      });
      await repo.save(user);

      return {
        id: user.id,
        email: user.email ?? '',
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
        roles: userRole ? [{ name: userRole.name }] : [],
        plan: freePlan ? { name: freePlan.name } : null,
      } as ExtendedAdapterUser;
    },

    async getUser(id: string) {
      return getUserWithRolesAndPlan(id);
    },

    async getUserByEmail(email: string) {
      const ds = await getDataSource();
      const user = await ds.getRepository(User).findOne({
        where: { email: normalizeEmail(email) ?? email },
        select: { id: true },
      });
      if (!user) return null;
      return getExtendedAdapterUserById(ds, user.id);
    },

    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const ds = await getDataSource();
      const account = await ds.getRepository(Account).findOne({
        where: { provider, providerAccountId },
        select: { userId: true },
      });
      if (!account) return null;
      return getExtendedAdapterUserById(ds, account.userId);
    },

    async updateUser(data: Record<string, unknown>) {
      const ds = await getDataSource();
      const { id, ...updateData } = data as { id: string } & Record<string, unknown>;
      // 제공자가 대문자가 섞인 주소를 보내도 저장 형태는 한 가지로 유지한다.
      if ('email' in updateData) {
        updateData.email = normalizeEmail(updateData.email as string | null);
      }
      await ds.getRepository(User).update({ id }, updateData as Partial<User>);
      const user = await getExtendedAdapterUserById(ds, id);
      return requireExtendedAdapterUser(user, 'updateUser');
    },

    async deleteUser(userId: string) {
      const ds = await getDataSource();
      await ds.getRepository(User).delete({ id: userId });
    },

    async linkAccount(data: Record<string, unknown>) {
      const ds = await getDataSource();
      const repo = ds.getRepository(Account);
      const account = repo.create(data as Partial<Account>);
      await repo.save(account);
      return account as unknown as ReturnType<NonNullable<Adapter['linkAccount']>> extends Promise<infer T> ? T : never;
    },

    async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const ds = await getDataSource();
      await ds.getRepository(Account).delete({ provider, providerAccountId });
    },

    async createSession(data: { sessionToken: string; userId: string; expires: Date }) {
      const ds = await getDataSource();
      const repo = ds.getRepository(Session);
      const session = repo.create(data);
      await repo.save(session);
      return { id: session.id, ...data };
    },

    async getSessionAndUser(sessionToken: string) {
      return getSessionAndUserByToken(sessionToken);
    },

    async updateSession(data: { sessionToken: string } & Partial<AdapterSession>) {
      const ds = await getDataSource();
      const { sessionToken, ...updateData } = data;
      await ds.getRepository(Session).update({ sessionToken }, updateData as Partial<Session>);
      return getSessionByToken(ds, sessionToken);
    },

    async deleteSession(sessionToken: string) {
      const ds = await getDataSource();
      await ds.getRepository(Session).delete({ sessionToken });
    },

    async createVerificationToken(data: { identifier: string; expires: Date; token: string }) {
      const ds = await getDataSource();
      const repo = ds.getRepository(VerificationToken);
      const vt = repo.create(data);
      await repo.save(vt);
      return vt;
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const ds = await getDataSource();
      const repo = ds.getRepository(VerificationToken);
      const vt = await repo.findOne({ where: { identifier, token } });
      if (!vt) return null;
      await repo.delete({ identifier, token });
      return vt;
    },
  };
}

export async function getUserWithRolesAndPlan(id: string): Promise<ExtendedAdapterUser | null> {
  const ds = await getDataSource();
  return getExtendedAdapterUserById(ds, id);
}

export async function getSessionAndUserByToken(
  sessionToken: string,
): Promise<{ session: ExtendedAdapterSession; user: ExtendedAdapterUser } | null> {
  const doQuery = async () => {
    const ds = await getDataSource();
    const session = await getSessionByToken(ds, sessionToken);
    if (!session) return null;
    const user = await getExtendedAdapterUserById(ds, session.userId);
    if (!user) return null;
    return {
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      },
      user,
    };
  };

  try {
    return await doQuery();
  } catch (error: unknown) {
    // oracledb thin mode 간헐적 버그 (ERR_BUFFER_OUT_OF_BOUNDS) 발생 시 1회 재시도
    if ((error as { code?: string }).code === 'ERR_BUFFER_OUT_OF_BOUNDS') {
      return doQuery();
    }
    throw error;
  }
}

export async function findAccountUserId(provider: string, providerAccountId: string): Promise<string | null> {
  const ds = await getDataSource();
  const account = await ds.getRepository(Account).findOne({
    where: { provider, providerAccountId },
    select: { userId: true },
  });
  return account?.userId ?? null;
}

export async function saveKakaoTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: number | null;
  },
): Promise<void> {
  const ds = await getDataSource();
  const updateData: {
    kakaoAccessToken: string;
    kakaoRefreshToken?: string | null;
    kakaoTokenExpiry: Date | null;
  } = {
    kakaoAccessToken: tokens.accessToken,
    kakaoTokenExpiry: tokens.expiresAt ? new Date(tokens.expiresAt * 1000) : null,
  };

  if (tokens.refreshToken !== undefined) {
    updateData.kakaoRefreshToken = tokens.refreshToken;
  }

  await ds.getRepository(User).update({ id: userId }, updateData);
}
