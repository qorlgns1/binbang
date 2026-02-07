import { AuditLogTimeline } from './_components/auditLogTimeline';

export default function AuditLogsPage() {
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>감사 로그</h1>
      <AuditLogTimeline />
    </div>
  );
}
