import bcrypt from 'bcryptjs';

import type { User } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';

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

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

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
  });

  return { sessionToken, expires };
}
