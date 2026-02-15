import { AuditLogTimeline } from './_components/AuditLogTimeline';

export default function AuditLogsPage() {
  return (
    <main className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>감사 로그</h1>
      </div>
      <AuditLogTimeline />
    </main>
  );
}
