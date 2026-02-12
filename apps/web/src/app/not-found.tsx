import Link from 'next/link';

import { Home, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지를 찾을 수 없습니다. 대시보드 또는 홈으로 이동하세요.',
};

export default function NotFound(): React.ReactElement {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      {/* Ambient Background */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>

      {/* Content */}
      <div className='relative z-10 flex min-h-screen flex-col items-center justify-center px-4'>
        <div className='text-center'>
          {/* Lighthouse Icon (dimmed) */}
          <div className='mb-8 flex justify-center'>
            <div className='flex size-24 items-center justify-center rounded-full bg-muted/50'>
              <span className='size-6 rounded-full bg-muted-foreground/30' />
            </div>
          </div>

          {/* Error Message */}
          <h1 className='mb-4 text-6xl font-bold text-foreground'>404</h1>
          <h2 className='mb-4 text-2xl font-semibold text-foreground md:text-3xl'>길을 잃으셨나요?</h2>
          <p className='mb-8 max-w-md text-lg text-muted-foreground'>
            빈방이 안내해드릴게요.
            <br />
            아래에서 원하시는 곳으로 이동하실 수 있습니다.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
            <Button asChild size='lg' className='bg-primary text-primary-foreground hover:bg-primary/90'>
              <Link href='/dashboard'>
                <Home className='mr-2 size-5' />
                대시보드로 돌아가기
              </Link>
            </Button>
            <Button asChild size='lg' variant='outline' className='border-border bg-card/60 hover:bg-accent'>
              <Link href='/'>
                <Search className='mr-2 size-5' />
                홈으로 가기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
