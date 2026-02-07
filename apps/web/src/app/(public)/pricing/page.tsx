import { getServerSession } from 'next-auth';
import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';

import { PricingCards } from './_components/pricingCards';

export const metadata = {
  title: '요금제 - 숙소 모니터링',
  description: '숙소 모니터링 서비스 요금제를 확인하세요.',
};

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  return (
    <>
      {/* 헤더 */}
      <header className='bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              asChild
            >
              <Link href={isLoggedIn ? '/dashboard' : '/'}>
                <ArrowLeft className='size-5' />
              </Link>
            </Button>
            <h1 className='text-xl font-bold'>요금제</h1>
          </div>
          {isLoggedIn ? (
            <div className='flex items-center gap-4'>
              <span className='text-sm text-muted-foreground'>{session.user.name}</span>
              <Button asChild>
                <Link href='/dashboard'>Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                asChild
              >
                <Link href='/login'>로그인</Link>
              </Button>
              <Button asChild>
                <Link href='/signup'>무료로 시작하기</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className='py-16'>
        {/* 타이틀 */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold mb-4'>나에게 맞는 플랜을 선택하세요</h2>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            숙소 가격을 실시간으로 모니터링하고, 원하는 가격에 알림을 받아보세요.
            <br />
            무료로 시작하고 필요에 따라 업그레이드하세요.
          </p>
        </div>

        {/* 플랜 카드 */}
        <PricingCards />

        {/* FAQ 또는 추가 정보 */}
        <div className='max-w-2xl mx-auto mt-16 px-4'>
          <h3 className='text-xl font-semibold text-center mb-6'>자주 묻는 질문</h3>
          <div className='space-y-4'>
            <div className='bg-card rounded-lg p-4 border'>
              <h4 className='font-medium mb-2'>플랜은 언제든 변경할 수 있나요?</h4>
              <p className='text-sm text-muted-foreground'>
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.
              </p>
            </div>
            <div className='bg-card rounded-lg p-4 border'>
              <h4 className='font-medium mb-2'>결제는 어떻게 하나요?</h4>
              <p className='text-sm text-muted-foreground'>
                현재는 이메일로 문의 주시면 안내해 드립니다. 곧 자동 결제 시스템이 도입될 예정입니다.
              </p>
            </div>
            <div className='bg-card rounded-lg p-4 border'>
              <h4 className='font-medium mb-2'>환불 정책은 어떻게 되나요?</h4>
              <p className='text-sm text-muted-foreground'>결제 후 7일 이내에 요청하시면 전액 환불해 드립니다.</p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className='border-t py-8'>
        <div className='max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground'>
          <p>문의: rlgns0610@gmail.com</p>
        </div>
      </footer>
    </>
  );
}
