import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import {
  badRequestResponse,
  handleServiceError,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { completeTutorial, dismissTutorial, getTutorialStatus } from '@/services/user.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const status = await getTutorialStatus(session.user.id);

    if (!status) {
      return notFoundResponse('User not found');
    }

    return NextResponse.json(status);
  } catch (error) {
    return handleServiceError(error, 'Tutorial status fetch error');
  }
}

const tutorialActionSchema = z.object({
  action: z.enum(['complete', 'dismiss']),
});

export async function PATCH(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON');
    }
    const parsed = tutorialActionSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    if (parsed.data.action === 'complete') {
      await completeTutorial(session.user.id);
    } else {
      await dismissTutorial(session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Tutorial update error');
  }
}
