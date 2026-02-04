import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { DashboardContent } from './dashboardContent';
import { KakaoAlertBanner } from './kakao-alert-banner';
import { LogoutButton } from './logout-button';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      kakaoAccessToken: true,
    },
  });

  const hasKakaoToken = !!user?.kakaoAccessToken;

  return (
    <div className='min-h-screen bg-muted/40'>
      {/* 헤더 */}
      <header className='bg-background/80 backdrop-blur-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-xl font-bold'>🏨 숙소 모니터링</h1>
          <div className='flex items-center gap-4'>
            {session.user.role === 'ADMIN' && (
              <Link
                href='/admin/monitoring'
                className='px-3 py-1.5 text-sm rounded-md transition-colors bg-primary text-primary-foreground'
              >
                Admin
              </Link>
            )}
            <span className='text-muted-foreground'>{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 py-8'>
        {!hasKakaoToken && <KakaoAlertBanner />}
        <DashboardContent />
      </main>
    </div>
  );
}
