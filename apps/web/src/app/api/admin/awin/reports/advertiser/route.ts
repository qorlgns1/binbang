import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { fetchPublisherId, getAwinToken } from '@/lib/awin';

const AWIN_API_BASE = 'https://api.awin.com';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const REGIONS = new Set([
  'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'DE', 'DK', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'NL', 'NO', 'PL', 'SE', 'US',
]);
const DATE_TYPES = ['transaction', 'validation'] as const;

/**
 * Awin Reports API: 광고주별 집계 성과 (클릭/전환/노출 등)
 * GET /publishers/{publisherId}/reports/advertiser
 * @see https://help.awin.com/apidocs/get-advertiser-performance-report
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
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const region = (searchParams.get('region') ?? 'US').toUpperCase();
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return NextResponse.json(
      { ok: false, error: 'startDate and endDate required (yyyy-MM-dd).' },
      { status: 400 },
    );
  }
  if (!REGIONS.has(region)) {
    return NextResponse.json(
      { ok: false, error: `region must be one of: ${Array.from(REGIONS).join(', ')}` },
      { status: 400 },
    );
  }

  const dateTypeParam = searchParams.get('dateType');
  const dateType = DATE_TYPES.includes(dateTypeParam as (typeof DATE_TYPES)[number])
    ? (dateTypeParam as (typeof DATE_TYPES)[number])
    : undefined;
  const timezone = searchParams.get('timezone')?.trim();

  const url = new URL(`${AWIN_API_BASE}/publishers/${publisherId}/reports/advertiser`);
  url.searchParams.set('accessToken', token);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('region', region);
  if (dateType) url.searchParams.set('dateType', dateType);
  if (timezone) url.searchParams.set('timezone', timezone);

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
      message: 'Advertiser report retrieved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: 'Request failed', detail: message },
      { status: 200 },
    );
  }
}
