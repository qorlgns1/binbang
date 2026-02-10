import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import { prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface CredentialsLoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function createUserWithCredentials(input: SignupInput): Promise<AuthUser> {
  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      emailVerified: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name,
  };
}

export async function verifyCredentials(input: CredentialsLoginInput): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name,
  };
}

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

// ============================================================================
// 기타 서비스 함수
// ============================================================================

export async function checkEmailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user !== null;
}

export interface CreateSessionResult {
  sessionToken: string;
  expires: Date;
}

export async function createSessionForUser(userId: string): Promise<CreateSessionResult> {
  const { randomUUID } = await import('node:crypto');
  const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30일

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
    select: { id: true },
  });

  return { sessionToken, expires };
}
