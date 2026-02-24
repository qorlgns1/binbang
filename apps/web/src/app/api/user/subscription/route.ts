import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getUserSubscription } from '@/services/user.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const result = await getUserSubscription(session.user.id);

    if (!result) {
      return notFoundResponse('User not found');
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'User subscription fetch error');
  }
}
