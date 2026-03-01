import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { listSchedulers } from '@/services/admin/bullmq.service';
import { TRIGGERABLE_SCHEDULER_IDS } from '@/services/admin/bullmq-trigger.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    // DIP: 라우트가 triggerableIds를 주입해 서비스 간 직접 의존 제거
    const schedulers = await listSchedulers(TRIGGERABLE_SCHEDULER_IDS);
    return NextResponse.json({ schedulers });
  } catch (error) {
    return handleServiceError(error, 'BullMQ schedulers 오류');
  }
}
