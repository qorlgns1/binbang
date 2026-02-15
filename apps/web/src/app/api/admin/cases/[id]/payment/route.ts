import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { confirmPayment } from '@/services/casesService';

const paymentSchema = z.object({
  note: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const result = await confirmPayment({
      caseId: id,
      confirmedById: session.user.id,
      note: parsed.data.note,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Case not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === 'Payment already confirmed' || message.startsWith('Payment confirmation requires')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Admin payment confirmation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
