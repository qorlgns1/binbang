import { NextResponse } from 'next/server';

import { handleServiceError } from '@/lib/handleServiceError';
import { getPublicPlans } from '@/services/plans.service';

export async function GET(): Promise<Response> {
  try {
    const plans = await getPublicPlans();

    return NextResponse.json(plans);
  } catch (error) {
    return handleServiceError(error, 'Plans fetch error');
  }
}
