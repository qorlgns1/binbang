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

export default async function PricingPage(): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      {/* Ambient Background */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>

      {/* Content */}
      <div className='relative z-10'>
        {/* 헤더 */}
        <header className='border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40'>
          <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
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
              <Link
                href='/'
                className='flex items-center gap-2'
              >
                <span className='flex size-8 items-center justify-center rounded-full bg-primary'>
                  <span className='size-2 rounded-full bg-primary-foreground animate-ping' />
                </span>
                <span className='text-sm font-semibold tracking-wide text-foreground md:text-base'>빈방어때</span>
              </Link>
            </div>
            {isLoggedIn ? (
              <div className='flex items-center gap-4'>
                <span className='text-sm text-muted-foreground'>{session.user.name}</span>
                <Button
                  asChild
                  className='bg-primary text-primary-foreground hover:bg-primary/90'
                >
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
                <Button
                  asChild
                  className='bg-primary text-primary-foreground hover:bg-primary/90'
                >
                  <Link href='/signup'>무료로 시작하기</Link>
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className='py-16'>
          {/* 타이틀 */}
          <div className='mb-16 text-center'>
            <h2 className='mb-4 text-3xl font-semibold text-foreground md:text-4xl'>
              나에게 맞는 플랜을 선택하세요
            </h2>
            <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              복잡함은 저희가 처리할게요.
              <br />
              당신은 이제 마음 편히, 설레는 여행만 준비하세요.
            </p>
          </div>

          {/* 플랜 카드 */}
          <PricingCards />

          {/* FAQ 또는 추가 정보 */}
          <div className='mx-auto mt-20 max-w-2xl px-4'>
            <h3 className='mb-8 text-center text-2xl font-semibold text-foreground'>자주 묻는 질문</h3>
            <div className='space-y-4'>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>플랜은 언제든 변경할 수 있나요?</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  네, 언제든 편하게 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.
                </p>
              </div>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>결제는 어떻게 하나요?</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  현재는 이메일로 문의 주시면 안내해 드립니다. 곧 자동 결제 시스템이 도입될 예정입니다.
                </p>
              </div>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>환불 정책은 어떻게 되나요?</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  결제 후 7일 이내에 요청하시면 전액 환불해 드립니다.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* 푸터 */}
        <footer className='border-t border-border/50 bg-background/80 py-8 backdrop-blur'>
          <div className='mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground'>
            <p>문의: rlgns0610@gmail.com</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
