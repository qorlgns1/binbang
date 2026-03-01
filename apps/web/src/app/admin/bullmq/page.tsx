import { getAllQueuesStats } from '@/services/admin/bullmq.service';

import { BullMQDashboard } from './_components/BullMqDashboard';

export default async function BullMQPage() {
  const queues = await getAllQueuesStats();

  return (
    <main className='mx-auto max-w-7xl px-4 py-8'>
      <BullMQDashboard initialQueues={queues} />
    </main>
  );
}
