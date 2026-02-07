import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { DashboardContent } from './dashboardContent';
import { KakaoAlertBanner } from './kakao-alert-banner';

export const metadata = {
  title: '대시보드',
  description: '빈방어때 대시보드 - 등록된 숙소 모니터링 현황을 확인하세요',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage(): Promise<React.ReactElement> {
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
    <main className='mx-auto max-w-7xl px-4 py-8'>
      {!hasKakaoToken && <KakaoAlertBanner />}
      <DashboardContent />
    </main>
  );
}
