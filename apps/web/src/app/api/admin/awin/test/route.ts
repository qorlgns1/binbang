import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, testAwinConnection } from '@/services/admin/awin.service';

/** GET: Awin API 토큰 검증 */
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await testAwinConnection();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          hint: 'Set AWIN_API_TOKEN in .env or .env.local (Bearer token from https://ui.awin.com/awin-api)',
        },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
