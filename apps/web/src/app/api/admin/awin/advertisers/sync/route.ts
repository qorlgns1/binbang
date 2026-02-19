import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { upsertFromProgrammes } from '@/services/admin/affiliate-advertiser.service';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

/** POST: Awin Programmes(joined)에서 목록 가져와 DB에 동기화 */
export async function POST(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = getAwinToken();
  if (!token) {
    return NextResponse.json({ error: 'AWIN_API_TOKEN is not set' }, { status: 400 });
  }
  const publisherId = await fetchPublisherId(token);
  if (publisherId == null) {
    return NextResponse.json({ error: 'Could not get publisher account.' }, { status: 400 });
  }
  const awinUrl = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmes`);
  awinUrl.searchParams.set('accessToken', token);
  awinUrl.searchParams.set('relationship', 'joined');
  const res = await fetch(awinUrl.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: 'Awin programmes fetch failed', status: res.status, body: text.slice(0, 300) },
      { status: 200 },
    );
  }
  const data = (await res.json()) as { programmes?: Array<{ id: number; name?: string }> };
  const programmes = (data.programmes ?? data) as Array<{
    id?: number;
    advertiserId?: number;
    name?: string;
  }>;
  const list = Array.isArray(programmes)
    ? programmes.map((p) => ({
        advertiserId: p.advertiserId ?? p.id ?? 0,
        name: p.name ?? String(p.advertiserId ?? p.id ?? ''),
      }))
    : [];
  if (list.length === 0) {
    return NextResponse.json({ message: 'No programmes returned', created: 0, updated: 0 });
  }
  try {
    const result = await upsertFromProgrammes({ programmes: list });
    return NextResponse.json({ message: 'Sync complete', ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upsert failed' },
      { status: 500 },
    );
  }
}
