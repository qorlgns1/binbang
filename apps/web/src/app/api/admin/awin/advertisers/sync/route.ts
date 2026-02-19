import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, syncAwinAdvertisers } from '@/services/admin/awin.service';

/** POST: Awin Programmes(joined)에서 목록 가져와 DB에 동기화 */
export async function POST(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAwinAdvertisers();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
