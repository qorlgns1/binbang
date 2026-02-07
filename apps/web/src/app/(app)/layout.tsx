import type { ReactNode } from 'react';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/app-header';
import { authOptions } from '@/lib/auth';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const isAdmin = session.user.roles?.includes('ADMIN') ?? false;

  return (
    <div className='min-h-screen bg-muted/40'>
      <AppHeader
        userName={session.user.name ?? null}
        userImage={session.user.image ?? null}
        isAdmin={isAdmin}
      />
      {children}
    </div>
  );
}
