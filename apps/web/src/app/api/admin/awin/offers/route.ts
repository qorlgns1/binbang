import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

/**
 * Awin Offers API: 프로모션/바우처 목록 조회
 * POST /publisher/{publisherId}/promotions
 * @see https://help.awin.com/v1-api/apidocs/promotions
 */
export async function POST(request: Request): Promise<Response> {
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
      { ok: false, error: 'Could not get publisher account. Check token and GET /accounts.' },
      { status: 400 },
    );
  }

  let body: { page?: number; pageSize?: number; membership?: string; type?: string; status?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is ok
  }
  if (!body || typeof body !== 'object') body = {};

  const page = typeof body.page === 'number' && body.page >= 1 ? body.page : 1;
  const pageSize =
    typeof body.pageSize === 'number' && body.pageSize >= 10 && body.pageSize <= 200 ? body.pageSize : 50;
  const membership =
    body.membership === 'joined' || body.membership === 'notJoined' || body.membership === 'all'
      ? body.membership
      : 'joined';
  const type =
    body.type === 'promotion' || body.type === 'voucher' || body.type === 'all' ? body.type : 'all';
  const status =
    body.status === 'active' || body.status === 'expiringSoon' || body.status === 'upcoming'
      ? body.status
      : 'active';

  const apiBody = {
    filters: { membership, type, status },
    pagination: { page, pageSize },
  };

  const url = new URL(`${AWIN_API_BASE}/publisher/${publisherId}/promotions`);
  url.searchParams.set('accessToken', token);

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(apiBody),
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
        {
          ok: false,
          status: res.status,
          statusText: res.statusText,
          body: data,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      body: data,
      message: 'Offers retrieved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
