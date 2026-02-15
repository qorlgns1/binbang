import { NextResponse } from 'next/server';

import { getPublicPlans } from '@/services/plansService';

export async function GET(): Promise<Response> {
  try {
    const plans = await getPublicPlans();

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
