import { timingSafeEqual } from 'node:crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createFormSubmission } from '@/services/intake.service';

// ============================================================================
// Validation
// ============================================================================

const googleFormWebhookSchema = z.object({
  responseId: z.string().min(1, 'responseId is required'),
  rawPayload: z.record(z.unknown()).refine((val) => Object.keys(val).length > 0, {
    message: 'rawPayload must not be empty',
  }),
});

// ============================================================================
// Auth
// ============================================================================

function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.GOOGLE_FORM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('GOOGLE_FORM_WEBHOOK_SECRET is not configured');
    return false;
  }

  const provided = request.headers.get('x-webhook-secret');
  if (!provided) {
    return false;
  }

  try {
    const expected = Buffer.from(secret, 'utf8');
    const actual = Buffer.from(provided, 'utf8');

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<Response> {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = googleFormWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const sourceIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;

    const result = await createFormSubmission({
      responseId: parsed.data.responseId,
      rawPayload: parsed.data.rawPayload,
      sourceIp,
    });

    if (result.created) {
      return NextResponse.json({ submission: result.submission }, { status: 201 });
    }

    return NextResponse.json({ submission: result.submission, duplicate: true }, { status: 200 });
  } catch (error) {
    console.error('Google Form webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
