import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { linkAccommodation } from '@/services/casesService';

const accommodationSchema = z.object({
  accommodationId: z.string().min(1),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = accommodationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const result = await linkAccommodation({
      caseId: id,
      accommodationId: parsed.data.accommodationId,
      changedById: session.user.id,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Case not found' || message === 'Accommodation not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.startsWith('Accommodation link requires')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Admin accommodation link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
