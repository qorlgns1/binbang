import type { ReactNode } from 'react';

import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen bg-muted/40'>
      <header className='bg-background/80 backdrop-blur-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-xl font-bold'>Admin Monitoring</h1>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-muted-foreground'>{session.user.name}</span>
            <Link
              href='/dashboard'
              className='text-sm text-primary hover:underline'
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
