import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Home, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export async function generateMetadata(): Promise<{ title: string; description: string }> {
  const t = await getTranslations('common');
  return {
    title: t('notFound.title'),
    description: t('notFound.description'),
  };
}

export default async function NotFound(): Promise<React.ReactElement> {
  const t = await getTranslations('common');

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
          <h2 className='mb-4 text-2xl font-semibold text-foreground md:text-3xl'>{t('notFound.heading')}</h2>
          <p className='mb-8 max-w-md text-lg text-muted-foreground'>{t('notFound.subline')}</p>

          {/* CTA Buttons */}
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
            <Button asChild size='lg' className='bg-primary text-primary-foreground hover:bg-primary/90'>
              <Link href='/dashboard'>
                <Home className='mr-2 size-5' />
                {t('notFound.ctaDashboard')}
              </Link>
            </Button>
            <Button asChild size='lg' variant='outline' className='border-border bg-card/60 hover:bg-accent'>
              <Link href='/'>
                <Search className='mr-2 size-5' />
                {t('notFound.ctaHome')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
