import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { DashboardContent } from './dashboardContent';
import { KakaoAlertBanner } from './kakao-alert-banner';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // 카카오 토큰 확인 (알림 배너용)
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { kakaoAccessToken: true },
      })
    : null;

  const hasKakaoToken = !!user?.kakaoAccessToken;

  return (
    <main className='max-w-7xl mx-auto px-4 py-8'>
      {!hasKakaoToken && <KakaoAlertBanner />}
      <DashboardContent />
    </main>
  );
}
