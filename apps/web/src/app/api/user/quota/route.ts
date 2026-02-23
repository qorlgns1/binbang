import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getUserQuota } from '@/services/user.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const quota = await getUserQuota(session.user.id);

    if (!quota) {
      return notFoundResponse('User not found');
    }

    return NextResponse.json(quota);
  } catch (error) {
    return handleServiceError(error, 'User quota fetch error');
  }
}
