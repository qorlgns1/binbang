import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { AwinConfigError, testAwinConnection } from '@/services/admin/awin.service';

/** GET: Awin API 토큰 검증 */
export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
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
    return handleServiceError(err, 'Awin test connection error');
  }
}
