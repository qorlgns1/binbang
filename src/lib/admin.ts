import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export async function requireAdmin(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== 'ADMIN') return null;
  return session;
}
