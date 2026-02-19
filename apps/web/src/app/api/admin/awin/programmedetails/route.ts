import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

/**
 * Awin Programme Details API: 특정 광고주(프로그램) 상세 정보 (수수료, KPI 등)
 * GET /publishers/{publisherId}/programmedetails
 * @see https://developer.awin.com/apidocs/get-program-information-details-for-publisher
 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = getAwinToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'AWIN_API_TOKEN is not set' },
      { status: 400 },
    );
  }

  const publisherId = await fetchPublisherId(token);
  if (publisherId == null) {
    return NextResponse.json(
      { ok: false, error: 'Could not get publisher account.' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const advertiserId = searchParams.get('advertiserId')?.trim();
  const aid = advertiserId ? Number.parseInt(advertiserId, 10) : NaN;
  if (!advertiserId || !Number.isInteger(aid) || aid <= 0) {
    return NextResponse.json(
      { ok: false, error: 'advertiserId (positive integer) is required.' },
      { status: 400 },
    );
  }

  const relationshipParam = searchParams.get('relationship');
  const relationship =
    relationshipParam === 'joined' || relationshipParam === 'pending' || relationshipParam === 'notjoined'
      ? relationshipParam
      : 'joined';

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmedetails`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('advertiserId', String(aid));
  url.searchParams.set('relationship', relationship);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 500) };
    }

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, statusText: res.statusText, body: data },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      body: data,
      message: 'Programme details retrieved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
