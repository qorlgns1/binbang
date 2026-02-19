import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';


/**
 * Awin Link Builder: 추적 링크 생성
 * POST /publishers/{publisherId}/linkbuilder/generate
 * @see https://developer.awin.com/apidocs/generatelink
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

  let body: { advertiserId?: number; destinationUrl?: string; clickref?: string; shorten?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const advertiserId = body.advertiserId;
  if (!body || typeof advertiserId !== 'number' || !Number.isInteger(advertiserId) || advertiserId <= 0) {
    return NextResponse.json(
      { ok: false, error: 'advertiserId (positive integer) is required' },
      { status: 400 },
    );
  }
  if (body.destinationUrl !== undefined && typeof body.destinationUrl !== 'string') {
    return NextResponse.json({ ok: false, error: 'destinationUrl must be a string if provided' }, { status: 400 });
  }
  if (body.clickref !== undefined && typeof body.clickref !== 'string') {
    return NextResponse.json({ ok: false, error: 'clickref must be a string if provided' }, { status: 400 });
  }
  if (body.shorten !== undefined && typeof body.shorten !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'shorten must be a boolean if provided' }, { status: 400 });
  }

  const publisherId = await fetchPublisherId(token);
  if (publisherId == null) {
    return NextResponse.json(
      { ok: false, error: 'Could not get publisher account. Check token and GET /accounts.' },
      { status: 400 },
    );
  }

  const apiBody: Record<string, unknown> = {
    advertiserId: body.advertiserId,
  };
  if (body.destinationUrl) apiBody.destinationUrl = body.destinationUrl;
  if (body.clickref) apiBody.parameters = { clickref: body.clickref };
  if (body.shorten === true) apiBody.shorten = true;

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/linkbuilder/generate`);
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
      message: 'Link generated.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
