'use client';

import { Separator } from '@/components/ui/separator';

import { LogsTimeline } from './LogsTimeline';
import { SummaryCards } from './SummaryCards';

export function MonitoringDashboard() {
  return (
    <div className='space-y-6'>
      <SummaryCards />
      <Separator />
      <LogsTimeline />
    </div>
  );
}
