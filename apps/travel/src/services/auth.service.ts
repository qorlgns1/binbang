import { PrismaAdapter } from '@next-auth/prisma-adapter';

import { prisma } from '@workspace/db';

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

export function createNextAuthAdapter() {
  const baseAdapter = PrismaAdapter(prisma);
  return {
    ...baseAdapter,
    createUser: async (data: Record<string, unknown>) => {
      const user = await prisma.user.create({
        data: {
          ...(data as { name?: string; email: string; emailVerified?: Date | null; image?: string }),
          plan: { connect: { name: 'FREE' } },
          roles: { connect: [{ name: 'USER' }] },
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          roles: { select: { name: true } },
          plan: { select: { name: true } },
        },
      });
      return user as typeof user & { email: string };
    },
    getUser: getUserWithRolesAndPlan,
    getSessionAndUser: getSessionAndUserByToken,
  };
}

export async function getUserWithRolesAndPlan(id: string): Promise<AdapterUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      image: true,
      roles: { select: { name: true } },
      plan: { select: { name: true } },
    },
  });
  if (!user) return null;
  return user as typeof user & { email: string };
}

export async function getSessionAndUserByToken(
  sessionToken: string,
): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
  const result = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      id: true,
      sessionToken: true,
      userId: true,
      expires: true,
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          roles: { select: { name: true } },
          plan: { select: { name: true } },
        },
      },
    },
  });
  if (!result) return null;
  const { user, ...session } = result;
  return {
    session,
    user: user as typeof user & { email: string },
  };
}

export async function findAccountUserId(provider: string, providerAccountId: string): Promise<string | null> {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
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
  await prisma.user.update({
    where: { id: userId },
    data: {
      kakaoAccessToken: tokens.accessToken,
      kakaoRefreshToken: tokens.refreshToken,
      kakaoTokenExpiry: tokens.expiresAt ? new Date(tokens.expiresAt * 1000) : null,
    },
    select: { id: true },
  });
}
