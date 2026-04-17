// NOTE: PrismaAdapter has been removed. NextAuth adapter needs manual implementation
// for TypeORM. The createNextAuthAdapter function below provides partial compatibility.

import type { Adapter } from 'next-auth/adapters';

import { Account, Plan, Role, Session, User, VerificationToken, getDataSource } from '@workspace/db';

// ============================================================================
// NextAuth Adapter / Callback 용 서비스 함수
// ============================================================================

export interface AdapterUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string | null;
  image: string | null;
  roles: { name: string }[];
  plan: { name: string } | null;
}

export interface AdapterSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

function toAdapterEmail(email: string | null): string {
  return email ?? '';
}

function requireAdapterUser(user: User | null, context: string): User {
  if (!user) {
    throw new Error(`[travel-auth] user not found during ${context}`);
  }

  return user;
}

export function createNextAuthAdapter(): Adapter {
  return {
    async createUser(data: Record<string, unknown>) {
      return createAdapterUser(data);
    },

    async getUser(id: string) {
      return getUserWithRolesAndPlan(id);
    },

    async getUserByEmail(email: string) {
      const ds = await getDataSource();
      const user = await ds.getRepository(User).findOne({
        where: { email },
        relations: { roles: true, plan: true },
      });
      if (!user) return null;
      return buildAdapterUser(user);
    },

    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const ds = await getDataSource();
      const account = await ds.getRepository(Account).findOne({
        where: { provider, providerAccountId },
        relations: { user: { roles: true, plan: true } },
      });
      if (!account?.user) return null;
      return buildAdapterUser(account.user);
    },

    async updateUser(data: Record<string, unknown>) {
      const ds = await getDataSource();
      const { id, ...updateData } = data as { id: string } & Record<string, unknown>;
      await ds.getRepository(User).update({ id }, updateData as Partial<User>);
      const user = await ds.getRepository(User).findOne({
        where: { id },
        relations: { roles: true, plan: true },
      });
      return buildAdapterUser(requireAdapterUser(user, 'updateUser'));
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
      const session = await ds.getRepository(Session).findOne({ where: { sessionToken } });
      if (!session) return null;
      return { id: session.id, sessionToken: session.sessionToken, userId: session.userId, expires: session.expires };
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

export async function createAdapterUser(data: Record<string, unknown>) {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);

  const freePlan = await ds.getRepository(Plan).findOne({ where: { name: 'FREE' } });
  const userRole = await ds.getRepository(Role).findOne({ where: { name: 'USER' } });

  const user = userRepo.create({
    name: (data.name as string | null | undefined) ?? null,
    email: data.email as string,
    emailVerified: (data.emailVerified as Date | null | undefined) ?? null,
    image: (data.image as string | null | undefined) ?? null,
    plan: freePlan ?? undefined,
    roles: userRole ? [userRole] : [],
  });

  await userRepo.save(user);

  return {
    id: user.id,
    email: toAdapterEmail(user.email),
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
    roles: user.roles?.map((r) => ({ name: r.name })) ?? [],
    plan: user.plan ? { name: user.plan.name } : null,
  };
}

function buildAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: toAdapterEmail(user.email),
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
    roles: user.roles?.map((r) => ({ name: r.name })) ?? [],
    plan: user.plan ? { name: user.plan.name } : null,
  };
}

export async function getUserWithRolesAndPlan(id: string): Promise<AdapterUser | null> {
  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      image: true,
    },
    relations: { roles: true, plan: true },
  });
  if (!user) return null;
  return buildAdapterUser(user);
}

export async function getSessionAndUserByToken(
  sessionToken: string,
): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
  const ds = await getDataSource();
  const result = await ds.getRepository(Session).findOne({
    where: { sessionToken },
    select: {
      id: true,
      sessionToken: true,
      userId: true,
      expires: true,
    },
    relations: { user: { roles: true, plan: true } },
  });
  if (!result) return null;

  const { user, ...session } = result;
  return {
    session: {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    },
    user: {
      id: user.id,
      email: toAdapterEmail(user.email),
      emailVerified: user.emailVerified,
      name: user.name,
      image: user.image,
      roles: user.roles?.map((r) => ({ name: r.name })) ?? [],
      plan: user.plan ? { name: user.plan.name } : null,
    },
  };
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
  await ds.getRepository(User).update(
    { id: userId },
    {
      kakaoAccessToken: tokens.accessToken,
      kakaoRefreshToken: tokens.refreshToken ?? null,
      kakaoTokenExpiry: tokens.expiresAt ? new Date(tokens.expiresAt * 1000) : null,
    },
  );
}
