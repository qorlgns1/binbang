import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

export async function requireAdmin(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!isAdmin(session.user.roles)) return null;
  return session;
}
