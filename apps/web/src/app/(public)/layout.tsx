import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>
      <div className='relative z-10 flex min-h-screen flex-col'>{children}</div>
    </div>
  );
}
