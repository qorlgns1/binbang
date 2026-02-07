import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing/LandingPage';
import { authOptions } from '@/lib/auth';

export default async function Home(): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  // 로그인된 경우 대시보드로 리다이렉트
  if (session?.user) redirect('/dashboard');

  return <LandingPage />;
}
