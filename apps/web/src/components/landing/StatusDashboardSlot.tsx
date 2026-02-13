'use client';

import dynamic from 'next/dynamic';

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

/**
 * Renders the StatusDashboard (localization via next-intl inside StatusDashboard).
 */
export function StatusDashboardSlot(): React.ReactElement {
  return <StatusDashboard />;
}
