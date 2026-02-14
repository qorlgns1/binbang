import type { ReactNode } from 'react';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';

import { AdminSidebar } from './_components/AdminSidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.roles?.includes('ADMIN')) {
    redirect('/dashboard');
  }

  return (
    <div className='relative min-h-screen overflow-x-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>
      {/* 문서 스크롤 한 곳: 사이드바만 sticky, 본문은 흐름대로 */}
      <div className='relative z-10 flex min-h-screen flex-col md:flex-row'>
        <AdminSidebar userName={session.user.name ?? null} />
        <main className='min-w-0 flex-1'>{children}</main>
      </div>
    </div>
  );
}
