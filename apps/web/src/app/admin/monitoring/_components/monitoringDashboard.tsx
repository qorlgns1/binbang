'use client';

import { Separator } from '@/components/ui/separator';

import { LogsTimeline } from './logsTimeline';
import { SummaryCards } from './summaryCards';

export function MonitoringDashboard() {
  return (
    <div className='space-y-6'>
      <SummaryCards />
      <Separator />
      <LogsTimeline />
    </div>
  );
}
