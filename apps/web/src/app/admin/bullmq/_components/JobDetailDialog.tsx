'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJobDetail } from '../_hooks/useJobDetail';

interface JobDetailDialogProps {
  queueName: string;
  jobId: string | null;
  onClose: () => void;
  onMutated?: () => void;
}

function formatTs(ts: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', { hour12: false });
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function JobDetailDialog({ queueName, jobId, onClose, onMutated }: JobDetailDialogProps) {
  const { job, loading, error, actionLoading, retry, remove } = useJobDetail(queueName, jobId, onMutated);

  async function handleRetry() {
    await retry();
    onClose();
  }

  async function handleRemove() {
    await remove();
    onClose();
  }

  return (
    <Dialog
      open={jobId !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='font-mono text-sm'>Job Detail {jobId ? `— ${jobId}` : ''}</DialogTitle>
        </DialogHeader>

        {loading && <p className='text-sm text-muted-foreground'>로딩 중...</p>}
        {error && <p className='text-sm text-destructive'>{error}</p>}

        {job && (
          <ScrollArea className='max-h-[70vh]'>
            <div className='space-y-4 pr-4'>
              <div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-4'>
                <div className='rounded-md border p-2'>
                  <p className='text-xs text-muted-foreground'>State</p>
                  <Badge variant={job.state === 'failed' ? 'destructive' : 'secondary'}>{job.state}</Badge>
                </div>
                <div className='rounded-md border p-2'>
                  <p className='text-xs text-muted-foreground'>Attempts</p>
                  <p className='font-mono'>{job.attemptsMade}</p>
                </div>
                <div className='rounded-md border p-2'>
                  <p className='text-xs text-muted-foreground'>Created</p>
                  <p className='text-xs'>{formatTs(job.timestamp)}</p>
                </div>
                <div className='rounded-md border p-2'>
                  <p className='text-xs text-muted-foreground'>Finished</p>
                  <p className='text-xs'>{formatTs(job.finishedOn)}</p>
                </div>
              </div>

              {job.failedReason && (
                <div>
                  <p className='mb-1 text-xs font-medium text-destructive'>Failed Reason</p>
                  <pre className='overflow-x-auto rounded bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                    {job.failedReason}
                  </pre>
                </div>
              )}

              {job.stacktrace && (
                <div>
                  <p className='mb-1 text-xs font-medium text-muted-foreground'>Stacktrace</p>
                  <pre className='overflow-x-auto rounded bg-muted px-3 py-2 text-xs leading-relaxed'>
                    {job.stacktrace}
                  </pre>
                </div>
              )}

              <div>
                <p className='mb-1 text-xs font-medium text-muted-foreground'>Job Data</p>
                <pre className='overflow-x-auto rounded bg-muted px-3 py-2 text-xs leading-relaxed'>
                  {prettyJson(job.data)}
                </pre>
              </div>

              {job.returnValue && (
                <div>
                  <p className='mb-1 text-xs font-medium text-muted-foreground'>Return Value</p>
                  <pre className='overflow-x-auto rounded bg-muted px-3 py-2 text-xs leading-relaxed'>
                    {prettyJson(job.returnValue)}
                  </pre>
                </div>
              )}

              <div>
                <p className='mb-1 text-xs font-medium text-muted-foreground'>Job Options</p>
                <pre className='overflow-x-auto rounded bg-muted px-3 py-2 text-xs leading-relaxed'>
                  {prettyJson(job.opts)}
                </pre>
              </div>

              <div className='flex gap-2'>
                {job.state === 'failed' && (
                  <Button
                    size='sm'
                    disabled={actionLoading}
                    onClick={() => {
                      void handleRetry();
                    }}
                  >
                    재시도
                  </Button>
                )}
                <Button
                  size='sm'
                  variant='destructive'
                  disabled={actionLoading}
                  onClick={() => {
                    void handleRemove();
                  }}
                >
                  삭제
                </Button>
                <Button size='sm' variant='outline' onClick={onClose}>
                  닫기
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
