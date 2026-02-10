'use client';

import dynamic from 'next/dynamic';

import type { LandingCopy, Lang } from '@/lib/i18n/landing';

const StatusDashboard = dynamic(() => import('./StatusDashboard').then((mod) => mod.StatusDashboard), {
  ssr: false,
  loading: () => (
    <section id='status' className='mx-auto w-full max-w-5xl'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='h-5 w-32 animate-pulse rounded bg-muted' />
        <div className='h-6 w-24 animate-pulse rounded-full bg-muted' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='h-32 animate-pulse rounded-xl bg-card/60' />
        <div className='h-32 animate-pulse rounded-xl bg-card/60 sm:col-span-2 lg:col-span-2' />
      </div>
    </section>
  ),
});

interface StatusDashboardSlotProps {
  copy: LandingCopy;
  lang: Lang;
}

/**
 * Render the StatusDashboard component with the provided localization props.
 *
 * @param copy - Localized copy content for the dashboard
 * @param lang - Language selector used to choose localization
 * @returns The StatusDashboard React element
 */
export function StatusDashboardSlot({ copy, lang }: StatusDashboardSlotProps): React.ReactElement {
  return <StatusDashboard copy={copy} lang={lang} />;
}
