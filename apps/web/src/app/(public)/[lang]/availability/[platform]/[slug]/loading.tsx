import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAvailabilityPage(): React.ReactElement {
  return (
    <main className='mx-auto max-w-6xl px-4 py-12 md:py-16'>
      <section className='grid gap-6 rounded-2xl border border-border/70 bg-card/80 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8'>
        <div className='space-y-4'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-10 w-full max-w-2xl' />
          <Skeleton className='h-5 w-full max-w-3xl' />
          <Skeleton className='h-5 w-64' />
          <Skeleton className='h-10 w-40' />
        </div>
        <div className='space-y-3 rounded-xl border border-border/70 p-4'>
          <Skeleton className='h-4 w-24' />
          <div className='grid grid-cols-2 gap-3'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
        </div>
      </section>

      <section className='mt-8 grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-36 w-full' />
        <Skeleton className='h-36 w-full' />
      </section>

      <section className='mt-10 grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-40 w-full' />
        <Skeleton className='h-40 w-full' />
      </section>

      <section className='mt-12'>
        <Skeleton className='h-40 w-full' />
      </section>
    </main>
  );
}
