export default function Loading() {
  return (
    <div className='flex h-screen flex-col'>
      <header className='flex items-center justify-between border-b border-border bg-background/80 px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-8 rounded-lg bg-muted animate-pulse' />
          <div className='h-5 w-24 rounded bg-muted animate-pulse' />
        </div>
      </header>
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex flex-1 flex-col border-r border-border md:max-w-2xl'>
          <div className='flex-1 space-y-4 p-4'>
            <div className='h-16 w-3/4 rounded-lg bg-muted animate-pulse' />
            <div className='h-12 w-1/2 rounded-lg bg-muted animate-pulse' />
            <div className='h-12 w-2/3 rounded-lg bg-muted animate-pulse' />
          </div>
          <div className='border-t border-border p-4'>
            <div className='h-10 w-full rounded-lg bg-muted animate-pulse' />
          </div>
        </div>
        <div className='hidden flex-1 md:block'>
          <div className='h-full w-full bg-muted animate-pulse' />
        </div>
      </div>
    </div>
  );
}
