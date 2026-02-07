import { NextResponse } from 'next/server';

import { getHealthStatus } from '@/services/health.service';

export async function GET(): Promise<Response> {
  const isDev = process.env.NODE_ENV === 'development';

  const health = await getHealthStatus(isDev);

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
