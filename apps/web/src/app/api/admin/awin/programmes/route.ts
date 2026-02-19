import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

const RELATIONSHIPS = ['joined', 'pending', 'suspended', 'rejected', 'notjoined'] as const;

/**
 * Awin Programmes API: 퍼블리셔가 가입한(또는 관계별) 광고주(프로그램) 목록 조회
 * GET /publishers/{publisherId}/programmes
 * @see https://developer.awin.com/apidocs/get-program-information-for-publisher-by-relationship-and-optionally-filter-by-country
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
      { ok: false, error: 'Could not get publisher account. Check token and GET /accounts.' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const relationshipParam = searchParams.get('relationship');
  const relationship = RELATIONSHIPS.includes(relationshipParam as (typeof RELATIONSHIPS)[number])
    ? (relationshipParam as (typeof RELATIONSHIPS)[number])
    : 'joined';
  const countryCode = searchParams.get('countryCode')?.trim();
  if (countryCode && countryCode.length !== 2) {
    return NextResponse.json(
      { ok: false, error: 'countryCode must be ISO Alpha-2 (2 letters) if provided' },
      { status: 400 },
    );
  }

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/programmes`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('relationship', relationship);
  if (countryCode) url.searchParams.set('countryCode', countryCode);

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
      message: `Programmes (relationship=${relationship}) retrieved.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
