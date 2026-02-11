import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { completeTutorial, dismissTutorial, getTutorialStatus } from '@/services/user.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getTutorialStatus(session.user.id);

    if (!status) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Tutorial status fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const tutorialActionSchema = z.object({
  action: z.enum(['complete', 'dismiss']),
});

export async function PATCH(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = tutorialActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    if (parsed.data.action === 'complete') {
      await completeTutorial(session.user.id);
    } else {
      await dismissTutorial(session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tutorial update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
