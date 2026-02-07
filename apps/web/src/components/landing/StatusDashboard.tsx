import { Activity, Wifi } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import type { LandingCopy } from './landing-data';
import { MOCK_LOGS, MOCK_SYSTEM_STATUS } from './landing-data';

interface StatusDashboardProps {
  copy: LandingCopy;
}

export function StatusDashboard({ copy }: StatusDashboardProps): React.ReactElement {

  return (
    <section
      id='status'
      className='mx-auto w-full max-w-5xl'
    >
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm'>
          <Activity className='size-4 animate-pulse' />
          {copy.trust.title}
        </h3>
        <Badge className='border border-primary/35 bg-primary/10 text-primary'>
          <span className='mr-2 size-2 rounded-full bg-chart-3 animate-pulse' />
          {copy.trust.operational}
        </Badge>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='border-border bg-card/60 p-5 text-foreground'>
          <p className='text-xs uppercase tracking-wider text-muted-foreground'>{copy.trust.uptime}</p>
          <p className='mt-1 text-2xl font-semibold'>{MOCK_SYSTEM_STATUS.uptime}</p>

          <p className='mt-5 text-xs uppercase tracking-wider text-muted-foreground'>{copy.trust.activeMonitors}</p>
          <p className='mt-1 text-2xl font-semibold text-primary'>
            {MOCK_SYSTEM_STATUS.activeMonitors.toLocaleString()}
          </p>

          <div className='mt-5 flex items-center gap-2 text-xs text-chart-3'>
            <Wifi className='size-3.5' />
            {copy.trust.response}: {MOCK_SYSTEM_STATUS.avgResponseTime}
          </div>
        </Card>

        <Card className='relative overflow-hidden border-border bg-secondary p-4 font-mono text-xs md:col-span-2'>
          <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent' />
          <div className='space-y-3'>
            {MOCK_LOGS.map((log, i) => (
              <div
                key={log.id}
                className={`flex gap-3 ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <span className='min-w-14 opacity-70'>{log.time}</span>
                <span>
                  <span className='mr-2 text-primary/70'>[{log.location}]</span>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
