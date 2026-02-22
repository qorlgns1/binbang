import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError } from '@/lib/handleServiceError';
import { getSettings, updateSettings } from '@/services/admin/settings.service';

const settingsUpdateSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
        minValue: z.string().optional(),
        maxValue: z.string().optional(),
      }),
    )
    .min(1),
});

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await getSettings();

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Admin settings GET error');
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = settingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.issues }, { status: 400 });
    }

    const response = await updateSettings({
      settings: parsed.data.settings,
      changedById: session.user.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Admin settings PATCH error');
  }
}
